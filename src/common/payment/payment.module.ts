import { forwardRef, Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { RideModule } from 'src/modules/ride/ride.module';
import { PaymentController } from './payment.controller';

@Module({
  imports: [
    forwardRef(() => RideModule)
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}

