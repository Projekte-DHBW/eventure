import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { RegisterParamsDto } from './entity/RegisterParams';
import { LoginParamsDto } from './entity/LoginParams';
import { GetUser } from './jwtData.decorator';
import { User } from 'src/entity/User';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterParamsDto) {
    return this.authService.register(body);
  }

  @Post('login')
  async login(@Body() body: LoginParamsDto) {
    return this.authService.login(body);
  }

  @Post('refresh-token')
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  async logout(
    @GetUser() user: User,
    @Body('refreshToken') refreshToken?: string,
  ) {
    return this.authService.logout(user, refreshToken);
  }
}
