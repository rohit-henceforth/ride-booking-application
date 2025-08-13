import { Module } from '@nestjs/common';
import { DriverService } from './driver.service';
import { DriverController } from './driver.controller';
import { JwtModule } from '@nestjs/jwt';
import { EarningModule } from 'src/common/earning/earning.module';

@Module({
  imports: [JwtModule,EarningModule],
  controllers: [DriverController],
  providers: [DriverService],
})
export class DriverModule {}