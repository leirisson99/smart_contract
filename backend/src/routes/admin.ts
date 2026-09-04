import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db/client.js";
import { exigirGestor } from "../middleware/adminAuth.js";
import { criarImovelOnChain, depositarRendimentoOnChain, TransacaoRevertidaError } from "../services/adminChain.js";
import { serializeImovel } from "./imoveis.js";
import { mensagemErroZod } from "../validation.js";

const STATUS_KYC_PADRAO = "PENDING";

const WEI_REGEX = /^\d+$/;
const weiSchema = (campo: string) => z.string().regex(WEI_REGEX, `${campo} deve ser um inteiro (wei) valido`);

const criarImovelSchema = z.object({
  nome: z.string().min(1, "nome e obrigatorio"),
  imagemUrl: z.string().optional(),
  valorTotal: weiSchema("valorTotal"),
  totalCotas: z.number().int("totalCotas deve ser um inteiro positivo").positive("totalCotas deve ser um inteiro positivo"),
  rendimentoEstimadoAnual: z.number(),
});

const depositarRendimentoSchema = z.object({
  valor: weiSchema("valor"),
});

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
    const parsed = criarImovelSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: mensagemErroZod(parsed.error) });
    }
    const body = parsed.data;

    const valorTotal = BigInt(body.valorTotal);
    const totalCotas = BigInt(body.totalCotas);
    if (valorTotal <= 0n || valorTotal % totalCotas !== 0n) {
      return reply.code(400).send({ error: "valorTotal deve ser divisivel por totalCotas" });
    }

    // Nenhuma transacao on-chain e reversivel: gravamos a tentativa ANTES de
    // iniciar as 3 transacoes (criarImovel, deploy do DividendDistributor,
    // grantRole) para que uma falha na 2a/3a nunca deixe contratos deployados
    // sem nenhum rastro no banco - ver PropertyCreationAttempt no schema.
    const tentativa = await prisma.propertyCreationAttempt.create({
      data: {
        nome: body.nome,
        valorTotal: valorTotal.toString(),
        totalCotas: Number(totalCotas),
        rendimentoEstimadoAnual: body.rendimentoEstimadoAnual,
        imagemUrl: body.imagemUrl ?? null,
      },
    });

    let onChain: Awaited<ReturnType<typeof criarImovelOnChain>>;
    try {
      onChain = await criarImovelOnChain({ nome: body.nome, valorTotal, numeroCotas: totalCotas }, async (progresso) => {
        await prisma.propertyCreationAttempt.update({
          where: { id: tentativa.id },
          data: {
            propertyTokenAddress: progresso.propertyTokenAddress,
            dividendDistributorAddress: progresso.dividendDistributorAddress,
            txHashCriacao: progresso.txHashCriacao,
            txHashDistributor: progresso.txHashDistributor,
          },
        });
      });
    } catch (err) {
      await prisma.propertyCreationAttempt.update({
        where: { id: tentativa.id },
        data: { status: "FAILED", erro: err instanceof Error ? err.message : String(err) },
      });
      request.log.error({ err, tentativaId: tentativa.id }, "falha ao executar PropertyFactory.criarImovel on-chain");
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
    await prisma.propertyCreationAttempt.update({
      where: { id: tentativa.id },
      data: { status: "COMPLETED", propertyId: property.id },
    });

    return reply.code(201).send(await serializeImovel(property));
  });

  app.post("/admin/imoveis/:id/depositar-rendimento", async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = depositarRendimentoSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: mensagemErroZod(parsed.error) });
    }
    const valor = BigInt(parsed.data.valor);
    if (valor <= 0n) {
      return reply.code(400).send({ error: "valor deve ser positivo" });
    }

    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) {
      return reply.code(404).send({ error: "imovel nao encontrado" });
    }

    // Idempotencia: sem isso, um duplo-clique ou retry do gestor dispara
    // approve+depositarRendimento duas vezes e cria dois ciclos reais
    // on-chain (nao ha model de Ciclo no banco para dedupar depois - o
    // contrato e a unica fonte de verdade do ciclo atual). CAS atomico via
    // `updateMany`: so uma requisicao consegue travar a linha por vez. Uma
    // trava mais velha que TRAVA_TTL_MS e tratada como presa (processo
    // derrubado no meio de um deposito) e pode ser retomada.
    const TRAVA_TTL_MS = 5 * 60 * 1000;
    const agora = new Date();
    const travaExpiradaAntesDe = new Date(agora.getTime() - TRAVA_TTL_MS);
    const trava = await prisma.property.updateMany({
      where: {
        id,
        OR: [{ rendimentoDepositoTravadoEm: null }, { rendimentoDepositoTravadoEm: { lt: travaExpiradaAntesDe } }],
      },
      data: { rendimentoDepositoTravadoEm: agora },
    });
    if (trava.count === 0) {
      return reply.code(409).send({ codigo: "DEPOSITO_EM_ANDAMENTO" });
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
    } finally {
      await prisma.property.update({ where: { id }, data: { rendimentoDepositoTravadoEm: null } });
    }
  });
}
