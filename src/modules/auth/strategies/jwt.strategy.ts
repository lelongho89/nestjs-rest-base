import { plainToClass } from 'class-transformer';
import { ExtractJwt, Strategy, VerifiedCallback } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '@app/config/config.type';
import { UserService } from '@app/modules/user/user.service';
import { User } from '@app/modules/user/user.model';
import { JwtPayloadType } from './types/jwt-payload.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private configService: ConfigService<AllConfigType>,
    private userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('auth.secret', { infer: true }),
    });
  }

  public async validate(payload: JwtPayloadType, done: VerifiedCallback) {
    if (!payload.id) {
      return done(new UnauthorizedException(), false);
    }

    const user = await this.userService.findOne(payload.id);
    if (!user) {
      return done(new UnauthorizedException(), false);
    }

    // TODO: map user's permissions and role's permissions.
    return done(null, plainToClass(User, user.toJSON(), {
      excludePrefixes: ['_'],
    }));
  }
}
