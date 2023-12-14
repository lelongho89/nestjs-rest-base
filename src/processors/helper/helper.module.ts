/**
 * @file General helper module
 * @module processor/helper/module
*/

import { Module, Global } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { MailerService } from './helper.service.mailer'
import { IPService } from './helper.service.ip'

const services = [MailerService, IPService]

@Global()
@Module({
  imports: [HttpModule],
  providers: services,
  exports: services
})
export class HelperModule { }
