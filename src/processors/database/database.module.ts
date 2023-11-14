/**
 * @file Database module
 * @module processor/database/module
*/

import { Module, Global } from '@nestjs/common'
import { databaseProvider } from './database.provider'
import { MailService } from '@app/modules/mail/mail.service'

@Global()
@Module({
  imports: [MailService],
  providers: [databaseProvider],
  exports: [databaseProvider]
})
export class DatabaseModule { }
