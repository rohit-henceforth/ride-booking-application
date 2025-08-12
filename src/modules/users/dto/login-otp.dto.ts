import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber} from 'class-validator';

export class LoginOtpDto {
  @ApiProperty({ example: 8580760230 })
  @IsNotEmpty()
  @IsNumber()
  contact: number;
}
