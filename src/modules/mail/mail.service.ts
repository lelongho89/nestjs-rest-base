import path from 'path';
import Handlebars from 'handlebars';
import fs from 'node:fs/promises';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nContext } from 'nestjs-i18n';
import { MailData } from './interfaces/mail-data.interface';
import { AllConfigType } from '@app/config/config.type';
import { MailerService } from '@app/processors/helper/helper.service.mailer'

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
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

    await this.mailerService.sendMailAs(this.configService.getOrThrow('app.name', { infer: true }), {
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

    await this.mailerService.sendMailAs(this.configService.getOrThrow('app.name', { infer: true }), {
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

  public async dailyStatistics(mailData: MailData<object>): Promise<void> {

    await this.mailerService.sendMailAs(this.configService.getOrThrow('app.name', { infer: true }), {
      to: mailData.to,
      subject: `Daily Statistics`,
      text: `Daily Statistics`,
      ...(await this.getMailContent({
        templatePath: path.join(
          this.configService.getOrThrow('app.workingDirectory', {
            infer: true,
          }),
          'src',
          'modules',
          'mail',
          'mail-templates',
          'daily-statistics.hbs',
        ),
        context: {
          title: `Daily Statistics`,
          app_name: this.configService.get('app.name', { infer: true }),
          ...mailData.data
        }
      }))
    });
  }

  public async alarmMail(subject: string, mailData: MailData<{ error: string }>): Promise<void> {
    this.mailerService.sendMailAs(this.configService.getOrThrow('app.name', { infer: true }), {
      to: mailData.to,
      subject: `${subject}`,
      text: mailData.data.error,
      html: `<pre><code>${mailData.data.error}</code></pre>`
    });
  }

  public async dbBackup(subject: string, mailData: MailData<{ content: string, isCode?: boolean }>): Promise<void> {
    this.mailerService.sendMailAs(this.configService.getOrThrow('app.name', { infer: true }), {
      to: mailData.to,
      subject: `${subject}`,
      text: `${subject}, detail: ${mailData.data.content}`,
      html: `${subject} <br> ${mailData.data.isCode ? `<pre>${mailData.data.content}</pre>` : mailData.data.content}`
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
