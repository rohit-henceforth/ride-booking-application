import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString, MinLength } from "class-validator";

export class LoginByOtpDto {

    @ApiProperty({example:8580760230})
    @IsNotEmpty()
    @IsNumber()
    contact : number ;

    @ApiProperty({example:""})
    @IsNotEmpty()
    @IsString()
    @MinLength(4)
    otp: string;

}