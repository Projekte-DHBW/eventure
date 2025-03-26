import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { RefreshToken } from 'src/entity/RefreshToken';
import { User } from 'src/entity/User';
import { JwtPayload } from './entity/JwtPayload';
import { MoreThan, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import constants from './constants';
import { RegisterParamsDto } from './entity/RegisterParams';
import { LoginParamsDto } from './entity/LoginParams';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  async register(body: RegisterParamsDto) {
    const { firstName, lastName, email, password } = body;
    const userByEmail = await this.usersService.findOneByEmail(email);
    if (userByEmail) throw new UnauthorizedException('Email already exists');

    const hashedPassword = await bcrypt.hash(password, 10);

    await this.usersService.createUser(
      firstName,
      lastName,
      email,
      hashedPassword,
    );

    return { success: true };
  }

  async validateUser(password: string, email?: string) {
    if (!email) throw new UnauthorizedException('Invalid credentials');

    let user: User | null = null;

    if (email) user = await this.usersService.findOneByEmail(email);

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid credentials');

    return user;
  }

  async login(body: LoginParamsDto) {
    if (!body.email) throw new UnauthorizedException('Invalid credentials');

    const { email, password } = body;

    const user = await this.usersService.findOneByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: constants.expiry,
      secret: this.config.getOrThrow('SECRET'),
    });
    const refreshToken = this.jwtService.sign(
      {},
      {
        expiresIn: constants.refreshExpiry,
        secret: this.config.getOrThrow('REFRESH_SECRET'),
      },
    );

    const hashedToken = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + constants.refreshExpiry * 1000);

    await this.refreshTokenRepo.save({ user, token: hashedToken, expiresAt });

    return { accessToken, refreshToken };
  }

  async refreshToken(oldRefreshToken: string) {
    const tokens = await this.refreshTokenRepo.find({
      where: { expiresAt: MoreThan(new Date()) },
      relations: ['user'],
    });

    let validToken: RefreshToken | undefined;
    for (const token of tokens) {
      if (await bcrypt.compare(oldRefreshToken, token.token)) {
        validToken = token;
        break;
      }
    }
    if (!validToken) throw new UnauthorizedException('Invalid refresh token');

    const newAccessToken = this.jwtService.sign(
      { sub: validToken.user.id } as JwtPayload,
      {
        secret: this.config.getOrThrow('SECRET'),
        expiresIn: constants.expiry,
      },
    );
    return { accessToken: newAccessToken };
  }

  async logout(user: User, refreshToken?: string) {
    if (refreshToken) {
      // Logout from specific session
      const tokens = await this.refreshTokenRepo.find({
        where: { user: { id: user.id } },
      });

      for (const token of tokens) {
        if (await bcrypt.compare(refreshToken, token.token)) {
          await this.refreshTokenRepo.delete(token.id);
          return;
        }
      }
    } else {
      await this.refreshTokenRepo.delete({ user: { id: user.id } });
    }
  }
}
