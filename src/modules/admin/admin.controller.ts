import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { GetUsersDto } from './dto/get-users.dto';
import { CreateNewEntryDto } from './dto/create-new-entery.dto';
import { Roles } from 'src/common/decorators/role.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { Role } from 'src/common/enums/role.enum';
import { ApiBearerAuth } from '@nestjs/swagger';
import { DeleteEntryDto } from './dto/delete-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';

@Controller('admin')
@UseGuards(AuthGuard,RolesGuard)
@ApiBearerAuth()
export class AdminController {
  
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @Roles(Role.Admin,Role.SuperAdmin)
  getUsers(@Query() getUsersDto : GetUsersDto){
    return this.adminService.getUsersDetails(getUsersDto);
  }

  @Post("create-admin")
  @Roles(Role.SuperAdmin)
  createNewAdmin(@Body() createNewEntryDto : CreateNewEntryDto){
    return this.adminService.createNewEntry(createNewEntryDto,Role.Admin);
  }

  @Post("create-user")
  @Roles(Role.Admin,Role.SuperAdmin)
  createNewUser(@Body() createNewEntryDto : CreateNewEntryDto){
    return this.adminService.createNewEntry(createNewEntryDto,Role.User);
  }


  @Delete("delete-admin/:_id")
  @Roles(Role.SuperAdmin)
  deleteAdmin(@Param() deleteEntryDto : DeleteEntryDto){
    return this.adminService.deleteEntry(deleteEntryDto,Role.Admin);
  }

  @Delete("delete-user/:_id")
  @Roles(Role.Admin,Role.SuperAdmin)
  deleteUser(@Param() deleteEntryDto : DeleteEntryDto){
    return this.adminService.deleteEntry(deleteEntryDto,Role.User);
  }

  @Patch("update-admin")
  @Roles(Role.SuperAdmin)
  updateAdminDetails(@Body() updateEntryDto : UpdateEntryDto){
    return this.adminService.deleteEntry(updateEntryDto,Role.Admin);
  } 

  @Patch("update-user")
  @Roles(Role.Admin,Role.SuperAdmin)
  updateUserDetails(@Body() updateEntryDto : UpdateEntryDto){
    return this.adminService.updateEntry(updateEntryDto,Role.User);
  }

}