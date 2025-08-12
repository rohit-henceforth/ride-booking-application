import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { RideService } from './ride.service';
import { CreateRideDto } from './dto/create-ride.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/role.decorator';
import { Role } from 'src/common/enums/role.enum';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';

@Controller('ride')
export class RideController {
  constructor(private readonly rideService: RideService) {}

  @Post()
  @ApiBearerAuth()
  @Roles(Role.User)
  @UseGuards(AuthGuard, RolesGuard)
  create(@Req() request: any, @Body() createRideDto: CreateRideDto) {
    return this.rideService.createRide(request,createRideDto);
  }

  @ApiBearerAuth()
  @Roles(Role.Driver)
  @UseGuards(AuthGuard, RolesGuard)
  @Get("accept/:rideId")
  handleAcceptRide(@Param('rideId') rideId: string, @Req() request: any) {
    return this.rideService.acceptRide(rideId, request);
  }
  
}
