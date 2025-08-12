import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class ResetPasswordDto {
    
    @ApiProperty({ example: "" })
    @IsNotEmpty()
    @IsString()
    password: string;

    @ApiProperty({ example: "" })
    @IsNotEmpty()
    @IsString()
    token: string;

}