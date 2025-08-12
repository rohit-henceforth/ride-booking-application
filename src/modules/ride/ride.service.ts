import {
  BadGatewayException,
  BadRequestException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Ride, RideDocument } from '../../common/schema/ride.schema';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import ApiResponse from 'src/common/helpers/api-response';
import { CreateRideDto } from './dto/create-ride.dto';
import { RideGateway } from './ride.gateway';
import { User, UserDocument } from 'src/common/schema/user.schema';

@Injectable()
export class RideService {
  constructor(
    @InjectModel(Ride.name) private readonly rideModel: Model<RideDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly rideGateway: RideGateway,
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

    if (!nearbyDrivers || nearbyDrivers.length === 0) {
      const nearbyDriversWithin7Kms = await this.getNearbyDrivers(
        ride.pickupLocation,
        7,
        ride.vehicleType,
      );

      if (nearbyDriversWithin7Kms && nearbyDriversWithin7Kms.length === 0) {
        await this.rideModel.findByIdAndDelete(ride._id);
        throw new BadGatewayException(
          'Sorry currently no driver is available in your area!',
        );
      }

      await this.rideModel.findByIdAndUpdate(ride._id, {
        sentToRadius: 7,
      });

      nearbyDrivers.push(...nearbyDriversWithin7Kms);
    }

    for (const driver of nearbyDrivers) {
      this.rideGateway.sendRideRequest(driver._id.toString(), ride);
    }
  }

  async createRide(
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

    const newRide = await this.rideModel.create({
      pickupLocation: {
        type: 'Point',
        coordinates: pickupLocationCoordinates,
      },
      dropoffLocation: {
        type: 'Point',
        coordinates: dropoffLocationCoordinates,
      },
      bookedBy: request.user._id,
      vehicleType,
    });

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
        },
      },
    ]);

    await this.sendRideRequestToDrivers(newRideDetails[0]);

    return new ApiResponse(
      true,
      'Ride created successfully!',
      HttpStatus.OK,
      newRideDetails[0],
    );
  }

  async acceptRide(rideId: string, request: any): Promise<ApiResponse<any>> {

    const driver = request.user;

    if (!driver || driver.role !== 'driver') {
      throw new UnauthorizedException('You are not a driver!');
    }

    const ride = await this.rideModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(rideId),
        status: 'processing',
      },
      {
        $set: {
          driver: driver._id,
          status: 'accepted',
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

    const updatedRide = await this.rideModel.aggregate([
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
              $unwind: '$vehicleDetails',
            },
          ],
        },
      },
      {
        $unwind: '$driver',
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
        },
      },
    ]);

    this.rideGateway.sendRideAccepted(ride.bookedBy.toString(), updatedRide[0]);

    return new ApiResponse<any>(
      true,
      'Ride has been accepted successfully!',
      HttpStatus.OK,
      updatedRide[0],
    );
  }

}
