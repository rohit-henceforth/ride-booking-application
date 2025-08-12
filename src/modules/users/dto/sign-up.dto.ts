import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
  MinLength,
} from 'class-validator';

export class SignUpDto {
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

  @ApiProperty({ example: 'driver' })
  readonly role ?: 'user' | 'driver';

}
