import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from './entity/JwtPayload';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow('SECRET'),
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    return {
      sub: payload.sub,
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
    };
  }
}
