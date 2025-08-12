import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Matches } from "class-validator";

export class RefreshTokenDto {

    @ApiProperty({ example : '' })
    @IsNotEmpty()
    refreshToken: string;

}