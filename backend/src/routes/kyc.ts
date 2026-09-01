import type { FastifyInstance } from "fastify";
import { prisma } from "../db/client.js";
import { MockKycProvider } from "../services/kycProvider/mockProvider.js";
import { processKycWebhookResult } from "../services/kycWebhookService.js";
import { decryptSecret } from "../services/walletCustody.js";

const provider = new MockKycProvider((result) => processKycWebhookResult(result));

export async function kycRoutes(app: FastifyInstance) {
  app.post("/investors/:id/kyc", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { forceResult?: "APPROVED" | "REJECTED" } | undefined;

    const investor = await prisma.investor.findUnique({ where: { id } });
    if (!investor) {
      return reply.code(404).send({ error: "investidor nao encontrado" });
    }

    const existing = await prisma.kycSubmission.findUnique({ where: { investorId: id } });
    if (existing && existing.status !== "REJECTED") {
      return reply.code(409).send({ error: `ja existe uma submissao de KYC com status ${existing.status}` });
    }

    const cpf = decryptSecret(investor.cpfEncrypted);
    const { providerReference } = await provider.submit({ investorId: id, cpf, forceResult: body?.forceResult });

    const submission = existing
      ? await prisma.kycSubmission.update({
          where: { investorId: id },
          data: {
            status: "PENDING",
            provider: provider.name,
            providerReference,
            rejectionReason: null,
            claimTxHash: null,
          },
        })
      : await prisma.kycSubmission.create({
          data: { investorId: id, status: "PENDING", provider: provider.name, providerReference },
        });

    return reply.code(202).send({ status: submission.status, providerReference: submission.providerReference });
  });
}
