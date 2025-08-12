import { Module } from "@nestjs/common";
import { TokenService } from "./token.service";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";

@Module({
    imports : [
        ConfigModule,
        JwtModule
    ],
    providers : [TokenService],
    exports: [TokenService]
})
export class TokenModule{}