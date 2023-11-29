import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { JwtRefreshPayloadType } from './types/jwt-refresh-payload.type';
import { AllConfigType } from '@app/config/config.type';
import { AuthService } from '../auth.service';
import { User } from '@app/modules/user/user.model';


@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private configService: ConfigService<AllConfigType>, private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('auth.refreshSecret', { infer: true }),
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  public async validate(req: Request, payload: JwtRefreshPayloadType): Promise<User> {
    if (!payload.id) {
      throw new UnauthorizedException();
    }

    const refresh_token = req.headers.authorization?.split('Bearer ')[1] || '';
    const user = await this.authService.getUserIfRefreshTokenMatched(payload.id, refresh_token);

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
