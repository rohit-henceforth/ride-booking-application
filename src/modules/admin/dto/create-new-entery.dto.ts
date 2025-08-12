import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateNewEntryDto {
  @ApiProperty({ example: '' })
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @ApiProperty({ example: '' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  readonly password: string;

  @ApiProperty({ example: 8580760230 })
  @IsNotEmpty()
  @IsNumber()
  readonly contactNumber: number;
}
