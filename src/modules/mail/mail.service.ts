import path from 'path';
import Handlebars from 'handlebars';
import fs from 'node:fs/promises';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nContext } from 'nestjs-i18n';
import { MailData } from './interfaces/mail-data.interface';
import { AllConfigType } from '@app/config/config.type';
import { EmailService } from '@app/processors/helper/helper.service.email'
import * as APP_CONFIG from '@app/app.config'

@Injectable()
export class MailService {
  constructor(
    private readonly emailService: EmailService,
    private readonly configService: ConfigService<AllConfigType>,
  ) { }

  public async userSignUp(mailData: MailData<{ hash: string }>): Promise<void> {
    const i18n = I18nContext.current();
    let emailConfirmTitle: string | undefined;
    let text1: string | undefined;
    let text2: string | undefined;
    let text3: string | undefined;

    if (i18n) {
      [emailConfirmTitle, text1, text2, text3] = await Promise.all([
        i18n.t('common.confirmEmail'),
        i18n.t('confirm-email.text1'),
        i18n.t('confirm-email.text2'),
        i18n.t('confirm-email.text3'),
      ]);
    }

    await this.emailService.sendMailAs(APP_CONFIG.APP.NAME, {
      to: mailData.to,
      subject: emailConfirmTitle,
      text: `${this.configService.get('app.frontendDomain', {
        infer: true,
      })}/confirm-email?hash=${mailData.data.hash} ${emailConfirmTitle}`,
      ...(await this.getMailContent({
        templatePath: path.join(
          this.configService.getOrThrow('app.workingDirectory', {
            infer: true,
          }),
          'src',
          'modules',
          'mail',
          'mail-templates',
          'activation.hbs',
        ),
        context: {
          title: emailConfirmTitle,
          url: `${this.configService.get('app.frontendDomain', {
            infer: true,
          })}/confirm-email?hash=${mailData.data.hash}`,
          actionTitle: emailConfirmTitle,
          app_name: this.configService.get('app.name', { infer: true }),
          text1,
          text2,
          text3,
        }
      }))
    });
  }

  public async forgotPassword(mailData: MailData<{ hash: string }>): Promise<void> {
    const i18n = I18nContext.current();
    let resetPasswordTitle: string | undefined;
    let text1: string | undefined;
    let text2: string | undefined;
    let text3: string | undefined;
    let text4: string | undefined;

    if (i18n) {
      [resetPasswordTitle, text1, text2, text3, text4] = await Promise.all([
        i18n.t('common.resetPassword'),
        i18n.t('reset-password.text1'),
        i18n.t('reset-password.text2'),
        i18n.t('reset-password.text3'),
        i18n.t('reset-password.text4'),
      ]);
    }

    await this.emailService.sendMailAs(APP_CONFIG.APP.NAME, {
      to: mailData.to,
      subject: resetPasswordTitle,
      text: `${this.configService.get('app.frontendDomain', {
        infer: true,
      })}/password-change?hash=${mailData.data.hash} ${resetPasswordTitle}`,
      ...(await this.getMailContent({
        templatePath: path.join(
          this.configService.getOrThrow('app.workingDirectory', {
            infer: true,
          }),
          'src',
          'mail',
          'mail-templates',
          'reset-password.hbs',
        ),
        context: {
          title: resetPasswordTitle,
          url: `${this.configService.get('app.frontendDomain', {
            infer: true,
          })}/password-change?hash=${mailData.data.hash}`,
          actionTitle: resetPasswordTitle,
          app_name: this.configService.get('app.name', {
            infer: true,
          }),
          text1,
          text2,
          text3,
          text4,
        }
      }))
    });
  }

  private async getMailContent({
    templatePath,
    context
  }: {
    templatePath: string;
    context: Record<string, unknown>;
  }): Promise<{ html: string | undefined }> {
    let html: string | undefined;
    if (templatePath) {
      const template = await fs.readFile(templatePath, 'utf-8');
      html = Handlebars.compile(template, {
        strict: true,
      })(context);
    }

    return { html };
  }
}
