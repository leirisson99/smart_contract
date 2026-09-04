import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { processKycWebhookResult } from "../services/kycWebhookService.js";
import { exigirSegredoKycWebhook } from "../middleware/webhookAuth.js";
import { mensagemErroZod } from "../validation.js";

const webhookKycSchema = z.object({
  providerReference: z.string().min(1, "providerReference e obrigatorio"),
  result: z.enum(["APPROVED", "REJECTED"], { message: "result e obrigatorio" }),
  reason: z.string().optional(),
});

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
    const parsed = webhookKycSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: mensagemErroZod(parsed.error) });
    }
    const body = parsed.data;

    await processKycWebhookResult({
      providerReference: body.providerReference,
      result: body.result,
      reason: body.reason,
    });

    return reply.code(200).send({ ok: true });
  });
}
