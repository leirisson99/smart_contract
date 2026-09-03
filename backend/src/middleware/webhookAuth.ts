import type { FastifyReply, FastifyRequest } from "fastify";
import { config } from "../config.js";
import { chavesIguais } from "./adminAuth.js";

/**
 * `POST /webhooks/kyc/mock` nao tinha nenhuma autenticacao apesar do
 * `providerReference` (chave usada para localizar a submissao) ser devolvido
 * diretamente na resposta de `POST /investors/:id/kyc` - qualquer um que o
 * obtivesse podia forcar `result: "APPROVED"` direto no webhook, sem passar
 * pela decisao real do provedor. Mesmo mecanismo de `adminAuth.exigirGestor`
 * (segredo estatico comparado em tempo constante), so que aqui simulando o
 * segredo compartilhado que um provedor real de KYC (Didit/Sumsub/idwall)
 * enviaria no header de assinatura do webhook.
 */
export async function exigirSegredoKycWebhook(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const segredoRecebido = request.headers["x-kyc-webhook-secret"];
  if (typeof segredoRecebido !== "string" || !chavesIguais(segredoRecebido, config.kycWebhookSecret)) {
    await reply.code(403).send({ codigo: "SEGREDO_INVALIDO" });
  }
}
