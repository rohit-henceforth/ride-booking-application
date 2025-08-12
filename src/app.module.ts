import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './modules/users/users.module';
import { TokenService } from './common/token/token.service';
import { SmsService } from './common/sms/sms.service';
import ConfigureDB from './common/db/db';
import { JwtModule } from '@nestjs/jwt';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { CloudinaryService } from './common/cloudinary/cloudinary.service';
import { CloudinaryModule } from './common/cloudinary/cloudinary.module';
import { AdminModule } from './modules/admin/admin.module';
import { ErrorModuleModule } from './common/logs/error_module/error_module.module';
import { ActivityLogsModule } from './common/logs/activity_logs/activity_logs.module';
import { OtpModule } from './common/otp/otp.module';
import { PaymentModule } from './common/payment/payment.module';
import { RideModule } from './modules/ride/ride.module';
import { ScheduleModule } from '@nestjs/schedule';
import { DriverModule } from './modules/driver/driver.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    UsersModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    ScheduleModule.forRoot(),
    JwtModule,
    ConfigureDB(),
    CloudinaryModule,
    AdminModule,
    ErrorModuleModule,
    ActivityLogsModule,
    OtpModule,
    PaymentModule,
    RideModule,
    DriverModule,
    CommonModule
  ],
  controllers: [],
  providers: [TokenService, SmsService, CloudinaryService]
})
export class AppModule {}