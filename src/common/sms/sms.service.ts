import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

@Injectable()
export class SmsService {

    private twilioClient: Twilio;

    constructor(private configService: ConfigService) {
        this.twilioClient = new Twilio(
            this.configService.get<string>('TWILIO_ACCOUNT_SID'),
            this.configService.get<string>('TWILIO_AUTH_TOKEN'),
        );
    }

    private async sendSms(body : string){
        return await this.twilioClient.messages.create({
            from: this.configService.get<string>('TWILIO_PHONE_NUMBER'),
            to: this.configService.get<string>('TWILIO_MY_NUMBER')!,
            body,
        });
    }

    async sendLoginOtpSms(otp: number): Promise<any> {
        return this.sendSms(`Dear user, your otp for login to your account is : ${otp}`);
    }

    async sendVerificationOtpSms(otp: number): Promise<any> {
        return this.sendSms(`Dear user, your otp to verify your account is : ${otp}`);
    }

    async sendForgetPasswordOtpSms(otp: number): Promise<any> {
        return this.sendSms(`Dear user, your otp to reset your password is : ${otp}`);
    }

}
