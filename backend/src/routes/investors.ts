import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db/client.js";
import { createCustodialWallet, encryptSecret } from "../services/walletCustody.js";
import { mensagemErroZod } from "../validation.js";

const criarInvestorSchema = z.object({
  fullName: z.string().min(1, "fullName e obrigatorio"),
  cpf: z.string().min(1, "cpf e obrigatorio"),
});

export async function investorRoutes(app: FastifyInstance) {
  app.post("/investors", async (request, reply) => {
    const parsed = criarInvestorSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: mensagemErroZod(parsed.error) });
    }
    const body = parsed.data;

    const wallet = createCustodialWallet();
    const investor = await prisma.investor.create({
      data: {
        fullName: body.fullName,
        cpfEncrypted: encryptSecret(body.cpf),
        walletAddress: wallet.address,
        walletKeyEnc: wallet.walletKeyEnc,
      },
    });

    return reply.code(201).send({ investorId: investor.id, walletAddress: investor.walletAddress });
  });

  app.get("/investors/:id/kyc", async (request, reply) => {
    const { id } = request.params as { id: string };
    const kyc = await prisma.kycSubmission.findUnique({ where: { investorId: id } });
    if (!kyc) {
      return reply.code(404).send({ error: "nenhuma submissao de KYC encontrada para este investidor" });
    }
    return reply.send({
      status: kyc.status,
      provider: kyc.provider,
      rejectionReason: kyc.rejectionReason,
      claimTxHash: kyc.claimTxHash,
    });
  });
}
