import {
  BadGatewayException,
  BadRequestException,
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  Ride,
  RideDocument,
  TemporaryRide,
  TemporaryRideDocument,
} from '../../common/schema/ride.schema';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import ApiResponse from 'src/common/helpers/api-response';
import { CreateRideDto } from './dto/create-ride.dto';
import { RideGateway } from './ride.gateway';
import { User, UserDocument } from 'src/common/schema/user.schema';
import { PaymentService } from 'src/common/payment/payment.service';
import { StartRideDto } from './dto/start-ride.dto';
import { Payment, PaymentDocument } from 'src/common/schema/payment.schema';
import { CompleteRideDto } from './dto/complete-ride.dto';
import { EarningService } from 'src/common/earning/earning.service';
import { PdfService } from 'src/common/pdf/pdf.service';
import { MailService } from 'src/common/mail/mail.service';

@Injectable()
export class RideService {
  constructor(
    @InjectModel(Ride.name) private readonly rideModel: Model<RideDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(TemporaryRide.name)
    private readonly temporaryRideModel: Model<TemporaryRideDocument>,
    private readonly rideGateway: RideGateway,
    @Inject(forwardRef(() => PaymentService))
    private readonly paymentService: PaymentService,
    @Inject(forwardRef(() => EarningService))
    private readonly earningService: EarningService,
    private readonly pdfService: PdfService,
    private readonly mailService: MailService,
  ) {}

  private getDistanceKm(coord1: number[], coord2: number[]) {
    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;
    const earthRadius = 6371;

    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;

    return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private async getRideDetails(rideId: string) {
    const rideDetails = await this.rideModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(rideId),
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'driver',
          foreignField: '_id',
          as: 'driver',
          pipeline: [
            {
              $lookup: {
                from: 'vehicledetails',
                localField: 'vehicleDetails',
                foreignField: '_id',
                as: 'vehicleDetails',
              },
            },
            {
              $unwind: {
                path: '$vehicleDetails',
                preserveNullAndEmptyArrays: true,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$driver',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'bookedBy',
          foreignField: '_id',
          as: 'bookedBy',
        },
      },
      {
        $unwind: '$bookedBy',
      },
      {
        $lookup: {
          from: 'payments',
          localField: '_id',
          foreignField: 'ride',
          as: 'paymentDetails',
        },
      },
      {
        $unwind: '$paymentDetails',
      },
      {
        $project: {
          _id: 1,
          driver: {
            _id: 1,
            email: 1,
            contactNumber: 1,
            name: 1,
            profilePic: 1,
          },
          bookedBy: {
            _id: 1,
            name: 1,
            profilePic: 1,
            email: 1,
            contactNumber: 1,
          },
          vehicleType: 1,
          vehicleDetails: {
            type: '$driver.vehicleDetails.type',
            model: '$driver.vehicleDetails.model',
            number: '$driver.vehicleDetails.numberPlate',
          },
          status: 1,
          pickupLocation: '$pickupLocation.coordinates',
          dropoffLocation: '$dropoffLocation.coordinates',
          paymentMode: 1,
          paymentDetails: {
            _id: 1,
            amount: 1,
            paymentMethod: 1,
            status: 1,
            currency: 1,
            paymentIntentId: 1,
          },
        },
      },
    ]);

    return rideDetails[0];
  }

  private calculateFare(distance: number) {
    return Number(Math.ceil(20 + distance * 10));
  }

