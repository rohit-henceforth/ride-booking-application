import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateSubscriptionDto{

    @ApiProperty({
        example : ""
    })
    @IsNotEmpty()
    @IsString()
    readonly customerId : string ;

    @ApiProperty({
        example : ""
    })
    @IsNotEmpty()
    @IsString()
    readonly priceId : string

}