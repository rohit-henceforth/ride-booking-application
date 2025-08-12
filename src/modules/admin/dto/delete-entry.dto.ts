import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class DeleteEntryDto {
    @ApiProperty({ example: "" })
    @IsNotEmpty()
    @IsString()
    readonly _id: string;
}