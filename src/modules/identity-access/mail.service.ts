import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class IdentityAccessMailService {
  private readonly logger = new Logger(IdentityAccessMailService.name);
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(configService: ConfigService) {
    const isProduction = configService.get<string>('NODE_ENV') === 'production';
    const host = configService.get<string>('MAIL_HOST');
    const port = Number(configService.get<string>('MAIL_PORT') ?? '587');
    const secure = configService.get<string>('MAIL_SECURE') === 'true';
    const user = configService.get<string>('MAIL_USER');
    const pass = configService.get<string>('MAIL_PASS');
    this.from =
      configService.get<string>('MAIL_FROM') ??
      'SPD Ecommerce <no-reply@spd.local>';

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
      });
      return;
    }

    if (isProduction) {
      throw new Error(
        'Mail transport is not fully configured for production environment.',
      );
    }

    this.transporter = nodemailer.createTransport({
      jsonTransport: true,
    });
  }

  async sendPasswordResetCode(input: {
    to: string;
    name: string;
    code: string;
  }): Promise<void> {
    const info = (await this.transporter.sendMail({
      from: this.from,
      to: input.to,
      subject: 'Codigo de recuperacao de senha',
      text:
        `Ola, ${input.name}.\n\n` +
        `Seu codigo de recuperacao e ${input.code}.\n` +
        `Ele expira em 3 minutos.\n\n` +
        `Se voce nao solicitou essa alteracao, ignore este e-mail.`,
      html:
        `<p>Ola, ${input.name}.</p>` +
        `<p>Seu codigo de recuperacao e <strong>${input.code}</strong>.</p>` +
        `<p>Ele expira em <strong>3 minutos</strong>.</p>` +
        `<p>Se voce nao solicitou essa alteracao, ignore este e-mail.</p>`,
    })) as {
      messageId?: string;
      message?: unknown;
    };

    this.logger.log(
      `Password reset message queued for ${input.to}. Transport response: ${info.messageId ?? 'json-transport'}`,
    );
  }
}
