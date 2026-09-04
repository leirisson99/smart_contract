import nodemailer from "nodemailer";
import { config } from "../config.js";

const smtpConfigurado = Boolean(config.smtpHost && config.smtpUser && config.smtpPass);

const transportador = smtpConfigurado
  ? nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      auth: { user: config.smtpUser, pass: config.smtpPass },
    })
  : null;

export interface EnviarEmailInput {
  to: string;
  subject: string;
  text: string;
}

interface LoggerMinimo {
  info: (obj: unknown, msg?: string) => void;
}

/**
 * Sem SMTP configurado (dev/test - ver SMTP_HOST/SMTP_USER/SMTP_PASS em
 * .env.example), cai num fallback que loga o corpo do e-mail em vez de
 * enviar de verdade - mesmo espirito do MockKycProvider, nao bloqueia
 * desenvolvimento local sem conta SMTP.
 */
export async function enviarEmail(input: EnviarEmailInput, logger: LoggerMinimo): Promise<void> {
  if (!transportador) {
    logger.info(
      { to: input.to, subject: input.subject, text: input.text },
      "SMTP nao configurado - e-mail logado em vez de enviado (dev/test)",
    );
    return;
  }
  await transportador.sendMail({ from: config.smtpFrom, to: input.to, subject: input.subject, text: input.text });
}
