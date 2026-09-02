import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../src/db/client.js";
import { createCustodialWallet, encryptSecret } from "../src/services/walletCustody.js";

vi.mock("../src/services/propertyChain.js", () => ({
  lerImovelOnChain: vi.fn(async () => ({
    nome: "Edificio Aurora",
    precoPorCota: 1_000n,
    totalCotas: 1_000n,
    cotasDisponiveis: 900n,
    totalSupply: 100n,
    moedaPagamento: "0xmoeda",
  })),
  balanceOfOnChain: vi.fn(async () => 7n),
  cicloAtualOnChain: vi.fn(async () => 0n),
  valorReivindicavelOnChain: vi.fn(async () => 0n),
}));

import { buildServer } from "../src/server.js";
import { balanceOfOnChain, cicloAtualOnChain, valorReivindicavelOnChain } from "../src/services/propertyChain.js";

async function createInvestor() {
  const wallet = createCustodialWallet();
  return prisma.investor.create({
    data: {
      fullName: "Investidor Portfolio",
      cpfEncrypted: encryptSecret("12345678900"),
      walletAddress: wallet.address,
      walletKeyEnc: wallet.walletKeyEnc,
    },
  });
}

async function createProperty() {
  return prisma.property.create({
    data: {
      propertyTokenAddress: `0x${"3".repeat(40)}`,
      dividendDistributorAddress: `0x${"4".repeat(40)}`,
      rendimentoEstimadoAnual: 8.5,
      valorMinimoInvestimento: "1000",
    },
  });
}

describe("rota de portfolio (feature 003)", () => {
  const app = buildServer();

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(balanceOfOnChain).mockResolvedValue(7n);
    vi.mocked(cicloAtualOnChain).mockResolvedValue(0n);
    vi.mocked(valorReivindicavelOnChain).mockResolvedValue(0n);
    await prisma.yieldClaim.deleteMany();
    await prisma.investment.deleteMany();
    await prisma.property.deleteMany();
    await prisma.kycSubmission.deleteMany();
    await prisma.investor.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it("retorna 404 para investidor inexistente", async () => {
    const res = await app.inject({ method: "GET", url: "/investors/nao-existe/portfolio" });
    expect(res.statusCode).toBe(404);
  });

  it("agrega holdings, valor investido e historico de rendimentos", async () => {
    const investor = await createInvestor();
    const property = await createProperty();
    await prisma.investment.create({
      data: { investorId: investor.id, propertyId: property.id, cotas: 3, valorPago: "3000", txHash: "0xcompra1" },
    });
    await prisma.investment.create({
      data: { investorId: investor.id, propertyId: property.id, cotas: 2, valorPago: "2000", txHash: "0xcompra2" },
    });
    await prisma.yieldClaim.create({
      data: { investorId: investor.id, propertyId: property.id, cicloId: 1, valor: "150", txHash: "0xclaim1" },
    });

    const res = await app.inject({ method: "GET", url: `/investors/${investor.id}/portfolio` });
    expect(res.statusCode).toBe(200);
    const body = res.json();

    expect(body.holdings).toHaveLength(1);
    expect(body.holdings[0]).toMatchObject({ imovelId: property.id, imovelNome: "Edificio Aurora", cotas: 7 });
    expect(body.valorTotalInvestido).toBe("5000");
    expect(body.rendimentosRecebidos).toHaveLength(1);
    expect(body.rendimentosRecebidos[0]).toMatchObject({ cicloReferencia: 1, valor: "150" });
    expect(body.rendimentoPendenteClaim).toBe("0");
  });

  it("soma o rendimento pendente de ciclos ainda nao reivindicados", async () => {
    const investor = await createInvestor();
    const property = await createProperty();
    await prisma.investment.create({
      data: { investorId: investor.id, propertyId: property.id, cotas: 1, valorPago: "1000", txHash: "0xcompra1" },
    });
    vi.mocked(cicloAtualOnChain).mockResolvedValue(2n);
    vi.mocked(valorReivindicavelOnChain).mockImplementation(async (_dist, _wallet, ciclo) => (ciclo === 1n ? 100n : 50n));

    const res = await app.inject({ method: "GET", url: `/investors/${investor.id}/portfolio` });
    expect(res.json().rendimentoPendenteClaim).toBe("150");
  });
});
