import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { DriverService } from './driver.service';
import { Roles } from 'src/common/decorators/role.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { Role } from 'src/common/enums/role.enum';
import { SetupDriverAccountDto } from './dto/setup-driver-account.dto copy';

@Controller('driver')
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  @Post()
  @Roles(Role.Driver)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth()
  setupDriverAccount(
    @Req() request: any,
    @Body() setupDriverAccountDto: SetupDriverAccountDto,
  ) {
    return this.driverService.setupDriverAccount(request, setupDriverAccountDto);
  }
}