  private async getNearbyDrivers(
    coordinates: [number, number],
    radius: number,
    requestedVehicleType: string,
  ) {
    return await this.userModel.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates,
          },
          distanceField: 'distance',
          maxDistance: radius * 1000,
          spherical: true,
        },
      },
      {
        $match: {
          role: 'driver',
        },
      },
      {
        $lookup: {
          from: 'vehicledetails',
          localField: 'vehicleDetails',
          foreignField: '_id',
          as: 'vehicleDetails',
        },
      },
      {
        $unwind: '$vehicleDetails',
      },
      {
        $match: {
          'vehicleDetails.type': requestedVehicleType,
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          location: 1,
          vehicleDetails: {
            type: 1,
            model: 1,
            numberPlate: 1,
          },
          distance: 1,
        },
      },
    ]);
  }

  private async sendRideRequestToDrivers(ride: any) {
    const nearbyDrivers = await this.getNearbyDrivers(
      ride.pickupLocation,
      5,
      ride.vehicleType,
    );

    let sentToRadius = 5;

    if (!nearbyDrivers || nearbyDrivers.length === 0) {
      const nearbyDriversWithin7Kms = await this.getNearbyDrivers(
        ride.pickupLocation,
        7,
        ride.vehicleType,
      );

      if (nearbyDriversWithin7Kms && nearbyDriversWithin7Kms.length === 0) {
        await this.rideModel.findByIdAndUpdate(ride._id, {
          $set: {
            status: 'failed',
          },
        });
        await this.paymentService.handleRefund(
          ride?.paymentDetails?.paymentIntentId,
        );
        return this.rideGateway.sendRideRequestFailed(
          ride?.bookedBy?._id.toString(),
          ride,
        );
      }

      await this.rideModel.findByIdAndUpdate(ride._id, {
        sentToRadius: 7,
      });

      sentToRadius = 7;

      nearbyDrivers.push(...nearbyDriversWithin7Kms);
    }

    for (const driver of nearbyDrivers) {
      this.rideGateway.sendRideRequest(driver._id.toString(), {
        ...ride,
        currency: ride.paymentDetails.currency,
        paymentDetails: undefined,
      });
    }

    return sentToRadius;
  }

  async createRide(rideId: string, payment: any) {
    try {
      const ride = await this.temporaryRideModel.findOne({
        _id: new Types.ObjectId(rideId),
        paymentSessionId: payment.paymentSessionId,
      });

      if (!ride) {
        throw new BadRequestException('Invalid Ride Id');
      }

      const newRide = await this.rideModel.create({
        bookedBy: ride?.bookedBy,
        vehicleType: ride?.vehicleType,
        pickupLocation: ride?.pickupLocation,
        dropoffLocation: ride?.dropoffLocation,
        distance: ride?.distance,
        fare: ride?.fare,
        status: 'processing',
        paymentMode: 'online',
      });

      payment.ride = newRide._id;
      await payment.save();

      const newRideDetails = await this.rideModel.aggregate([
        {
          $match: {
            _id: newRide._id,
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'bookedBy',
            foreignField: '_id',
            as: 'bookedBy',
          },
        },
        {
          $unwind: '$bookedBy',
        },
        {
          $lookup: {
            from: 'payments',
            localField: '_id',
            foreignField: 'ride',
            as: 'paymentDetails',
          },
        },
        {
          $unwind: '$paymentDetails',
        },
        {
          $project: {
            _id: 1,
            bookedBy: {
              _id: 1,
              name: 1,
              profilePic: 1,
              email: 1,
              contactNumber: 1,
            },
            vehicleType: 1,
            status: 1,
            pickupLocation: '$pickupLocation.coordinates',
            dropoffLocation: '$dropoffLocation.coordinates',
            paymentMode: 1,
            paymentDetails: {
              _id: 1,
              amount: 1,
              paymentMethod: 1,
              status: 1,
              currency: 1,
              paymentIntentId: 1,
            },
          },
        },
      ]);

      const baseFare = newRide?.fare / (1 + 18 / 100)

      await this.pdfService.createInvoice({
        rideId: 'ABC123',
        currency: 'INR',
        invoiceDate: new Date(Date.now()),
        clientName: newRideDetails[0]?.bookedBy?.name,
        invoiceNumber: 'INV123',
        clientPhone: newRideDetails[0]?.bookedBy?.contactNumber,
        items: [
          {
            description: 'Ride Fare',
            distance: newRide?.distance,
            total: baseFare
          },
        ],
        taxPercent: 18,
        discount: 0
      });

      await this.mailService.sendInvoice(newRideDetails[0]?.bookedBy?.name);

      const sentToRadius = await this.sendRideRequestToDrivers(
        newRideDetails[0],
      );

      const rideDetails = {
        ...newRideDetails,
        sentToRadius,
        currency: newRideDetails[0]?.paymentDetails?.currency,
        paymentDetails: undefined,
      };

      this.rideGateway.sendRideConfirmed(
        newRideDetails[0]?.bookedBy?._id.toString(),
        rideDetails,
      );

      this.rideGateway.sendRadiusUpdate(
        newRideDetails[0]?.bookedBy?._id.toString(),
        rideDetails,
      );

      await this.temporaryRideModel.findByIdAndDelete(ride._id);
    } catch (error) {
      console.log(error);
    }
  }

  async acceptRide(rideId: string, request: any): Promise<ApiResponse<any>> {
    const driver = request.user;

    if (!driver || driver.role !== 'driver') {
      throw new UnauthorizedException('You are not a driver!');
    }

    const otp = Math.floor(1000 + Math.random() * 9000);

    const ride = await this.rideModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(rideId),
        status: 'processing',
      },
      {
        $set: {
          driver: driver._id,
          status: 'accepted',
          otp,
        },
      },
      {
        new: true,
      },
    );

    if (!ride) {
      throw new BadRequestException(
        'Ride has been already accepted or not found!',
      );
    }

    const updatedRide = await this.getRideDetails(rideId);

    this.rideGateway.sendRideAccepted(ride.bookedBy.toString(), {
      ...updatedRide,
      paymentDetails: undefined,
      otp,
    });

    return new ApiResponse<any>(
      true,
      'Ride has been accepted successfully!',
      HttpStatus.OK,
      { ...updatedRide, paymentDetails: undefined },
    );
  }

  async initiateRide(
    request: any,
    createRideDto: CreateRideDto,
  ): Promise<ApiResponse<any>> {
    const {
      dropoffLocationCoordinates,
      pickupLocationCoordinates,
      vehicleType,
    } = createRideDto;

    if (!request.user?._id) {
      throw new UnauthorizedException('User not found!');
    }

    if (
      !dropoffLocationCoordinates ||
      !Array.isArray(dropoffLocationCoordinates) ||
      dropoffLocationCoordinates.length !== 2
    ) {
      throw new BadRequestException(
        'Dropoff location coordinates are required!',
      );
    }

    if (
      !pickupLocationCoordinates ||
      !Array.isArray(pickupLocationCoordinates) ||
      pickupLocationCoordinates.length !== 2
    ) {
      throw new BadRequestException(
        'Pickup location coordinates are required!',
      );
    }

    if (!vehicleType) {
      throw new BadRequestException('Vehicle type is required!');
    }

    const nearbyDrivers = await this.getNearbyDrivers(
      pickupLocationCoordinates,
      5,
      vehicleType,
    );

    if (!nearbyDrivers || nearbyDrivers.length === 0) {
      const nearbyDriversWithin7Kms = await this.getNearbyDrivers(
        pickupLocationCoordinates,
        7,
        vehicleType,
      );

      if (nearbyDriversWithin7Kms && nearbyDriversWithin7Kms.length === 0) {
        throw new BadRequestException('No drivers are available in your area!');
      }
    }

    const newRide = new this.temporaryRideModel({
      pickupLocation: {
        type: 'Point',
        coordinates: pickupLocationCoordinates,
      },
      dropoffLocation: {
        type: 'Point',
        coordinates: dropoffLocationCoordinates,
      },
      bookedBy: request.user._id,
      vehicleType: vehicleType,
    });

    const distance = this.getDistanceKm(
      pickupLocationCoordinates,
      dropoffLocationCoordinates,
    );

    const fare = this.calculateFare(distance);

    const totalFare = fare + fare * 0.18;

    const paymentCheckoutSession =
      await this.paymentService.createCheckoutSession(
        String(newRide._id),
        fare,
        'book-ride',
      );

    newRide.fare = totalFare;
    newRide.distance = distance;
    newRide.paymentSessionId = paymentCheckoutSession.id;

    await newRide.save();

    return new ApiResponse(
      true,
      'Payment session has been initiated.',
      HttpStatus.CREATED,
      {
        paymentUrl: paymentCheckoutSession.url,
      },
    );
  }

  async startRide(startRideDto: StartRideDto, request: any) {
    const { otp, rideId } = startRideDto;

    const driver = request.user._id;

    const newOtp = Math.floor(1000 + Math.random() * 9000);

    const updatedRide = await this.rideModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(rideId),
        otp: otp,
        driver,
        status: 'accepted',
      },
      {
        $set: {
          otp: newOtp,
          status: 'started',
        },
      },
      {
        new: true,
      },
    );

    if (!updatedRide) {
      throw new BadRequestException('Invalid OTP');
    }

    const rideDetails = await this.getRideDetails(rideId);

    this.rideGateway.sendRideStarted(rideDetails.bookedBy._id.toString(), {
      ...rideDetails,
      paymentDetails: undefined,
      otp: newOtp,
    });

    return new ApiResponse<any>(
      true,
      'Ride has been started successfully!',
      HttpStatus.OK,
      { ...rideDetails, paymentDetails: undefined },
    );
  }

  async cancelRide(rideId: string, request: any) {
    const userId = request.user._id;

    if (!userId) {
      throw new UnauthorizedException('User not found!');
    }

    const ride = await this.rideModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(rideId),
        $or: [
          {
            bookedBy: userId,
            status: { $in: ['processing', 'accepted'] },
          },
          {
            driver: userId,
            status: 'accepted',
          },
        ],
      },
      {
        $set: {
          status: 'cancelled',
        },
      },
    );

    if (!ride) {
      throw new BadRequestException("Can't cancel the ride!");
    }

    const rideDetails = await this.getRideDetails(rideId?.toString()!);

    if (rideDetails?.paymentDetails?.paymentIntentId) {
      await this.paymentService.handleRefund(
        rideDetails?.paymentDetails?.paymentIntentId,
      );
    }

    if (ride.bookedBy.toString() === userId.toString()) {
      await this.rideModel.findByIdAndUpdate(ride._id, {
        $set: { cancelledBy: 'user' },
      });
      if (ride.status === 'accepted') {
        this.rideGateway.sendRideCancelled(rideDetails?.driver._id.toString(), {
          message: 'The ride has been cancelled by customer.',
          rideDetails: {
            ...rideDetails,
            paymentDetails: undefined,
          },
        });
      }
    } else {
      await this.rideModel.findByIdAndUpdate(ride._id, {
        $set: { cancelledBy: 'driver' },
      });
      this.rideGateway.sendRideCancelled(rideDetails.bookedBy._id.toString(), {
        message: 'Your ride has been cancelled by rider.',
        rideDetails: {
          ...rideDetails,
          paymentDetails: undefined,
        },
      });
    }

    return new ApiResponse<any>(
      true,
      'Ride has been cancelled successfully!',
      HttpStatus.OK,
      { ...rideDetails, paymentDetails: undefined },
    );
  }

  async completeRide(completeRideDto: CompleteRideDto, request: any) {
    const { rideId, otp } = completeRideDto;

    console.log(request.user?._id);

    const ride = await this.rideModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(rideId),
        otp: otp,
        status: 'started',
        driver: request.user?._id,
      },
      {
        $set: {
          status: 'completed',
          otp: 0,
        },
      },
      {
        new: true,
      },
    );

    if (!ride) {
      throw new BadRequestException('Invalid OTP');
    }

    const rideDetails = await this.getRideDetails(rideId);

    console.log(rideDetails);

    const driversShareAmount =
      await this.earningService.createDriverEarning(rideDetails);

    this.rideGateway.sendRideCompleted(rideDetails.bookedBy._id.toString(), {
      ...rideDetails,
      paymentDetails: undefined,
    });

    return new ApiResponse<any>(
      true,
      'Ride has been completed successfully!',
      HttpStatus.OK,
      {
        ...rideDetails,
        paymentDetails: undefined,
        earnedAmount: driversShareAmount,
      },
    );
  }
}
