/**
 * @file Disqus token helper
 * @module module/disqus/token
*/

import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { AccessToken } from '@app/utils/disqus'

export const TOKEN_COOKIE_KEY = '_disqus'
export const TOKEN_REQUEST_KEY = 'x-disqus-token'

export const DisqusToken = createParamDecorator((context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest()
  return request[TOKEN_REQUEST_KEY] as AccessToken | null;
})
