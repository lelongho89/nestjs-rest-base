import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { DisqusTokenService, TOKEN_COOKIE_KEY } from './disqus.service.token';

@Injectable()
export class DisqusTokenGuard implements CanActivate {
  constructor(private disqusTokenService: DisqusTokenService) { }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.cookies[TOKEN_COOKIE_KEY];
    if (token) {
      const decodedToken = this.disqusTokenService.decodeToken(token);
      if (decodedToken) {
        // Attach the decoded token to the request object
        request.__disqusToken__ = decodedToken;
        return true;
      }
    }
    return false;
  }
}
