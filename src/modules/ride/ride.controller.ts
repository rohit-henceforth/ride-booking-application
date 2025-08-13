import { Controller, Get, Post, Body, Param, Req, UseGuards, Patch } from '@nestjs/common';
import { RideService } from './ride.service';
import { CreateRideDto } from './dto/create-ride.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/role.decorator';
import { Role } from 'src/common/enums/role.enum';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { StartRideDto } from './dto/start-ride.dto';
import { CompleteRideDto } from './dto/complete-ride.dto';

@Controller('ride')
export class RideController {
  constructor(private readonly rideService: RideService) {}

  @Post()
  @ApiBearerAuth()
  @Roles(Role.User)
  @UseGuards(AuthGuard, RolesGuard)
  create(@Req() request: any, @Body() createRideDto: CreateRideDto) {
    return this.rideService.initiateRide(request,createRideDto);
  }

  @ApiBearerAuth()
  @Roles(Role.Driver)
  @UseGuards(AuthGuard, RolesGuard)
  @Get("accept/:rideId")
  handleAcceptRide(@Param('rideId') rideId: string, @Req() request: any) {
    return this.rideService.acceptRide(rideId, request);
  }


  @ApiBearerAuth()
  @Roles(Role.Driver)
  @UseGuards(AuthGuard, RolesGuard)
  @Patch("start")
  handleStartRide(@Body() startRideDto: StartRideDto, @Req() request: any) {
    return this.rideService.startRide(startRideDto, request);
  }

  @ApiBearerAuth()
  @Roles(Role.Driver)
  @UseGuards(AuthGuard, RolesGuard)
  @Patch("complete")
  handleCompleteRide(@Body() completeRideDto: CompleteRideDto, @Req() request: any) {
    return this.rideService.completeRide(completeRideDto, request);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Patch("cancel/:rideId")
  handleCancel(@Param('rideId') rideId: string, @Req() request: any) {
    return this.rideService.cancelRide(rideId, request);
  }
  
}
