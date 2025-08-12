import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class UpdateSubscriptionDto {

    @ApiProperty({
        example : ""
    })
    @IsNotEmpty()
    @IsString()
    readonly subscriptionId : string ;

    @ApiProperty({
        example : ""
    })
    @IsNotEmpty()
    @IsString()
    readonly priceId : string ;

}