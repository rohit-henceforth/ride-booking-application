import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RideGateway } from './ride.gateway';
import { Ride, RideDocument } from '../../common/schema/ride.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from 'src/common/schema/user.schema';
import { Payment, PaymentDocument } from 'src/common/schema/payment.schema';
import { PaymentService } from 'src/common/payment/payment.service';

@Injectable()
export class RideCronService {
  constructor(
    @InjectModel(Ride.name) private readonly rideModel: Model<RideDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Payment.name) private readonly paymentModel: Model<PaymentDocument>,
    private readonly paymentService: PaymentService,
    private readonly rideGateway: RideGateway,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async retryUnacceptedRides() {
    
    const threshold = new Date(Date.now() - 2 * 60 * 1000);

    const ridesToRetry = await this.rideModel.aggregate([
      {
        $match: {
          status: 'processing',
          updatedAt: { $lte: threshold },
        },
      },
      {
        $lookup : {
          from: 'users',
          localField: 'bookedBy',
          foreignField: '_id',
          as: 'bookedBy'
        }
      },
      {
        $unwind : '$bookedBy'
      },
      {
        $project : {
          _id: 1,
          status: 1,
          sentToRadius: 1,
          vehicleType : 1,
          pickupLocation: "$pickupLocation.coordinates",
          dropoffLocation: "$dropoffLocation.coordinates",
          bookedBy: {
            _id : "$bookedBy._id",
            name: "$bookedBy.name",
            email: "$bookedBy.email",
            contactNumber: "$bookedBy.contactNumber",
            profilePic: "$bookedBy.profilePic",
          }
        }
      }
    ]);

    for (const ride of ridesToRetry as any) {
      if (ride.sentToRadius === 7) {
        await this.rideModel.findByIdAndUpdate(ride._id, {
          $set: {
            status: 'terminated',
          },
        })
        const payment = await this.paymentModel.findOne({ride : ride._id});
        if(payment){
          await this.paymentService.handleRefund(payment?.paymentIntentId);
        }
        this.rideGateway.sendRideTerminated(ride.bookedBy._id.toString(), {...ride,sentToRadius : null, status : 'terminated'});
      } else {
        const nearbyDrivers = await this.userModel.find({
          role: 'driver',
          location: {
            $near: {
              $geometry: {
                type : "Point",
                coordinates : ride.pickupLocation
              },
              $maxDistance: 7000,
            },
          },
        });

        this.rideGateway.sendRadiusUpdate(ride.bookedBy._id.toString(), {...ride,sentToRadius : 7});

        for (const driver of nearbyDrivers) {
          this.rideGateway.sendRideRequest(driver._id.toString(), {...ride,sentToRadius : null});
        }

        await this.rideModel.findByIdAndUpdate(ride._id, {
          $set: {
            sentToRadius: 7,
          },
        });
      }
    }

  }
}
