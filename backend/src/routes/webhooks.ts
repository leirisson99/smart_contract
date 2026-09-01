import type { FastifyInstance } from "fastify";
import { processKycWebhookResult } from "../services/kycWebhookService.js";

/**
 * Callback do provedor de KYC. Hoje so o provedor mock chama esta rota (ver
 * src/services/kycProvider/mockProvider.ts), mas o formato do payload segue
 * o desenho generico para poder ser reaproveitado por um provedor real
 * (Didit/Sumsub/idwall - decisao pendente em docs/PENDENCIAS.md).
 */
export async function webhookRoutes(app: FastifyInstance) {
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
