import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class StartRideDto {

    @ApiProperty({example : 1234})
    @IsNotEmpty()
    @IsNumber()
    otp : number ;

    @ApiProperty({example : ""})
    @IsNotEmpty()
    @IsString()
    rideId : string ;

}