import { createHash, randomBytes } from "node:crypto";
import type { FastifyReply } from "fastify";
import { prisma } from "../db/client.js";

export const SESSION_COOKIE_NAME = "sid";

const SESSAO_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias
const RENOVACAO_LIMITE_MS = 24 * 60 * 60 * 1000; // renova se faltar menos de 1 dia pro vencimento

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export interface SessaoCriada {
  token: string;
  expiresAt: Date;
}

export interface SessaoValidada {
  id: string;
  investorId: string;
  expiresAt: Date;
}

/**
 * Token opaco (256 bits) em vez de JWT: so o hash (sha256) fica no banco, o
 * valor bruto nunca e persistido, e a sessao e revogavel de verdade (logout
 * real via `revokedAt`) - ver docs/on-chain/decisions/ADR-0007.
 */
export async function criarSessao(
  investorId: string,
  meta: { userAgent?: string; ip?: string } = {},
): Promise<SessaoCriada> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSAO_TTL_MS);
  await prisma.investorSession.create({
    data: {
      investorId,
      tokenHash: hashToken(token),
      expiresAt,
      userAgent: meta.userAgent,
      ip: meta.ip,
    },
  });
  return { token, expiresAt };
}

export async function validarSessao(token: string): Promise<SessaoValidada | null> {
  const session = await prisma.investorSession.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    return null;
  }
  return { id: session.id, investorId: session.investorId, expiresAt: session.expiresAt };
}

/** Renovacao deslizante, fire-and-forget - nao atrasa a resposta da rota que chamou `exigirInvestidor`. */
export function renovarSeNecessario(session: SessaoValidada): void {
  const faltaParaVencer = session.expiresAt.getTime() - Date.now();
  if (faltaParaVencer > RENOVACAO_LIMITE_MS) return;
  void prisma.investorSession.update({
    where: { id: session.id },
    data: { expiresAt: new Date(Date.now() + SESSAO_TTL_MS), lastUsedAt: new Date() },
  });
}

export async function revogarSessao(token: string): Promise<void> {
  await prisma.investorSession.updateMany({
    where: { tokenHash: hashToken(token) },
    data: { revokedAt: new Date() },
  });
}

export function setSessionCookie(reply: FastifyReply, token: string, expiresAt: Date): void {
  reply.setCookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export function clearSessionCookie(reply: FastifyReply): void {
  reply.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
}
