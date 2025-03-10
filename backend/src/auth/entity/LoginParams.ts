import { IsEmail, IsString } from 'class-validator';

export class LoginParamsDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

const 