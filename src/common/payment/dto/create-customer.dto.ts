import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateCustomerDto {

    @ApiProperty({example : "rohitdogra0127@gmail.com"})
    @IsNotEmpty()
    @IsString()
    readonly email : string ;

    @ApiProperty({example : "pm_card_visa"})
    @IsNotEmpty()
    @IsString()
    readonly paymentMethodId : string ;

}