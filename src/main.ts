/**
 * @file App entry
 * @module app/main
*/

import helmet from 'helmet'
import passport from 'passport'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import compression from 'compression'
import { NestFactory } from '@nestjs/core'
import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '@app/app.module'
import { HttpExceptionFilter } from '@app/filters/error.filter'
import { TransformInterceptor } from '@app/interceptors/transform.interceptor'
import { LoggingInterceptor } from '@app/interceptors/logging.interceptor'
import { ErrorInterceptor } from '@app/interceptors/error.interceptor'
import { environment, isProdEnv } from '@app/app.environment'
import logger from '@app/utils/logger'
import * as APP_CONFIG from '@app/app.config'
import { AllConfigType } from './config/config.type';

async function bootstrap() {
  // MARK: keep logger enabled on dev env
  const app = await NestFactory.create(AppModule, isProdEnv ? { logger: false } : {});
  const configService = app.get(ConfigService<AllConfigType>);
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());
  app.use(bodyParser.json({ limit: '1mb' }));
  app.use(bodyParser.urlencoded({ extended: true }));
  // MARK: Beware of upgrades!
  // v0.5.0 > v0.5.1 > v0.5.3 produced a breaking change!
  // https://github.com/jaredhanson/passport/blob/master/CHANGELOG.md#changed
  app.use(passport.initialize());
  app.setGlobalPrefix(
    configService.getOrThrow('app.apiPrefix', { infer: true }),
    {
      exclude: ['/'],
    },
  );
  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor(), new ErrorInterceptor(), new LoggingInterceptor());
  // https://github.com/nestjs/nest/issues/528#issuecomment-403212561
  // https://stackoverflow.com/a/60141437/6222535
  // MARK: can't used!
  // useContainer(app.select(AppModule), { fallbackOnErrors: true, fallback: true })

  const options = new DocumentBuilder()
    .setTitle('API')
    .setDescription('API docs')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document);

  return await app.listen(APP_CONFIG.APP.PORT);
}

bootstrap().then(() => {
  logger.info(`${APP_CONFIG.APP.NAME} is running on ${APP_CONFIG.APP.PORT}, env: ${environment}.`)
})
