import { Body, Controller, Delete, Get, Patch, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { UsersService } from './users.service';
import { SignUpDto } from './dto/sign-up.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { LoginDto } from './dto/login.dto';
import { LoginOtpDto } from './dto/login-otp.dto';
import { LoginByOtpDto } from './dto/login-by-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { UploadInterceptor } from 'src/common/inerceptors/file-upload.interceptor';
import { Roles } from 'src/common/decorators/role.decorator';
import { Role } from 'src/common/enums/role.enum';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RolesGuard } from 'src/common/guards/role.guard';

@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get("")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  getUserProfileInfo(@Req() request){
    return this.usersService.getUserProfileInfo(request) ;
  }

  @Post("sign-up")
  signUpUser(@Body() signUpDto: SignUpDto) {
    return this.usersService.signUp(signUpDto);
  }

  @Patch("verify-user")
  verifyUser(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.usersService.verifyUser(verifyEmailDto);
  }

  @Post("login")
  login(@Body() loginDto: LoginDto) {
    return this.usersService.login(loginDto);
  }

  @Delete("logout")
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  logout(@Req() request : Request) {
    return this.usersService.logout(request);
  }

  @Post("refresh-token")
  refreshAccessToken(@Body() refreshTokenDto : RefreshTokenDto) {
    return this.usersService.refreshAccessToken(refreshTokenDto)
  }

  @Post("generate-login-otp")
  generateLoginOtp(@Body() loginOtpDto: LoginOtpDto) {
    return this.usersService.generateLoginOtp(loginOtpDto);
  }


  @Post("login-by-otp")
  loginByOtp(@Body() loginByOtpDto: LoginByOtpDto) {
    return this.usersService.loginByOtp(loginByOtpDto);
  }

  @Post("forget-password")
  generateForgetPasswordOtp(@Body() forgetPasswordDto: LoginOtpDto) {
    return this.usersService.generateForgetPasswordOtp(forgetPasswordDto)
  }

  @Post("forget-password/verify")
  gverifyForgetPasswordOtp(@Body() verifyResetPasswordDto: LoginByOtpDto) {
    return this.usersService.verifyForgetPasswordOtp(verifyResetPasswordDto)
  }

  @Post("reset-password")
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.usersService.resetPassword(resetPasswordDto)
  }

  @Patch("upload-profile")
  @UseInterceptors(UploadInterceptor())
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiBearerAuth()
  @Roles(Role.User)
  @UseGuards(AuthGuard,RolesGuard)
  uploadProfilePic(@Req() request : Request, @UploadedFile() profilePicFile : Express.Multer.File,) {
    return this.usersService.uploadProfilePic(request,profilePicFile);
  }

}
