import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginParamsDto {
  @ApiProperty({ description: "User's email address" })
  @IsEmail()
  email: string;

  @ApiProperty({ description: "User's password" })
  @IsString()
  password: string;
}
