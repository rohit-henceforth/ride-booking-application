import { BadRequestException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { SetupDriverAccountDto } from './dto/setup-driver-account.dto copy';
import ApiResponse from 'src/common/helpers/api-response';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, VehicleDetails, VehicleDetailsDocument } from 'src/common/schema/user.schema';
import { Model } from 'mongoose';
import { EarningService } from 'src/common/earning/earning.service';

@Injectable()
export class DriverService {

    constructor(
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
        @InjectModel(VehicleDetails.name) private readonly vehicleDetailsModel: Model<VehicleDetailsDocument>,
        private readonly earningService: EarningService
    ){}

      async setupDriverAccount(
        request: any,
        setupDriverAccountDto: SetupDriverAccountDto,
      ): Promise<ApiResponse<any>> {
        const driverId = request?.user?._id;
    
        const driver = await this.userModel.findOne({
          _id: driverId,
          role: 'driver',
        });
    
        if (!driver) {
          throw new UnauthorizedException('Driver not found!');
        }

        console.log(driver)
    
        const { coordinates, vehicleInfo } = setupDriverAccountDto;
    
        if (
          !coordinates ||
          !Array.isArray(coordinates) ||
          coordinates.length !== 2
        ) {
          throw new BadRequestException('Coordinates are required!');
        }
    
        if (
          !vehicleInfo ||
          !vehicleInfo?.type ||
          !vehicleInfo?.numberPlate ||
          !vehicleInfo?.model
        ) {
          throw new BadRequestException('Vehicle info is required!');
        }

        if (driver?.vehicleDetails) {
          await this.vehicleDetailsModel.findByIdAndDelete(driver?.vehicleDetails);
        }
    
        const newVehicleDetails = await this.vehicleDetailsModel.create({
          type: vehicleInfo?.type,
          numberPlate: vehicleInfo?.numberPlate,
          model: vehicleInfo?.model,
        });
    
        const updatedDriverInfo = await this.userModel
          .findByIdAndUpdate(
            driverId,
            {
              $set: {
                location: {
                  type: 'Point',
                  coordinates,
                },
                vehicleDetails: newVehicleDetails?._id,
              },
            },
            {
              new: true,
            },
          )
          .populate('vehicleDetails')
          .select(
            'location vehicleDetails name email contactNumber isEmailVerified isContactNumberVerified profilePic role',
          );
    
        return new ApiResponse<any>(
          true,
          'Driver account setup successfully',
          HttpStatus.CREATED,
          updatedDriverInfo,
        );
      }

      async getDriverEarnings(request : any) {

        const driverId = request.user?._id ;

        return await this.earningService.getWeeklyEarnings(driverId.toString());

      }
    

}
