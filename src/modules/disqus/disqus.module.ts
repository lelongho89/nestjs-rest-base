/**
 * @file Disqus module
 * @module module/disqus/module
*/

import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { OptionModule } from '@app/modules/option/option.module'
import { ArticleModule } from '@app/modules/article/article.module'
import { CommentModule } from '@app/modules/comment/comment.module'
import { DisqusController } from './disqus.controller'
import { DisqusPublicService } from './disqus.service.public'
import { DisqusPrivateService } from './disqus.service.private'
import { DisqusTokenService } from './disqus.service.token'
import { JwtModule } from '@nestjs/jwt'

@Module({
  imports: [HttpModule, OptionModule, ArticleModule, CommentModule, JwtModule.register({})],
  controllers: [DisqusController],
  providers: [DisqusPublicService, DisqusPrivateService, DisqusTokenService],
  exports: [DisqusPublicService, DisqusPrivateService, DisqusTokenService]
})
export class DisqusModule { }
