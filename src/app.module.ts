/**
 * @file App module
 * @module app/module
*/

import { APP_INTERCEPTOR, APP_GUARD, APP_PIPE } from '@nestjs/core'
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule, minutes } from '@nestjs/throttler'
import { I18nModule } from 'nestjs-i18n/dist/i18n.module';
import { HeaderResolver } from 'nestjs-i18n';
import path from 'path';
import { AppController } from '@app/app.controller'

// framework
import { CacheInterceptor } from '@app/interceptors/cache.interceptor'
import { ValidationPipe } from '@app/pipes/validation.pipe'

// config
import databaseConfig from '@app/config/database.config';
import authConfig from '@app/config/auth.config';
import appConfig from '@app/config/app.config';
import mailConfig from '@app/config/mail.config';
import fileConfig from '@app/config/file.config';
import facebookConfig from '@app/config/facebook.config';
import googleConfig from '@app/config/google.config';
import twitterConfig from '@app/config/twitter.config';
import appleConfig from '@app/config/apple.config';
import { AllConfigType } from '@app/config/config.type';

// middlewares
import { CorsMiddleware } from '@app/middlewares/cors.middleware'
import { OriginMiddleware } from '@app/middlewares/origin.middleware'

// universal modules
import { DatabaseModule } from '@app/processors/database/database.module'
import { CacheModule } from '@app/processors/cache/cache.module'
import { HelperModule } from '@app/processors/helper/helper.module'

// BIZ helper module
import { ExpansionModule } from '@app/modules/expansion/expansion.module'

// BIZ modules
import { AuthModule } from '@app/modules/auth/auth.module'
import { OptionModule } from '@app/modules/option/option.module'
import { FeedbackModule } from '@app/modules/feedback/feedback.module'
import { AnnouncementModule } from '@app/modules/announcement/announcement.module'
import { TagModule } from '@app/modules/tag/tag.module'
import { CategoryModule } from '@app/modules/category/category.module'
import { ArticleModule } from '@app/modules/article/article.module'
import { CommentModule } from '@app/modules/comment/comment.module'
import { DisqusModule } from '@app/modules/disqus/disqus.module'
import { ArchiveModule } from '@app/modules/archive/archive.module'
import { VoteModule } from '@app/modules/vote/vote.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseConfig,
        authConfig,
        appConfig,
        mailConfig,
        fileConfig,
        facebookConfig,
        googleConfig,
        twitterConfig,
        appleConfig,
      ],
      envFilePath: ['.env'],
    }),
    // https://github.com/nestjs/throttler#readme
    ThrottlerModule.forRoot([
      {
        ttl: minutes(5), // 5 minutes = 300s
        limit: 300, // 300 limit
        ignoreUserAgents: [/googlebot/gi, /bingbot/gi, /baidubot/gi]
      }
    ]),
    I18nModule.forRootAsync({
      useFactory: (configService: ConfigService<AllConfigType>) => ({
        fallbackLanguage: configService.getOrThrow('app.fallbackLanguage', {
          infer: true,
        }),
        loaderOptions: { path: path.join(__dirname, '/i18n/'), watch: true },
      }),
      resolvers: [
        {
          use: HeaderResolver,
          useFactory: (configService: ConfigService<AllConfigType>) => {
            return [
              configService.get('app.headerLanguage', {
                infer: true,
              }),
            ];
          },
          inject: [ConfigService],
        },
      ],
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
    HelperModule,
    DatabaseModule,
    CacheModule,
    ExpansionModule,
    // BIZs
    AuthModule,
    OptionModule,
    FeedbackModule,
    AnnouncementModule,
    TagModule,
    CategoryModule,
    ArticleModule,
    CommentModule,
    DisqusModule,
    ArchiveModule,
    VoteModule
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    },
    {
      provide: APP_PIPE,
      useClass: ValidationPipe
    }
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorsMiddleware, OriginMiddleware).forRoutes('*')
  }
}
