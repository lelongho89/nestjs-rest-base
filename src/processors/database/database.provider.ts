/**
 * @file Database providers > mongoose connection
 * @module processor/database/providers
*/

import mongoose from 'mongoose'
import { ConfigService } from '@nestjs/config'
import { MailService } from '@app/modules/mail/mail.service'
import { DB_CONNECTION_TOKEN } from '@app/constants/system.constant'
import { AllConfigType } from '@app/config/config.type'
import logger from '@app/utils/logger'

const log = logger.scope('MongoDB')

export const databaseProvider = {
  inject: [MailService, ConfigService],
  provide: DB_CONNECTION_TOKEN,
  useFactory: async (mailService: MailService, configService: ConfigService<AllConfigType>) => {
    let reconnectionTask: NodeJS.Timeout | null = null
    const RECONNECT_INTERVAL = 6000

    const sendAlarmMail = (error: string) => {
      mailService.alarmMail(`MongoDB Error!`, { to: configService.getOrThrow('app.adminEmail', { infer: true }), data: { error } });
    }

    const connection = () => {
      return mongoose.connect(configService.getOrThrow('database.url', { infer: true }), {})
    }

    // DeprecationWarning: Mongoose: the `strictQuery` option will be switched back to `false` by default in Mongoose 7.
    // Use `mongoose.set('strictQuery', false);` if you want to prepare for this change.
    // Or use `mongoose.set('strictQuery', true);` to suppress this warning.
    // https://mongoosejs.com/docs/guide.html#strictQuery
    mongoose.set('strictQuery', false)

    mongoose.connection.on('connecting', () => {
      log.info('connecting...')
    })

    mongoose.connection.on('open', () => {
      log.info('readied (open).')
      if (reconnectionTask) {
        clearTimeout(reconnectionTask)
        reconnectionTask = null
      }
    })

    mongoose.connection.on('disconnected', () => {
      log.error(`disconnected! retry when after ${RECONNECT_INTERVAL / 1000}s`)
      reconnectionTask = setTimeout(connection, RECONNECT_INTERVAL)
    })

    mongoose.connection.on('error', (error) => {
      log.error('error!', error)
      mongoose.disconnect()
      sendAlarmMail(String(error))
    })

    return await connection()
  }
}
