import type { FastifyInstance } from "fastify";
import { prisma } from "../db/client.js";
import { decryptSecret } from "../services/walletCustody.js";
import { isVerifiedOnChain } from "../services/trustedIssuerSigner.js";
import { balanceOfOnChain, comprarCotasOnChain, lerImovelOnChain } from "../services/propertyChain.js";
import { garantirGasParaCarteira, garantirSaldoMoedaTeste } from "../services/gasSponsor.js";

export async function serializeImovel(property: { id: string; imagemUrl: string | null; rendimentoEstimadoAnual: number; status: string; valorMinimoInvestimento: string; propertyTokenAddress: string }) {
  const onChain = await lerImovelOnChain(property.propertyTokenAddress as `0x${string}`);
  return {
    id: property.id,
    nome: onChain.nome,
    imagemUrl: property.imagemUrl,
    valorTotal: (onChain.precoPorCota * onChain.totalCotas).toString(),
    totalCotas: Number(onChain.totalCotas),
    cotasRestantes: Number(onChain.cotasDisponiveis),
    precoPorCota: onChain.precoPorCota.toString(),
    rendimentoEstimadoAnual: property.rendimentoEstimadoAnual,
    status: property.status,
    valorMinimoInvestimento: property.valorMinimoInvestimento,
  };
}

export async function imoveisRoutes(app: FastifyInstance) {
  app.get("/imoveis", async () => {
    const properties = await prisma.property.findMany({ orderBy: { createdAt: "asc" } });
    return Promise.all(properties.map(serializeImovel));
  });

  app.get("/imoveis/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) {
      return reply.code(404).send({ error: "imovel nao encontrado" });
    }
    return serializeImovel(property);
  });

  app.post("/imoveis/:id/comprar", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { investorId?: string; quantidade?: number } | undefined;

    if (!body?.investorId || !body?.quantidade || !Number.isInteger(body.quantidade) || body.quantidade <= 0) {
      return reply.code(400).send({ error: "investorId e quantidade (inteiro positivo) sao obrigatorios" });
    }

    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) {
      return reply.code(404).send({ error: "imovel nao encontrado" });
    }

    const investor = await prisma.investor.findUnique({ where: { id: body.investorId } });
    if (!investor) {
      return reply.code(404).send({ error: "investidor nao encontrado" });
    }

    // RNF-16 (ultima linha de defesa): revalida o KYC direto on-chain no
    // momento da chamada, nunca confiando so no status gravado no banco pela
    // feature 001 - que pode estar desatualizado se a claim foi revogada.
    const kycAprovado = await isVerifiedOnChain(investor.walletAddress as `0x${string}`);
    if (!kycAprovado) {
      return reply.code(403).send({ codigo: "SEM_KYC" });
    }

    const onChain = await lerImovelOnChain(property.propertyTokenAddress as `0x${string}`);
    const quantidade = BigInt(body.quantidade);

    if (quantidade > onChain.cotasDisponiveis) {
      return reply.code(400).send({ codigo: "COTAS_INSUFICIENTES" });
    }

    const valorPago = onChain.precoPorCota * quantidade;
    if (valorPago < BigInt(property.valorMinimoInvestimento)) {
      return reply.code(400).send({ codigo: "VALOR_MINIMO_NAO_ATINGIDO" });
    }

    const investorPrivateKey = decryptSecret(investor.walletKeyEnc) as `0x${string}`;

    let txHash: `0x${string}`;
    try {
      await garantirGasParaCarteira(investor.walletAddress as `0x${string}`);
      await garantirSaldoMoedaTeste(onChain.moedaPagamento, investor.walletAddress as `0x${string}`, valorPago);
      txHash = await comprarCotasOnChain({
        investorPrivateKey,
        propertyTokenAddress: property.propertyTokenAddress as `0x${string}`,
        moedaPagamento: onChain.moedaPagamento,
        quantidade,
        valorPago,
      });
    } catch (err) {
      request.log.error({ err }, "falha ao executar comprarCotas on-chain");
      return reply.code(502).send({ codigo: "ERRO_DESCONHECIDO" });
    }

    await prisma.investment.create({
      data: { investorId: investor.id, propertyId: property.id, cotas: body.quantidade, valorPago: valorPago.toString(), txHash },
    });

    const saldoAtual = await balanceOfOnChain(property.propertyTokenAddress as `0x${string}`, investor.walletAddress as `0x${string}`);
    return reply.code(200).send({ txHash, cotasCompradas: body.quantidade, saldoAtual: Number(saldoAtual) });
  });
}
