import { prisma } from "../db/client.js";
import { decryptSecret } from "./walletCustody.js";
import { cicloAtualOnChain, claimCicloOnChain, claimTodosOnChain, valorReivindicavelOnChain } from "./propertyChain.js";
import { garantirGasParaCarteira } from "./gasSponsor.js";

export type PendingCycle = { idCiclo: bigint; valor: bigint };

/**
 * Ciclos com `valorReivindicavel > 0` para este investidor/imovel que ainda
 * nao foram registrados em `YieldClaim` - usado tanto pelo job automatico
 * (RF-24) quanto pelo endpoint de portfolio (RF-23, "rendimento pendente").
 */
export async function pendingCyclesFor(
  distributorAddress: `0x${string}`,
  wallet: `0x${string}`,
  propertyId: string,
  investorId: string,
): Promise<PendingCycle[]> {
  const cicloAtual = await cicloAtualOnChain(distributorAddress);
  const jaRegistrados = await prisma.yieldClaim.findMany({
    where: { investorId, propertyId },
    select: { cicloId: true },
  });
  const registrados = new Set(jaRegistrados.map((r) => r.cicloId));

  const pendentes: PendingCycle[] = [];
  for (let ciclo = 1n; ciclo <= cicloAtual; ciclo++) {
    if (registrados.has(Number(ciclo))) continue;
    const valor = await valorReivindicavelOnChain(distributorAddress, wallet, ciclo);
    if (valor > 0n) pendentes.push({ idCiclo: ciclo, valor });
  }
  return pendentes;
}

/**
 * Reivindica os ciclos pendentes de um investidor num imovel (RF-24): tenta
 * `claimTodos` (uma unica transacao); se falhar, cai para `claim` individual
 * por ciclo, isolando a falha de um ciclo especifico dos demais.
 */
async function claimForInvestorProperty(
  investor: { id: string; walletAddress: string; walletKeyEnc: string },
  property: { id: string; dividendDistributorAddress: string },
): Promise<{ claimed: number }> {
  const wallet = investor.walletAddress as `0x${string}`;
  const distributor = property.dividendDistributorAddress as `0x${string}`;

  const pendentes = await pendingCyclesFor(distributor, wallet, property.id, investor.id);
  if (pendentes.length === 0) return { claimed: 0 };

  const investorPrivateKey = decryptSecret(investor.walletKeyEnc) as `0x${string}`;
  await garantirGasParaCarteira(wallet);

  try {
    const txHash = await claimTodosOnChain(distributor, investorPrivateKey);
    await prisma.yieldClaim.createMany({
      data: pendentes.map((p) => ({
        investorId: investor.id,
        propertyId: property.id,
        cicloId: Number(p.idCiclo),
        valor: p.valor.toString(),
        txHash,
      })),
      skipDuplicates: true,
    });
    return { claimed: pendentes.length };
  } catch {
    let claimed = 0;
    for (const p of pendentes) {
      try {
        const txHash = await claimCicloOnChain(distributor, investorPrivateKey, p.idCiclo);
        await prisma.yieldClaim.create({
          data: {
            investorId: investor.id,
            propertyId: property.id,
            cicloId: Number(p.idCiclo),
            valor: p.valor.toString(),
            txHash,
          },
        });
        claimed += 1;
      } catch {
        // Falha isolada neste ciclo nao pode travar os demais ciclos/investidores (RF-24).
        continue;
      }
    }
    return { claimed };
  }
}

/**
 * Job periodico (RF-24): para cada imovel, identifica os investidores com
 * saldo em cotas (via o ledger de compras) e reivindica os rendimentos
 * pendentes de cada um. Uma falha isolada em um investidor nao interrompe o
 * processamento dos demais - por isso o loop principal tambem tem seu
 * proprio try/catch, alem do de `claimForInvestorProperty`.
 */
export async function runYieldClaimJob(): Promise<{ investidoresProcessados: number; claimsExecutados: number }> {
  const properties = await prisma.property.findMany();
  let investidoresProcessados = 0;
  let claimsExecutados = 0;

  for (const property of properties) {
    const investidoresDoImovel = await prisma.investment.findMany({
      where: { propertyId: property.id },
      select: { investorId: true },
      distinct: ["investorId"],
    });

    for (const { investorId } of investidoresDoImovel) {
      const investor = await prisma.investor.findUnique({ where: { id: investorId } });
      if (!investor) continue;

      try {
        const { claimed } = await claimForInvestorProperty(investor, property);
        investidoresProcessados += 1;
        claimsExecutados += claimed;
      } catch {
        // Falha isolada neste investidor nao pode travar o processamento dos demais (RF-24).
        continue;
      }
    }
  }

  return { investidoresProcessados, claimsExecutados };
}
