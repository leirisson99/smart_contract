import type { FastifyInstance } from "fastify";
import { prisma } from "../db/client.js";
import { balanceOfOnChain, lerImovelOnChain } from "../services/propertyChain.js";
import { claimPendingForInvestor, pendingCyclesFor } from "../services/yieldClaimJob.js";

export async function portfolioRoutes(app: FastifyInstance) {
  app.get("/investors/:id/portfolio", async (request, reply) => {
    const { id } = request.params as { id: string };
    const investor = await prisma.investor.findUnique({ where: { id } });
    if (!investor) {
      return reply.code(404).send({ error: "investidor nao encontrado" });
    }
    const wallet = investor.walletAddress as `0x${string}`;

    const investments = await prisma.investment.findMany({ where: { investorId: id } });
    const propertyIds = [...new Set(investments.map((i) => i.propertyId))];
    const properties = await prisma.property.findMany({ where: { id: { in: propertyIds } } });

    const nomesPorImovel = new Map<string, string>();
    const holdings = await Promise.all(
      properties.map(async (property) => {
        const onChain = await lerImovelOnChain(property.propertyTokenAddress as `0x${string}`);
        nomesPorImovel.set(property.id, onChain.nome);

        const cotas = await balanceOfOnChain(property.propertyTokenAddress as `0x${string}`, wallet);
        const valorInvestido = investments
          .filter((i) => i.propertyId === property.id)
          .reduce((acc, i) => acc + BigInt(i.valorPago), 0n);

        return {
          imovelId: property.id,
          imovelNome: onChain.nome,
          cotas: Number(cotas),
          valorInvestido: valorInvestido.toString(),
        };
      }),
    );

    const yieldClaims = await prisma.yieldClaim.findMany({
      where: { investorId: id },
      orderBy: { claimedAt: "desc" },
    });
    const rendimentosRecebidos = yieldClaims.map((claim) => ({
      id: claim.id,
      imovelNome: nomesPorImovel.get(claim.propertyId) ?? claim.propertyId,
      cicloReferencia: claim.cicloId,
      valor: claim.valor,
      dataRecebimento: claim.claimedAt,
    }));

    const valorTotalInvestido = holdings.reduce((acc, h) => acc + BigInt(h.valorInvestido), 0n);

    const pendentesPorImovel = await Promise.all(
      properties.map((property) =>
        pendingCyclesFor(
          property.dividendDistributorAddress as `0x${string}`,
          wallet,
          property.id,
          investor.id,
        ),
      ),
    );
    let rendimentoPendenteClaim = 0n;
    for (const pendentes of pendentesPorImovel) {
      rendimentoPendenteClaim = pendentes.reduce((acc, p) => acc + p.valor, rendimentoPendenteClaim);
    }

    return reply.send({
      holdings,
      valorTotalInvestido: valorTotalInvestido.toString(),
      rendimentosRecebidos,
      rendimentoPendenteClaim: rendimentoPendenteClaim.toString(),
    });
  });

  app.post("/investors/:id/portfolio/claim", async (request, reply) => {
    const { id } = request.params as { id: string };
    const investor = await prisma.investor.findUnique({ where: { id } });
    if (!investor) {
      return reply.code(404).send({ error: "investidor nao encontrado" });
    }

    try {
      const { claimsExecutados } = await claimPendingForInvestor(id);
      return reply.send({ claimsExecutados });
    } catch (err) {
      request.log.error({ err }, "falha ao reivindicar rendimentos on-chain");
      return reply.code(502).send({ codigo: "ERRO_DESCONHECIDO" });
    }
  });
}
