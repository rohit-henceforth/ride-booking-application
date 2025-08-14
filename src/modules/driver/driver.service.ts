import {
  BadRequestException,
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { SetupDriverAccountDto } from './dto/setup-driver-account.dto copy';
import ApiResponse from 'src/common/helpers/api-response';
import { InjectModel } from '@nestjs/mongoose';
import {
  User,
  UserDocument,
  VehicleDetails,
  VehicleDetailsDocument,
} from 'src/common/schema/user.schema';
import { Model } from 'mongoose';
import { EarningService } from 'src/common/earning/earning.service';
import { PaymentService } from 'src/common/payment/payment.service';
import { PdfService } from 'src/common/pdf/pdf.service';
import { MailService } from 'src/common/mail/mail.service';

@Injectable()
export class DriverService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(VehicleDetails.name)
    private readonly vehicleDetailsModel: Model<VehicleDetailsDocument>,
    @Inject(forwardRef(() => PaymentService))
    private readonly paymentService: PaymentService,
    @Inject(forwardRef(() => EarningService))
    private readonly earningService: EarningService,
    private readonly pdfService : PdfService,
    private readonly mailService : MailService,
  ) {}

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

    console.log(driver);

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

  async getDriverEarnings(request: any) {
    const driverId = request.user?._id;

    return await this.earningService.getWeeklyEarnings(driverId.toString());
  }

  async createPayoutAccount(request: any) {
    const driverId = request.user?._id;

    if (!driverId) {
      throw new BadRequestException('Driver id is required!');
    }

    const driver = await this.userModel.findOne({
      _id: driverId,
      role: 'driver',
    });

    if (!driver) {
      throw new UnauthorizedException('Driver not found!');
    }

    if (driver?.stripeAccountId) {
      throw new BadRequestException(
        'Payout account already exist. Try generating onboarding link!',
      );
    }

    const accountId = await this.paymentService.handleCreateConnectAccount(
      request.user.email,
    );

    if (!accountId) {
      throw new BadRequestException(
        'Something went wrong, while creating account. Please try again.',
      );
    }

    const onboardingLink =
      await this.paymentService.getOnboardingLink(accountId);

    if (!onboardingLink) {
      throw new BadRequestException(
        'Something went wrong, while creating onboarding link. Please try again.',
      );
    }

    const updatedUser = await this.userModel.findOneAndUpdate(
      {
        _id: driverId,
        role: 'driver',
      },
      {
        $set: {
          stripeAccountId: accountId,
        },
      },
      {
        new: true,
      },
    );

    return new ApiResponse<any>(
      true,
      'Payout account created successfully',
      HttpStatus.CREATED,
      {
        onboardingLink,
      },
    );
  }

  async createPayoutAccountLink(request: any) {
    const driver = request.user;

    if (!driver) {
      throw new UnauthorizedException('Driver not found!');
    }

    if (!driver?.stripeAccountId) {
      throw new BadRequestException(
        "Payout account doesn't exist. Please create one!",
      );
    }

    const onboardingLink = await this.paymentService.getOnboardingLink(
      driver.stripeAccountId,
    );

    return new ApiResponse<any>(
      true,
      'Onboarding link created successfully',
      HttpStatus.CREATED,
      {
        onboardingLink,
      },
    );
  }

  async getPayoutEligibleDrivers() {
    const drivers = await this.userModel.find({
      role: 'driver',
    });

    const payoutEligibleDrivers: User[] = [];

    for (const driver of drivers) {
      if (!driver?.stripeAccountId) {
        continue;
      }

      const account = await this.paymentService.getStripeAccount(
        driver.stripeAccountId,
      );

      if (!account?.details_submitted || !account?.payouts_enabled) {
        continue;
      }

      payoutEligibleDrivers.push(driver);
    }

    return payoutEligibleDrivers;
  }

  async getDriverDueEarnings(driverId: string) {
    return await this.earningService.getDriverDueEarnings(driverId);
  }

  async handlePayout(driver: any, earnings: any) {
    try {
      const totalAmount = earnings.reduce((total, earning) => {
        return total + earning.amount;
      }, 0);

      console.log(totalAmount);

      await this.paymentService.handleCreateTransfer(
        totalAmount,
        driver.stripeAccountId,
      );

      await this.paymentService.handleCreatePayout(
        totalAmount,
        driver.stripeAccountId,
      );

      for (const earning of earnings) {
        await this.earningService.markAsPaid(earning?._id.toString());
      }
    } catch (error) {
      Logger.log(error);
    }
  }

}
