/**
 * @file Email service
 * @module processor/helper/email.service
*/

import nodemailer from 'nodemailer'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { getMessageFromNormalError } from '@app/transformers/error.transformer'
import { AllConfigType } from '@app/config/config.type'
import logger from '@app/utils/logger'

const log = logger.scope('EmailService')

export interface EmailOptions {
  from?: string | null
  to: string
  subject: string | undefined
  text: string | undefined
  html: string | undefined
}

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter
  private clientIsValid: boolean

  constructor(private configService: ConfigService<AllConfigType>) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow('mail.host', { infer: true }),
      port: this.configService.getOrThrow('mail.port', { infer: true }),
      ignoreTLS: this.configService.get('mail.ignoreTLS', { infer: true }),
      secure: this.configService.getOrThrow('mail.secure', { infer: true }),
      requireTLS: this.configService.get('mail.requireTLS', { infer: true }),
      auth: {
        user: this.configService.getOrThrow('mail.user', { infer: true }),
        pass: this.configService.getOrThrow('mail.password', { infer: true })
      }
    })
    this.verifyClient()
  }

  private verifyClient(): void {
    return this.transporter.verify((error) => {
      if (error) {
        this.clientIsValid = false
        setTimeout(this.verifyClient.bind(this), 1000 * 60 * 30)
        log.error(`client init failed! retry when after 30 mins,`, getMessageFromNormalError(error))
      } else {
        this.clientIsValid = true
        log.info('client init succeed.')
      }
    })
  }

  public sendMail(mailOptions: EmailOptions) {
    if (!this.clientIsValid) {
      log.warn('send failed! (init failed)')
      return false
    }

    this.transporter.sendMail(
      {
        ...mailOptions,
        from: mailOptions.from
          ? mailOptions.from
          : `"${this.configService.get('mail.defaultName', {
            infer: true,
          })}" <${this.configService.get('mail.defaultEmail', {
            infer: true,
          })}>`
      },
      (error, info) => {
        if (error) {
          log.error(`send failed!`, getMessageFromNormalError(error))
        } else {
          log.info('send succeed.', info.messageId, info.response)
        }
      }
    )
  }

  public sendMailAs(prefix: string, mailOptions: EmailOptions) {
    return this.sendMail({
      ...mailOptions,
      subject: `[${prefix}] ${mailOptions.subject}`
    })
  }
}
