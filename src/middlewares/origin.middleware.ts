/**
 * @file Origin middleware
 * @module middleware/origin
*/

import { Request, Response } from 'express'
import { Injectable, NestMiddleware, HttpStatus } from '@nestjs/common'
import { HttpResponseError, ResponseStatus } from '@app/interfaces/response.interface'
import { isProdEnv } from '@app/app.environment'
import { ConfigService } from '@nestjs/config'
import { AllConfigType } from '@app/config/config.type'
import * as TEXT from '@app/constants/text.constant'

/**
 * @class OriginMiddleware
 * @classdesc verification request origin and referer*/
@Injectable()
export class OriginMiddleware implements NestMiddleware {
  constructor(private configService: ConfigService<AllConfigType>) { }

  use(request: Request, response: Response, next) {
    // production only
    if (isProdEnv) {
      const { origin, referer } = request.headers
      const isAllowed = (field) => !field || field.includes(this.configService.getOrThrow('app.allowedReferer', { infer: true }));
      const isAllowedOrigin = isAllowed(origin)
      const isAllowedReferer = isAllowed(referer)
      if (!isAllowedOrigin && !isAllowedReferer) {
        return response.status(HttpStatus.UNAUTHORIZED).jsonp({
          status: ResponseStatus.Error,
          message: TEXT.HTTP_ANONYMOUS_TEXT,
          error: null
        } as HttpResponseError)
      }
    }

    return next()
  }
}
