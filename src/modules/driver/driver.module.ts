import { forwardRef, Module } from '@nestjs/common';
import { DriverService } from './driver.service';
import { DriverController } from './driver.controller';
import { JwtModule } from '@nestjs/jwt';
import { EarningModule } from 'src/common/earning/earning.module';
import { PaymentModule } from 'src/common/payment/payment.module';
import { PdfModule } from 'src/common/pdf/pdf.module';
import { MailModule } from 'src/common/mail/mail.module';

@Module({
  imports: [
    JwtModule,
    forwardRef(()=>PaymentModule),             
    forwardRef(() => EarningModule),
    PdfModule,
    MailModule
  ],
  controllers: [DriverController],
  providers: [DriverService],
  exports : [DriverService]
})
export class DriverModule {}