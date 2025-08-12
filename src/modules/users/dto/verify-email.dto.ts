import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString, Length } from "class-validator";

export class VerifyEmailDto{

    @ApiProperty({example:8580760230})
    @IsNotEmpty()
    @IsNumber()
    contactNumber : number ;

    @ApiProperty({example:""})
    @IsNotEmpty()
    @IsString()
    @Length(4)
    contactOtp : string ;

} 