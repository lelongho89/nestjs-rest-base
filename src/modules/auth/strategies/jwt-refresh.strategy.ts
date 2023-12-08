import { Request } from 'express';
import { ExtractJwt, Strategy, VerifiedCallback } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { JwtRefreshPayloadType } from './types/jwt-refresh-payload.type';
import { AllConfigType } from '@app/config/config.type';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private configService: ConfigService<AllConfigType>, private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refresh_token'),
      secretOrKey: configService.get('auth.refreshSecret', { infer: true }),
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  public async validate(req: Request, payload: JwtRefreshPayloadType, done: VerifiedCallback) {
    if (!payload.id) {
      return done(new UnauthorizedException(), false);
    }

    const { body } = req;
    const refresh_token = body.refresh_token;

    const user = await this.authService.getUserIfRefreshTokenMatched(payload.id, refresh_token);

    if (!user) {
      return done(new UnauthorizedException(), false);
    }

    return done(null, user.toObject());
  }
}
