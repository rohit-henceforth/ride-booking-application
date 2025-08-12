import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MailModule } from 'src/common/mail/mail.module';
import { TokenModule } from 'src/common/token/token.module';
import { SmsModule } from 'src/common/sms/sms.module';
import { JwtModule } from '@nestjs/jwt';
import { CloudinaryModule } from 'src/common/cloudinary/cloudinary.module';
import { ActivityLogsModule } from 'src/common/logs/activity_logs/activity_logs.module';
import { OtpModule } from 'src/common/otp/otp.module';

@Module({
  imports : [
    MailModule,
    SmsModule,
    TokenModule,
    JwtModule,
    CloudinaryModule,
    ActivityLogsModule,
    OtpModule
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
