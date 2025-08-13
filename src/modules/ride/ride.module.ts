import { forwardRef, Module } from '@nestjs/common';
import { RideService } from './ride.service';
import { RideController } from './ride.controller';
import { RideGateway } from './ride.gateway';
import { JwtModule } from '@nestjs/jwt';
import { RideCronService } from './ride.cron.service';
import { PaymentModule } from 'src/common/payment/payment.module';

@Module({
  imports : [
    JwtModule,
    forwardRef(() => PaymentModule)
  ],
  controllers: [RideController],
  providers: [RideService,RideGateway,RideCronService],
  exports : [RideService]
})
export class RideModule {}
