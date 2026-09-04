import type { FastifyReply, FastifyRequest } from "fastify";
import { SESSION_COOKIE_NAME, renovarSeNecessario, validarSessao } from "../services/investorSession.js";

/**
 * Deriva `request.investorId` do cookie de sessao httpOnly (`sid`) - nunca de
 * um campo que o cliente manda no body/query/`:id` (fecha SEC-B02, ver
 * docs/backend/features/006-autenticacao-investidor/plan.md). Diferente de
 * `adminAuth.exigirGestor` (aplicado ao plugin inteiro via `app.addHook`),
 * este precisa ser passado como `preHandler` POR ROTA: os arquivos de rota do
 * investidor (`imoveis.ts`, `marketplace.ts`) misturam endpoints publicos
 * (catalogo, listagens) com privados no mesmo plugin - um `addHook` no
 * plugin inteiro quebraria as leituras publicas.
 */
export async function exigirInvestidor(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const token = request.cookies[SESSION_COOKIE_NAME];
  const session = token ? await validarSessao(token) : null;
  if (!session) {
    await reply.code(401).send({ codigo: "SESSAO_INVALIDA" });
    return;
  }
  request.investorId = session.investorId;
  renovarSeNecessario(session);
}
