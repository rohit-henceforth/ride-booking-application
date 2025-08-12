import { ApiProperty } from "@nestjs/swagger";
import { CreateNewEntryDto } from "./create-new-entery.dto";
import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsString } from "class-validator";

export class UpdateEntryDto extends PartialType(CreateNewEntryDto) {
    @ApiProperty({ example: "" })
    @IsNotEmpty()
    @IsString()
    readonly _id: string;
}