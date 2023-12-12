import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '@app/config/config.type';
import { AccessToken } from '@app/utils/disqus'

export const TOKEN_COOKIE_KEY = '_disqus'

@Injectable()
export class DisqusTokenService {
  constructor(private jwtService: JwtService, private configService: ConfigService<AllConfigType>) { }

  encodeToken(token: AccessToken) {
    return this.jwtService.sign(token, {
      secret: this.configService.getOrThrow('disqus.adminAccessToken', { infer: true }),
      expiresIn: token.expires_in
    });
  }

  decodeToken = (token: string): AccessToken | null => {
    try {
      const result = this.jwtService.verify(token, {
        secret: this.configService.getOrThrow('disqus.adminAccessToken', { infer: true })
      });
      return (result as any) || null
    } catch (error) {
      return null;
    }
  }
}
