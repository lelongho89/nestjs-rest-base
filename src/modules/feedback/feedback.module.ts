/**
 * @file Feedback module
 * @module module/feedback/module
*/

import { Module } from '@nestjs/common'
import { MailModule } from '@app/modules/mail/mail.module';
import { FeedbackProvider } from './feedback.model'
import { FeedbackService } from './feedback.service'
import { FeedbackController } from './feedback.controller'

@Module({
  imports: [MailModule],
  controllers: [FeedbackController],
  providers: [FeedbackProvider, FeedbackService],
  exports: [FeedbackService]
})
export class FeedbackModule { }
