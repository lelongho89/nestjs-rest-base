/**
 * @file Disqus guard
 * @module module/disqus/guard
 * As we cannot inject ConfigService into a decorator (disqus.token.ts),
 * we have to use a guard to decode token from cookie, and then inject it into request.
 * after that, we can create a decorator to get token from request.
*/

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { DisqusTokenService } from './disqus.service.token';
import { TOKEN_COOKIE_KEY, TOKEN_REQUEST_KEY } from './disqus.token';

@Injectable()
export class DisqusTokenGuard implements CanActivate {
  constructor(private disqusTokenService: DisqusTokenService) { }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.cookies[TOKEN_COOKIE_KEY];
    if (token) {
      const decodedToken = this.disqusTokenService.decodeToken(token);
      if (decodedToken) {
        request[TOKEN_REQUEST_KEY] = decodedToken;
        return true;
      }
    }
    return false;
  }
}
