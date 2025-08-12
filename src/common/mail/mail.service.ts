import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

@Injectable()
export class MailService {

    private transporter: nodemailer.Transporter;

    constructor(private configService: ConfigService) {

        this.transporter = nodemailer.createTransport({
            host: this.configService.get('MAIL_HOST'),
            port: this.configService.get('MAIL_PORT'),
            secure: false,
            auth: {
                user: this.configService.get('MAIL_USER'),
                pass: this.configService.get('MAIL_PASS'),
            }
        })

    }

    async sendOtpEmail(to: string, otp: number) {
        await this.transporter.sendMail({
            from: this.configService.get('MAIL_USER'),
            to,
            subject: 'Your OTP Code',
            text: `Your OTP to signUp on User APIs is : ${otp}`,
            html: `<h3>Your OTP to signUp on User APIs is : <b>${otp}</b></h3>`,
        });

    }

    async sendLoginOtpEmail(to: string, otp: number) {
        await this.transporter.sendMail({
            from: this.configService.get('MAIL_USER'),
            to,
            subject: 'Your Login OTP Code',
            text: `Your OTP to login on User APIs is : ${otp}`,
            html: `<h3>Your OTP to login on User APIs is : <b>${otp}</b></h3>`,
        });

    }

    async sendForgetPasswordOtpEmail(to: string, otp: number) {
        await this.transporter.sendMail({
            from: this.configService.get('MAIL_USER'),
            to,
            subject: 'Your Password Reset OTP Code',
            text: `Your OTP to reset password of User APIs is : ${otp}`,
            html: `<h3>Your OTP to reset of User APIs is : <b>${otp}</b></h3>`,
        });

    }

}