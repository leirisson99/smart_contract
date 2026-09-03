import type { FastifyInstance } from "fastify";
import { prisma } from "../db/client.js";
import { exigirGestor } from "../middleware/adminAuth.js";
import { criarImovelOnChain, depositarRendimentoOnChain, TransacaoRevertidaError } from "../services/adminChain.js";
import { serializeImovel } from "./imoveis.js";

const STATUS_KYC_PADRAO = "PENDING";

/**
 * Endpoints do painel do gestor (RF-25, feature 005). Todos exigem o header
 * `x-admin-api-key` (ver `middleware/adminAuth.ts`) - unico grupo de rotas
 * autenticado do backend hoje; `addHook` aqui dentro so afeta as rotas
 * registradas nesta mesma factory (encapsulamento do Fastify), sem vazar
 * para `imoveis.ts`/`investors.ts`/etc.
 */
export async function adminRoutes(app: FastifyInstance) {
  app.addHook("preHandler", exigirGestor);

  app.get("/admin/investidores", async () => {
    const investors = await prisma.investor.findMany({
      include: { kyc: true },
      orderBy: { createdAt: "asc" },
    });
    return investors.map((investor) => ({
      id: investor.id,
      nome: investor.fullName,
      walletAddress: investor.walletAddress,
      statusKyc: investor.kyc?.status ?? STATUS_KYC_PADRAO,
    }));
  });

  app.post("/admin/imoveis", async (request, reply) => {
    const body = request.body as
      | { nome?: string; imagemUrl?: string; valorTotal?: string; totalCotas?: number; rendimentoEstimadoAnual?: number }
      | undefined;

    if (
      !body?.nome ||
      !body?.valorTotal ||
      !body?.totalCotas ||
      !Number.isInteger(body.totalCotas) ||
      body.totalCotas <= 0 ||
      body?.rendimentoEstimadoAnual === undefined
    ) {
      return reply
        .code(400)
        .send({ error: "nome, valorTotal (wei), totalCotas (inteiro positivo) e rendimentoEstimadoAnual sao obrigatorios" });
    }

    let valorTotal: bigint;
    try {
      valorTotal = BigInt(body.valorTotal);
    } catch {
      return reply.code(400).send({ error: "valorTotal deve ser um inteiro (wei) valido" });
    }
    const totalCotas = BigInt(body.totalCotas);
    if (valorTotal <= 0n || valorTotal % totalCotas !== 0n) {
      return reply.code(400).send({ error: "valorTotal deve ser divisivel por totalCotas" });
    }

    let onChain: Awaited<ReturnType<typeof criarImovelOnChain>>;
    try {
      onChain = await criarImovelOnChain({ nome: body.nome, valorTotal, numeroCotas: totalCotas });
    } catch (err) {
      request.log.error({ err }, "falha ao executar PropertyFactory.criarImovel on-chain");
      return reply.code(502).send({ codigo: "ERRO_DESCONHECIDO" });
    }

    const precoPorCota = valorTotal / totalCotas;
    const property = await prisma.property.create({
      data: {
        propertyTokenAddress: onChain.propertyTokenAddress,
        dividendDistributorAddress: onChain.dividendDistributorAddress,
        imagemUrl: body.imagemUrl ?? null,
        rendimentoEstimadoAnual: body.rendimentoEstimadoAnual,
        valorMinimoInvestimento: precoPorCota.toString(),
      },
    });

    return reply.code(201).send(await serializeImovel(property));
  });

  app.post("/admin/imoveis/:id/depositar-rendimento", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { valor?: string } | undefined;

    if (!body?.valor) {
      return reply.code(400).send({ error: "valor (wei) e obrigatorio" });
    }
    let valor: bigint;
    try {
      valor = BigInt(body.valor);
    } catch {
      return reply.code(400).send({ error: "valor deve ser um inteiro (wei) valido" });
    }
    if (valor <= 0n) {
      return reply.code(400).send({ error: "valor deve ser positivo" });
    }

    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) {
      return reply.code(404).send({ error: "imovel nao encontrado" });
    }

    try {
      const resultado = await depositarRendimentoOnChain({
        dividendDistributorAddress: property.dividendDistributorAddress as `0x${string}`,
        valor,
      });
      return reply.send({ idCiclo: Number(resultado.idCiclo), txHash: resultado.txHash });
    } catch (err) {
      if (err instanceof TransacaoRevertidaError) {
        request.log.warn({ err }, "DividendDistributor.depositarRendimento revertida");
        return reply.code(502).send({ codigo: "ERRO_DESCONHECIDO" });
      }
      request.log.error({ err }, "falha ao executar DividendDistributor.depositarRendimento on-chain");
      return reply.code(502).send({ codigo: "ERRO_DESCONHECIDO" });
    }
  });
}
