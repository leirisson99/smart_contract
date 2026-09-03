import type { FastifyInstance } from "fastify";
import { processKycWebhookResult } from "../services/kycWebhookService.js";
import { exigirSegredoKycWebhook } from "../middleware/webhookAuth.js";

/**
 * Callback do provedor de KYC. O fluxo automatico da POC (MockKycProvider)
 * chama `processKycWebhookResult` direto por referencia de funcao (ver
 * src/routes/kyc.ts), sem passar por HTTP - esta rota existe para ter o
 * mesmo formato de payload que um provedor real (Didit/Sumsub/idwall -
 * decisao pendente em docs/PENDENCIAS.md) vai chamar via HTTP, por isso exige
 * o mesmo segredo compartilhado que a integracao real usaria para assinar o
 * webhook (ver middleware/webhookAuth.ts).
 */
export async function webhookRoutes(app: FastifyInstance) {
  app.addHook("preHandler", exigirSegredoKycWebhook);

  app.post("/webhooks/kyc/mock", async (request, reply) => {
    const body = request.body as
      | { providerReference?: string; result?: "APPROVED" | "REJECTED"; reason?: string }
      | undefined;

    if (!body?.providerReference || !body?.result) {
      return reply.code(400).send({ error: "providerReference e result sao obrigatorios" });
    }

    await processKycWebhookResult({
      providerReference: body.providerReference,
      result: body.result,
      reason: body.reason,
    });

    return reply.code(200).send({ ok: true });
  });
}
