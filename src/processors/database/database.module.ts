/**
 * @file Database module
 * @module processor/database/module
*/

import { Module, Global } from '@nestjs/common'
import { databaseProvider } from './database.provider'
import { MailModule } from '@app/modules/mail/mail.module'

@Global()
@Module({
  imports: [MailModule],
  providers: [databaseProvider],
  exports: [databaseProvider]
})
export class DatabaseModule { }
