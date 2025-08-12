import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import mongoose from 'mongoose';

@Injectable()
export class TokenService {

    constructor(
        private configService: ConfigService,
        private jwtService: JwtService
    ) { }

    async generateResetPasswordToken(_id: mongoose.Types.ObjectId) {
        return await this.jwtService.sign(
            {
                _id
            },
            {
                secret: this.configService.get("RESET_PASSWORD_TOKEN"),
                expiresIn: "5m"
            }
        )
    }

    async generateAccessToken(_id: mongoose.Types.ObjectId) {
        return await this.jwtService.sign(
            {
                _id
            },
            {
                secret: this.configService.get("ACCESS_TOKEN_SECRET"),
                expiresIn: this.configService.get("ACCESS_TOKEN_EXPIRY")
            }
        )
    }

    async generateRefreshToken(_id: mongoose.Types.ObjectId) {
        return await this.jwtService.sign(
            {
                _id
            },
            {
                secret: this.configService.get("REFRESH_TOKEN_SECRET"),
                expiresIn: this.configService.get("REFRESH_TOKEN_EXPIRY")
            }
        )
    }

    async verifyRefeshToken(token: string) {
        return await this.jwtService.verify(
            token,
            {
                secret: this.configService.get("REFRESH_TOKEN_SECRET")
            }
        )
    }

    async verifyAccessToken(token: string) {
        return await this.jwtService.verify(
            token,
            {
                secret: this.configService.get("ACCESS_TOKEN_SECRET")
            }
        )
    }

}
