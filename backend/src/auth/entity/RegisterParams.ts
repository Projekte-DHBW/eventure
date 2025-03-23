import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterParamsDto {
  @ApiProperty({ description: "User's first name" })
  @IsString()
  firstName: string;

  @ApiProperty({ description: "User's last name" })
  @IsString()
  lastName: string;

  @ApiProperty({ description: "User's email address" })
  @IsEmail()
  email: string;

  @ApiProperty({ description: "User's password", minLength: 8 })
  @IsString()
  password: string;
}
