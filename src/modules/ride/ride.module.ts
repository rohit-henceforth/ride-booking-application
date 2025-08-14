import { forwardRef, Module } from '@nestjs/common';
import { RideService } from './ride.service';
import { RideController } from './ride.controller';
import { RideGateway } from './ride.gateway';
import { JwtModule } from '@nestjs/jwt';
import { RideCronService } from './ride.cron.service';
import { PaymentModule } from 'src/common/payment/payment.module';
import { EarningModule } from 'src/common/earning/earning.module';
import { PdfModule } from 'src/common/pdf/pdf.module';
import { MailModule } from 'src/common/mail/mail.module';

@Module({
  imports: [
    JwtModule,
    forwardRef(() => PaymentModule), 
    forwardRef(() => EarningModule),
    PdfModule,
    MailModule
  ],
  controllers: [RideController],
  providers: [RideService, RideGateway, RideCronService],
  exports: [RideService]
})
export class RideModule {}