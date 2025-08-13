import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DriverEarning } from '../schema/earning.schema';
import { Model, Types } from 'mongoose';
import * as moment from 'moment-timezone';

@Injectable()
export class EarningService {
  constructor(
    @InjectModel(DriverEarning.name)
    private readonly driverEarningModel: Model<DriverEarning>,
  ) {}

  async createDriverEarning(rideDetails: any) {
    const driversShareAmount =
      (rideDetails?.paymentDetails?.amount * 0.9) / 100;

    await this.driverEarningModel.create({
      driver: rideDetails.driver._id,
      ride: rideDetails._id,
      payment: rideDetails.paymentDetails._id,
      amount: driversShareAmount,
      status: 'pending',
      currency: rideDetails.paymentDetails.currency,
    });

    return driversShareAmount;
  }

  async getWeeklyEarnings(driverId: string) {
    const earnings = await this.driverEarningModel.aggregate([
      {
        $match: {
          driver: new Types.ObjectId(driverId),
          status: 'pending',
        },
      },
      {
        $addFields: {
          weekStart: {
            $dateTrunc: {
              date: '$createdAt',
              unit: 'week',
              binSize: 1,
              timezone: 'Asia/Kolkata',
              startOfWeek: 'sunday',
            },
          },
        },
      },
      {
        $addFields: {
          weekEnd: {
            $dateAdd: {
              startDate: '$weekStart',
              unit: 'day',
              amount: 7,
            },
          },
        },
      },
      {
        $group: {
          _id: '$weekStart',
          weekEnd: { $first: '$weekEnd' },
          totalEarnings: { $sum: '$amount' },
          currency: { $first: '$currency' },
          rides: { $push: '$ride' },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    return earnings.map((week) => ({
      weekStart: moment(week._id).tz('Asia/Kolkata').format(),
      weekEnd: moment(week.weekEnd).tz('Asia/Kolkata').format(),
      totalEarnings: week.totalEarnings,
      currency: week.currency || 'inr',
      rides: week.rides?.length,
    }));
  }

}
