import type { FastifyReply, FastifyRequest } from "fastify";
import { config } from "../config.js";

/**
 * Unico mecanismo de autenticacao/RBAC do backend hoje (feature 005):
 * chave estatica compartilhada com o gestor via header `x-admin-api-key`,
 * comparada em tempo constante contra `ADMIN_API_KEY`. Decisao registrada em
 * `docs/backend/features/005-painel-administrativo/plan.md` - suficiente
 * para o unico papel administrativo da POC (nao ha cadastro de gestores nem
 * necessidade de sessao/expiracao). RNF-16: mesmo que este middleware falhe
 * em barrar a chamada, o contrato revalida `PLATFORM_ADMIN_ROLE`/`GESTOR_ROLE`
 * de qualquer forma (ver `adminChain.ts`).
 */
export async function exigirGestor(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const chaveRecebida = request.headers["x-admin-api-key"];
  if (typeof chaveRecebida !== "string" || !chavesIguais(chaveRecebida, config.adminApiKey)) {
    await reply.code(403).send({ codigo: "ROLE_INVALIDA" });
  }
}

/** Compara em tempo constante para nao vazar a chave via timing attack. */
function chavesIguais(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
