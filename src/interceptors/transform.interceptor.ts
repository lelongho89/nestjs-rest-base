/**
 * @file Response data transform interceptor
 * @module interceptor/transform
*/

import { Request } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Document } from 'mongoose';
import { plainToClass, ClassConstructor } from 'class-transformer';
import { Injectable, NestInterceptor, CallHandler, ExecutionContext, PlainLiteralObject } from '@nestjs/common'
import { HttpResponseSuccess, ResponseStatus } from '@app/interfaces/response.interface'
import { getResponserOptions } from '@app/decorators/responser.decorator'
import * as TEXT from '@app/constants/text.constant'

/**
 * @class TransformInterceptor
 * @classdesc transform `T` to `HttpResponseSuccess<T>` when controller `Promise` resolved*/
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, T | HttpResponseSuccess<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<T | HttpResponseSuccess<T>> {
    const target = context.getHandler()
    const { successMessage, transform, paginate, serialization } = getResponserOptions(target)
    if (!transform) {
      return next.handle()
    }

    const changePlainObjectToClass = (document: PlainLiteralObject, serialization?: ClassConstructor<any>) => {
      if (!(document instanceof Document) || !serialization) {
        return document;
      }

      return plainToClass(serialization,
        document
          ? JSON.parse(JSON.stringify(document ?? {}))
          : undefined, {
        excludePrefixes: ['_']
      });
    }

    const transformResponse = (
      response:
        | PlainLiteralObject
        | PlainLiteralObject[],
      serialization?: ClassConstructor<unknown>,
    ) => {
      if (Array.isArray(response)) {
        return response.map(item => changePlainObjectToClass(item, serialization));
      }

      return changePlainObjectToClass(response, serialization);
    }

    const request = context.switchToHttp().getRequest<Request>()
    return next.handle().pipe(
      map((data: any) => {
        return {
          status: ResponseStatus.Success,
          message: successMessage || TEXT.HTTP_DEFAULT_SUCCESS_TEXT,
          params: {
            isAuthenticated: request.isAuthenticated(),
            isUnauthenticated: request.isUnauthenticated(),
            url: request.url,
            method: request.method,
            routes: request.params,
            payload: request.$validatedPayload || {},
            timestamp: new Date().getTime(),
          },
          result: paginate
            ? {
              data: transformResponse(data.documents, serialization),
              pagination: {
                total: data.total,
                current_page: data.page,
                per_page: data.perPage,
                total_page: data.totalPage
              }
            }
            : transformResponse(data, serialization)
        }
      })
    )
  }
}
