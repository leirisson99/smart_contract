import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db/client.js";
import { createCustodialWallet, encryptSecret } from "../services/walletCustody.js";
import { gerarSegredoOtp } from "../services/hotp.js";
import { criarSessao, setSessionCookie } from "../services/investorSession.js";
import { exigirInvestidor } from "../middleware/investorAuth.js";
import { mensagemErroZod } from "../validation.js";

const criarInvestorSchema = z.object({
  fullName: z.string().min(1, "fullName e obrigatorio"),
  email: z.string().email("email invalido"),
  cpf: z.string().min(1, "cpf e obrigatorio"),
});

export async function investorRoutes(app: FastifyInstance) {
  app.post("/investors", async (request, reply) => {
    const parsed = criarInvestorSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: mensagemErroZod(parsed.error) });
    }
    const body = parsed.data;

    const emailExistente = await prisma.investor.findUnique({ where: { email: body.email } });
    if (emailExistente) {
      return reply.code(409).send({ codigo: "EMAIL_JA_CADASTRADO" });
    }

    const wallet = createCustodialWallet();
    const investor = await prisma.investor.create({
      data: {
        fullName: body.fullName,
        email: body.email,
        cpfEncrypted: encryptSecret(body.cpf),
        walletAddress: wallet.address,
        walletKeyEnc: wallet.walletKeyEnc,
        otpSecretEnc: encryptSecret(gerarSegredoOtp()),
      },
    });

    // Cadastro ja autentica (feature 006-autenticacao-investidor): evita um
    // estado intermediario "conta criada mas sem sessao ainda" entre este 201
    // e a submissao de KYC que o frontend dispara logo em seguida
    // (POST /kyc). HOTP fica so para o retorno de quem ja tem conta.
    const sessao = await criarSessao(investor.id, {
      userAgent: typeof request.headers["user-agent"] === "string" ? request.headers["user-agent"] : undefined,
      ip: request.ip,
    });
    setSessionCookie(reply, sessao.token, sessao.expiresAt);

    return reply.code(201).send({ investorId: investor.id, walletAddress: investor.walletAddress });
  });

  app.get("/kyc", { preHandler: exigirInvestidor }, async (request, reply) => {
    const kyc = await prisma.kycSubmission.findUnique({ where: { investorId: request.investorId } });
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
