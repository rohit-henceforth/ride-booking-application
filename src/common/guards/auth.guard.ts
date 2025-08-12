import { CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Request } from "express";
import { User, UserDocument } from "../schema/user.schema";

export class AuthGuard implements CanActivate {

    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
        @InjectModel(User.name) private userModel: Model<UserDocument>
    ) { }

    private extractTokenFromHeader(request: Request): string | undefined {

        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) return undefined;

        return authHeader.replace('Bearer ', '');

    }

    async canActivate(context: ExecutionContext): Promise<boolean> {

        const request = context.switchToHttp().getRequest<Request>();
        const token = this.extractTokenFromHeader(request);

        if (!token) throw new UnauthorizedException("Token is required!");

        try {

            const payload = this.jwtService.verify(
                token,
                {
                    secret: this.configService.get('ACCESS_TOKEN_SECRET'),
                }
            );

            const user = await this.userModel.findById(payload?._id);

            if (!user) {
                throw new Error();
            }

            request['user'] = user;

            return true;

        } catch (error) {

            throw new UnauthorizedException("User not authorized!");

        }

    }

}