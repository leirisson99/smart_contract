import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../src/db/client.js";
import { createCustodialWallet, encryptSecret } from "../src/services/walletCustody.js";

vi.mock("../src/services/propertyChain.js", () => ({
  cicloAtualOnChain: vi.fn(async () => 0n),
  valorReivindicavelOnChain: vi.fn(async () => 0n),
  claimTodosOnChain: vi.fn(async () => "0xbatch"),
  claimCicloOnChain: vi.fn(async () => "0xindividual"),
}));

import { runYieldClaimJob } from "../src/services/yieldClaimJob.js";
import {
  cicloAtualOnChain,
  claimCicloOnChain,
  claimTodosOnChain,
  valorReivindicavelOnChain,
} from "../src/services/propertyChain.js";

async function createInvestor(nome: string) {
  const wallet = createCustodialWallet();
  return prisma.investor.create({
    data: {
      fullName: nome,
      cpfEncrypted: encryptSecret("12345678900"),
      walletAddress: wallet.address,
      walletKeyEnc: wallet.walletKeyEnc,
    },
  });
}

async function createProperty() {
  return prisma.property.create({
    data: {
      propertyTokenAddress: `0x${"5".repeat(40)}`,
      dividendDistributorAddress: `0x${"6".repeat(40)}`,
      rendimentoEstimadoAnual: 8.5,
      valorMinimoInvestimento: "1000",
    },
  });
}

describe("runYieldClaimJob (RF-24)", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(cicloAtualOnChain).mockResolvedValue(0n);
    vi.mocked(valorReivindicavelOnChain).mockResolvedValue(0n);
    vi.mocked(claimTodosOnChain).mockResolvedValue("0xbatch");
    vi.mocked(claimCicloOnChain).mockResolvedValue("0xindividual");
    await prisma.yieldClaim.deleteMany();
    await prisma.investment.deleteMany();
    await prisma.property.deleteMany();
    await prisma.kycSubmission.deleteMany();
    await prisma.investor.deleteMany();
  });

  it("reivindica via claimTodos e registra um YieldClaim por ciclo pendente", async () => {
    const investor = await createInvestor("Investidor A");
    const property = await createProperty();
    await prisma.investment.create({
      data: { investorId: investor.id, propertyId: property.id, cotas: 5, valorPago: "5000", txHash: "0xcompra" },
    });
    vi.mocked(cicloAtualOnChain).mockResolvedValue(2n);
    vi.mocked(valorReivindicavelOnChain).mockImplementation(async (_dist, _wallet, ciclo) =>
      ciclo === 1n ? 100n : 50n,
    );

    const result = await runYieldClaimJob();

    expect(result).toEqual({ investidoresProcessados: 1, claimsExecutados: 2 });
    expect(claimTodosOnChain).toHaveBeenCalledTimes(1);
    expect(claimCicloOnChain).not.toHaveBeenCalled();

    const claims = await prisma.yieldClaim.findMany({ where: { investorId: investor.id }, orderBy: { cicloId: "asc" } });
    expect(claims).toHaveLength(2);
    expect(claims[0]).toMatchObject({ cicloId: 1, valor: "100", txHash: "0xbatch" });
    expect(claims[1]).toMatchObject({ cicloId: 2, valor: "50", txHash: "0xbatch" });
  });

  it("e idempotente: rodar de novo nao reivindica ciclos ja registrados", async () => {
    const investor = await createInvestor("Investidor Idempotente");
    const property = await createProperty();
    await prisma.investment.create({
      data: { investorId: investor.id, propertyId: property.id, cotas: 5, valorPago: "5000", txHash: "0xcompra" },
    });
    vi.mocked(cicloAtualOnChain).mockResolvedValue(1n);
    vi.mocked(valorReivindicavelOnChain).mockResolvedValue(100n);

    await runYieldClaimJob();
    expect(claimTodosOnChain).toHaveBeenCalledTimes(1);

    // Segunda rodada: valorReivindicavel ainda "retornaria" >0 na chain real so
    // se o claim nao tivesse ido - mas o filtro por YieldClaim ja registrado
    // e o que garante que o job nao tenta de novo, independente do mock.
    vi.mocked(claimTodosOnChain).mockClear();
    const second = await runYieldClaimJob();

    expect(second.claimsExecutados).toBe(0);
    expect(claimTodosOnChain).not.toHaveBeenCalled();
  });

  it("cai para claim individual quando claimTodos falha, isolando a falha por ciclo", async () => {
    const investor = await createInvestor("Investidor Fallback");
    const property = await createProperty();
    await prisma.investment.create({
      data: { investorId: investor.id, propertyId: property.id, cotas: 5, valorPago: "5000", txHash: "0xcompra" },
    });
    vi.mocked(cicloAtualOnChain).mockResolvedValue(2n);
    vi.mocked(valorReivindicavelOnChain).mockResolvedValue(100n);
    vi.mocked(claimTodosOnChain).mockRejectedValue(new Error("revert simulado"));
    vi.mocked(claimCicloOnChain).mockImplementation(async (_dist, _key, ciclo) => {
      if (ciclo === 2n) throw new Error("falha isolada no ciclo 2");
      return "0xindividual-ciclo1";
    });

    const result = await runYieldClaimJob();

    expect(result).toEqual({ investidoresProcessados: 1, claimsExecutados: 1 });
    const claims = await prisma.yieldClaim.findMany({ where: { investorId: investor.id } });
    expect(claims).toHaveLength(1);
    expect(claims[0]).toMatchObject({ cicloId: 1, txHash: "0xindividual-ciclo1" });
  });

  it("falha total de um investidor nao impede o sucesso dos demais", async () => {
    const investorFalho = await createInvestor("Investidor Falho");
    const investorOk = await createInvestor("Investidor OK");
    const property = await createProperty();
    await prisma.investment.create({
      data: { investorId: investorFalho.id, propertyId: property.id, cotas: 1, valorPago: "1000", txHash: "0xcompra1" },
    });
    await prisma.investment.create({
      data: { investorId: investorOk.id, propertyId: property.id, cotas: 1, valorPago: "1000", txHash: "0xcompra2" },
    });
    vi.mocked(cicloAtualOnChain).mockResolvedValue(1n);
    vi.mocked(valorReivindicavelOnChain).mockResolvedValue(100n);

    // O primeiro investidor processado falha por completo (claimTodos E o
    // fallback individual revertem); o segundo tem sucesso normal via
    // claimTodos. A ordem de processamento segue a ordem de criacao dos
    // Investments (investorFalho antes de investorOk).
    let chamadasClaimTodos = 0;
    vi.mocked(claimTodosOnChain).mockImplementation(async () => {
      chamadasClaimTodos += 1;
      if (chamadasClaimTodos === 1) throw new Error("revert simulado no investidor falho");
      return "0xbatch-ok";
    });
    vi.mocked(claimCicloOnChain).mockImplementation(async () => {
      throw new Error("fallback tambem falha para o investidor falho");
    });

    const result = await runYieldClaimJob();

    expect(result.investidoresProcessados).toBe(2);
    expect(result.claimsExecutados).toBe(1);

    const claimsFalho = await prisma.yieldClaim.findMany({ where: { investorId: investorFalho.id } });
    expect(claimsFalho).toHaveLength(0);
    const claimsOk = await prisma.yieldClaim.findMany({ where: { investorId: investorOk.id } });
    expect(claimsOk).toHaveLength(1);
    expect(claimsOk[0]).toMatchObject({ txHash: "0xbatch-ok" });
  });
});
