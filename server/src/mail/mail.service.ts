import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import { MAIL_TEMPLATES } from './mail.constants';
import { welcomeTemplate } from './templates/welcome';
import { resetPasswordTemplate } from './templates/reset-password';
import {
  orderConfirmTemplate,
  OrderConfirmData,
} from './templates/order-confirm';

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: Number(this.configService.get<string>('MAIL_PORT') || 587),
      secure: false,
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
    });
  }

  async sendWelcomeEmail(
    email: string,
    name: string,
  ): Promise<void> {
    const html = welcomeTemplate({ name });

    await this.send(
      {
        to: email,
        subject: MAIL_TEMPLATES.WELCOME.subject,
        html,
      },
      MAIL_TEMPLATES.WELCOME.name,
    );
  }

  async sendPasswordResetEmail(
    email: string,
    name: string,
    resetToken: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${resetToken}`;
    const html = resetPasswordTemplate({ name, resetUrl });

    await this.send(
      {
        to: email,
        subject: MAIL_TEMPLATES.RESET_PASSWORD.subject,
        html,
      },
      MAIL_TEMPLATES.RESET_PASSWORD.name,
    );
  }

  async sendOrderConfirmation(
    email: string,
    name: string,
    order: OrderConfirmData,
  ): Promise<void> {
    const html = orderConfirmTemplate({ name, order });

    await this.send(
      {
        to: email,
        subject: MAIL_TEMPLATES.ORDER_CONFIRMATION.subject(order.orderNumber),
        html,
      },
      MAIL_TEMPLATES.ORDER_CONFIRMATION.name,
      { orderNumber: order.orderNumber },
    );
  }

  private async send(
    options: MailOptions,
    templateName: string,
    metadata?: Record<string, string>,
  ): Promise<void> {
    const from = this.configService.get<string>('MAIL_FROM');

    try {
      await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      this.logger.log(
        `Email sent successfully: template=${templateName}, to=${options.to}`,
      );

      await this.logEmailSend(
        options.to,
        options.subject,
        templateName,
        'SUCC',
        undefined,
        metadata,
      );
    } catch (error: unknown) {
      const errMsg =
        error instanceof Error ? error.message : 'Unknown mail error';
      this.logger.error(
        `Failed to send email: template=${templateName}, to=${options.to}, error=${errMsg}`,
      );

      await this.logEmailSend(
        options.to,
        options.subject,
        templateName,
        'FAIL',
        errMsg,
        metadata,
      );
    }
  }

  private async logEmailSend(
    rcpntEml: string,
    sbj: string,
    tmpltNm: string,
    sndSttsCd: string,
    errMsg?: string,
    mtdt?: Record<string, string>,
  ): Promise<void> {
    try {
      await this.prisma.emailLog.create({
        data: {
          rcpntEml,
          sbj,
          tmpltNm,
          sndSttsCd,
          errMsg: errMsg ?? null,
          sndDt: new Date(),
          mtdt: mtdt ?? undefined,
          rgstDt: new Date(),
        },
      });
    } catch (logError: unknown) {
      const msg =
        logError instanceof Error ? logError.message : 'Unknown log error';
      this.logger.error(`Failed to log email send: ${msg}`);
    }
  }
}
