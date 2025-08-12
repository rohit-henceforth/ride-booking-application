import { Module } from '@nestjs/common';
import { RideService } from './ride.service';
import { RideController } from './ride.controller';
import { RideGateway } from './ride.gateway';
import { JwtModule } from '@nestjs/jwt';
import { RideCronService } from './ride.cron.service';

@Module({
  imports : [
    JwtModule
  ],
  controllers: [RideController],
  providers: [RideService,RideGateway,RideCronService],
})
export class RideModule {}
