/**
 * @file CORS middleware
 * @module middleware/cors
*/

import { Request, Response } from 'express'
import { Injectable, NestMiddleware, HttpStatus, RequestMethod } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { isDevEnv } from '@app/app.environment'
import { AllConfigType } from '@app/config/config.type'

/**
 * @class CorsMiddleware
 * @classdesc CORS*/
@Injectable()
export class CorsMiddleware implements NestMiddleware {
  constructor(private configService: ConfigService<AllConfigType>) { }

  use(request: Request, response: Response, next) {
    const getMethod = (method) => RequestMethod[method]
    const origins = request.headers.origin
    const origin = (Array.isArray(origins) ? origins[0] : origins) || ''

    const allowedOrigins = this.configService.getOrThrow('app.allowedOrigins', { infer: true });
    const allowedMethods = [
      RequestMethod.GET,
      RequestMethod.HEAD,
      RequestMethod.PUT,
      RequestMethod.PATCH,
      RequestMethod.POST,
      RequestMethod.DELETE
    ]
    const allowedHeaders = [
      'Authorization',
      'Origin',
      'No-Cache',
      'X-Requested-With',
      'If-Modified-Since',
      'Pragma',
      'Last-Modified',
      'Cache-Control',
      'Expires',
      'Content-Type',
      'X-E4M-With',
      // https://docs.sentry.io/platforms/javascript/performance/instrumentation/automatic-instrumentation/#tracepropagationtargets
      'Sentry-Trace',
      'Baggage'
    ]

    // Allow Origin
    if (!origin || allowedOrigins.includes(origin) || isDevEnv) {
      response.setHeader('Access-Control-Allow-Origin', origin || '*')
    }

    // Headers
    response.header('Access-Control-Allow-Credentials', 'true')
    response.header('Access-Control-Allow-Headers', allowedHeaders.join(','))
    response.header('Access-Control-Allow-Methods', allowedMethods.map(getMethod).join(','))
    response.header('Access-Control-Max-Age', '1728000')
    response.header('Content-Type', 'application/json; charset=utf-8')
    response.header('X-Powered-By', `${this.configService.getOrThrow('project.name', { infer: true })} ${this.configService.getOrThrow('project.version', { infer: true })}`)

    // OPTIONS Request
    if (request.method === getMethod(RequestMethod.OPTIONS)) {
      return response.sendStatus(HttpStatus.NO_CONTENT)
    } else {
      return next()
    }
  }
}
