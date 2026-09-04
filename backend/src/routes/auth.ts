import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db/client.js";
import { decryptSecret } from "../services/walletCustody.js";
import { codigoOtpValido, gerarCodigoOtp } from "../services/hotp.js";
import { enviarEmail } from "../services/mailer.js";
import {
  SESSION_COOKIE_NAME,
  clearSessionCookie,
  criarSessao,
  revogarSessao,
  setSessionCookie,
} from "../services/investorSession.js";
import { exigirInvestidor } from "../middleware/investorAuth.js";

const OTP_VALIDADE_MS = 5 * 60 * 1000;
const OTP_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_TENTATIVAS = 5;

const solicitarSchema = z.object({ email: z.string().email() });
const verificarSchema = z.object({ email: z.string().email(), codigo: z.string().min(1) });

function statusKycDoInvestor(kyc: { status: string } | null): string {
  return kyc?.status ?? "PENDING";
}

function userAgentDe(request: { headers: Record<string, unknown> }): string | undefined {
  const valor = request.headers["user-agent"];
  return typeof valor === "string" ? valor : undefined;
}

/**
 * Login sem senha do investidor (feature 006-autenticacao-investidor): posse
 * da caixa de e-mail cadastrada e o unico fator, provada por um codigo HOTP
 * (RFC 4226, ver services/hotp.ts). Substitui o localStorage fake
 * (frontend/lib/api/session.ts) por sessao real server-side.
 */
export async function authRoutes(app: FastifyInstance) {
  app.post(
    "/auth/otp/solicitar",
    { config: { rateLimit: { max: 5, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const parsed = solicitarSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ codigo: "EMAIL_INVALIDO" });
      }
      const { email } = parsed.data;

      const investor = await prisma.investor.findUnique({ where: { email } });
      // Resposta identica exista ou nao o investidor - anti-enumeracao de e-mail cadastrado.
      if (!investor) {
        return reply.code(202).send({ ok: true });
      }

      if (investor.otpLastRequestedAt && Date.now() - investor.otpLastRequestedAt.getTime() < OTP_COOLDOWN_MS) {
        return reply.code(429).send({ codigo: "LIMITE_SOLICITACOES_EXCEDIDO" });
      }

      // Avancar o contador aqui invalida implicitamente qualquer codigo
      // anterior ainda nao verificado - reenvio nao precisa de nenhuma
      // limpeza extra, o codigo antigo simplesmente para de bater.
      const counter = investor.otpCounter + 1;
      const secret = decryptSecret(investor.otpSecretEnc);
      const codigo = await gerarCodigoOtp(secret, counter);

      await prisma.investor.update({
        where: { id: investor.id },
        data: {
          otpCounter: counter,
          otpCodeExpiresAt: new Date(Date.now() + OTP_VALIDADE_MS),
          otpAttempts: 0,
          otpLastRequestedAt: new Date(),
        },
      });

      await enviarEmail(
        {
          to: investor.email,
          subject: "Seu codigo de acesso",
          text: `Seu codigo de acesso e ${codigo}. Valido por 5 minutos. Se voce nao pediu este codigo, ignore este e-mail.`,
        },
        request.log,
      );

      return reply.code(202).send({ ok: true });
    },
  );

  app.post("/auth/otp/verificar", async (request, reply) => {
    const parsed = verificarSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ codigo: "CODIGO_INVALIDO" });
    }
    const { email, codigo } = parsed.data;

    const investor = await prisma.investor.findUnique({ where: { email }, include: { kyc: true } });
    if (!investor) {
      return reply.code(401).send({ codigo: "CODIGO_INVALIDO" });
    }
    if (!investor.otpCodeExpiresAt || investor.otpCodeExpiresAt < new Date()) {
      return reply.code(401).send({ codigo: "CODIGO_EXPIRADO" });
    }
    if (investor.otpAttempts >= OTP_MAX_TENTATIVAS) {
      return reply.code(429).send({ codigo: "LIMITE_TENTATIVAS_EXCEDIDO" });
    }
    if (investor.otpConsumedCounter === investor.otpCounter) {
      return reply.code(401).send({ codigo: "CODIGO_INVALIDO" });
    }

    const secret = decryptSecret(investor.otpSecretEnc);
    const valido = await codigoOtpValido(secret, investor.otpCounter, codigo);
    if (!valido) {
      await prisma.investor.update({ where: { id: investor.id }, data: { otpAttempts: { increment: 1 } } });
      return reply.code(401).send({ codigo: "CODIGO_INVALIDO" });
    }

    await prisma.investor.update({ where: { id: investor.id }, data: { otpConsumedCounter: investor.otpCounter } });

    const sessao = await criarSessao(investor.id, { userAgent: userAgentDe(request), ip: request.ip });
    setSessionCookie(reply, sessao.token, sessao.expiresAt);

    return reply.send({
      investorId: investor.id,
      fullName: investor.fullName,
      email: investor.email,
      statusKyc: statusKycDoInvestor(investor.kyc),
    });
  });

  app.get("/auth/me", { preHandler: exigirInvestidor }, async (request, reply) => {
    const investor = await prisma.investor.findUnique({ where: { id: request.investorId }, include: { kyc: true } });
    if (!investor) {
      return reply.code(401).send({ codigo: "SESSAO_INVALIDA" });
    }
    return reply.send({
      investorId: investor.id,
      fullName: investor.fullName,
      email: investor.email,
      statusKyc: statusKycDoInvestor(investor.kyc),
      walletAddress: investor.walletAddress,
    });
  });

  app.post("/auth/logout", async (request, reply) => {
    const token = request.cookies[SESSION_COOKIE_NAME];
    if (token) {
      await revogarSessao(token);
    }
    clearSessionCookie(reply);
    return reply.send({ ok: true });
  });
}
