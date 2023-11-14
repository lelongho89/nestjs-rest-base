/**
 * @file Cache Redis service
 * @module processor/cache/redis.config
*/

// https://github.com/nestjs/cache-manager/blob/master/lib/cache.module.ts
// https://github.com/nestjs/cache-manager/blob/master/lib/cache.providers.ts
// https://gist.github.com/kyle-mccarthy/b6770b49ebfab88e75bcbac87b272a94

import lodash from 'lodash'
import { createClient, RedisClientType } from 'redis'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AllConfigType } from '@app/config/config.type'
import { MailService } from '@app/modules/mail/mail.service'
import { createRedisStore, RedisStore, RedisClientOptions } from './redis.store'
import logger from '@app/utils/logger'

const log = logger.scope('RedisService')

@Injectable()
export class RedisService {
  private redisStore!: RedisStore
  private redisClient!: RedisClientType

  constructor(
    private readonly mailService: MailService,
    private readonly configService: ConfigService<AllConfigType>
  ) {
    this.redisClient = createClient(this.getOptions()) as RedisClientType
    this.redisStore = createRedisStore(this.redisClient, {
      defaultTTL: this.configService.getOrThrow('app.defaultCacheTtl', { infer: true }),
      namespace: this.configService.getOrThrow('redis.namespace', { infer: true })
    })
    // https://github.com/redis/node-redis#events
    this.redisClient.on('connect', () => log.info('connecting...'))
    this.redisClient.on('reconnecting', () => log.warn('reconnecting...'))
    this.redisClient.on('ready', () => log.info('readied (connected).'))
    this.redisClient.on('end', () => log.error('client end!'))
    this.redisClient.on('error', (error) => log.error(`client error!`, error.message))
    // connect
    this.redisClient.connect()
  }

  private sendAlarmMail = lodash.throttle((error: string) => {
    this.mailService.alarmMail(`Redis Error!`, { to: this.configService.getOrThrow('app.adminEmail', { infer: true }), data: { error } });
  }, 1000 * 30)

  // https://github.com/redis/node-redis/blob/master/docs/client-configuration.md#reconnect-strategy
  private retryStrategy(retries: number): number | Error {
    const errorMessage = `retryStrategy! retries: ${retries}`
    log.error(errorMessage)
    this.sendAlarmMail(errorMessage)
    if (retries > 6) {
      return new Error('Redis maximum retries!')
    }
    return Math.min(retries * 1000, 3000)
  }

  // https://github.com/redis/node-redis/blob/master/docs/client-configuration.md
  private getOptions(): RedisClientOptions {
    const redisOptions: RedisClientOptions = {
      socket: {
        host: this.configService.getOrThrow('redis.host', { infer: true }),
        port: this.configService.getOrThrow('redis.port', { infer: true }) as number,
        reconnectStrategy: this.retryStrategy.bind(this)
      }
    }

    if (this.configService.getOrThrow('redis.username', { infer: true })) {
      redisOptions.username = this.configService.getOrThrow('redis.username', { infer: true });
    }
    if (this.configService.getOrThrow('redis.password', { infer: true })) {
      redisOptions.password = this.configService.getOrThrow('redis.password', { infer: true })
    }

    return redisOptions
  }

  public get client(): RedisClientType {
    return this.redisClient
  }

  public get store(): RedisStore {
    return this.redisStore
  }
}
