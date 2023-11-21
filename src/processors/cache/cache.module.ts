/**
 * @file Cache module
 * @module processor/cache/module
*/

// https://docs.nestjs.com/techniques/caching#different-stores
// https://docs.nestjs.com/techniques/caching#async-configuration
// MARK： No longer use cache-manager because the API between `cache-manager` and `@nestjs/cache-manager` is inconsistent.

import { Global, Module } from '@nestjs/common'
import { MailModule } from '@app/modules/mail/mail.module'
import { RedisService } from './redis.service'
import { CacheService } from './cache.service'

@Global()
@Module({
  imports: [MailModule],
  providers: [RedisService, CacheService],
  exports: [RedisService, CacheService]
})
export class CacheModule { }
