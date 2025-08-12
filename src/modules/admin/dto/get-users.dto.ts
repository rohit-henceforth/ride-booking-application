import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class GetUsersDto{

    @ApiProperty({ required: false})
    @IsString()
    limit : string ;

    @ApiProperty({ required: false})
    @IsString()
    page : string ;

}