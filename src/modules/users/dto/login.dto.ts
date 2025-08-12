import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber} from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 8580760230 })
  @IsNotEmpty()
  @IsNumber()
  contact: number;

  @ApiProperty({ example: '' })
  @IsNotEmpty()
  password: string;
}
