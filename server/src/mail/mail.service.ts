import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import { MAIL_TEMPLATES } from './mail.constants';
import { welcomeTemplate } from './templates/welcome';
import {
  orderConfirmTemplate,
  OrderConfirmData,
} from './templates/order-confirm';

type MailProvider = 'ses' | 'smtp';

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly provider: MailProvider;
  private readonly sesClient: SESClient | null = null;
  private readonly smtpTransporter: nodemailer.Transporter | null = null;
  private readonly mailFrom: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.provider = this.resolveProvider();
    this.mailFrom = this.configService.get<string>('MAIL_FROM') || '';

    if (this.provider === 'ses') {
      const region = this.configService.get<string>('AWS_SES_REGION') || 'us-east-1';
      this.sesClient = new SESClient({
        region,
        credentials: {
          accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
          secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
        },
      });
      this.logger.log(`Mail provider: AWS SES API (${region})`);
    } else {
      this.smtpTransporter = nodemailer.createTransport({
        host: this.configService.get<string>('MAIL_HOST'),
        port: Number(this.configService.get<string>('MAIL_PORT') || 587),
        secure: false,
        auth: {
          user: this.configService.get<string>('MAIL_USER'),
          pass: this.configService.get<string>('MAIL_PASSWORD'),
        },
      });
      this.logger.log(`Mail provider: SMTP (${this.configService.get<string>('MAIL_HOST')})`);
    }
  }

  private resolveProvider(): MailProvider {
    const explicit = this.configService.get<string>('MAIL_PROVIDER');
    if (explicit === 'ses' || explicit === 'smtp') {
      return explicit;
    }
    if (this.configService.get<string>('AWS_ACCESS_KEY_ID')) {
      return 'ses';
    }
    return 'smtp';
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
    try {
      if (this.provider === 'ses' && this.sesClient) {
        await this.sendViaSesApi(options);
      } else if (this.smtpTransporter) {
        await this.smtpTransporter.sendMail({
          from: this.mailFrom,
          to: options.to,
          subject: options.subject,
          html: options.html,
        });
      }

      this.logger.log(
        `Email sent successfully: provider=${this.provider}, template=${templateName}, to=${options.to}`,
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
        `Failed to send email: provider=${this.provider}, template=${templateName}, to=${options.to}, error=${errMsg}`,
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

  private async sendViaSesApi(options: MailOptions): Promise<void> {
    const command = new SendEmailCommand({
      Source: this.mailFrom,
      Destination: {
        ToAddresses: [options.to],
      },
      Message: {
        Subject: {
          Data: options.subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: options.html,
            Charset: 'UTF-8',
          },
        },
      },
    });

    await this.sesClient!.send(command);
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
