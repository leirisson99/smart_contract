import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../src/db/client.js";
import { createCustodialWallet, encryptSecret } from "../src/services/walletCustody.js";

vi.mock("../src/services/trustedIssuerSigner.js", () => ({
  isVerifiedOnChain: vi.fn(async () => true),
  emitirClaimOnChain: vi.fn(async () => "0xunused"),
}));

vi.mock("../src/services/gasSponsor.js", () => ({
  garantirGasParaCarteira: vi.fn(async () => undefined),
  garantirSaldoMoedaTeste: vi.fn(async () => undefined),
}));

vi.mock("../src/services/propertyChain.js", () => ({
  lerImovelOnChain: vi.fn(async () => ({
    nome: "Edificio Aurora",
    precoPorCota: 1_000n,
    totalCotas: 1_000n,
    cotasDisponiveis: 900n,
    totalSupply: 100n,
    moedaPagamento: "0xmoeda",
  })),
  balanceOfOnChain: vi.fn(async () => 5n),
  comprarCotasOnChain: vi.fn(async () => "0xcomprahash"),
}));

import { buildServer } from "../src/server.js";
import { isVerifiedOnChain } from "../src/services/trustedIssuerSigner.js";
import { comprarCotasOnChain, lerImovelOnChain } from "../src/services/propertyChain.js";

async function createInvestor() {
  const wallet = createCustodialWallet();
  return prisma.investor.create({
    data: {
      fullName: "Investidor Teste",
      cpfEncrypted: encryptSecret("12345678900"),
      walletAddress: wallet.address,
      walletKeyEnc: wallet.walletKeyEnc,
    },
  });
}

async function createProperty(overrides: Partial<{ valorMinimoInvestimento: string }> = {}) {
  return prisma.property.create({
    data: {
      propertyTokenAddress: `0x${"1".repeat(40)}`,
      dividendDistributorAddress: `0x${"2".repeat(40)}`,
      rendimentoEstimadoAnual: 8.5,
      valorMinimoInvestimento: overrides.valorMinimoInvestimento ?? "1000",
    },
  });
}

describe("rotas de imoveis (feature 002)", () => {
  const app = buildServer();

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(isVerifiedOnChain).mockResolvedValue(true);
    vi.mocked(lerImovelOnChain).mockResolvedValue({
      nome: "Edificio Aurora",
      precoPorCota: 1_000n,
      totalCotas: 1_000n,
      cotasDisponiveis: 900n,
      totalSupply: 100n,
      moedaPagamento: "0xmoeda" as `0x${string}`,
    });
    await prisma.investment.deleteMany();
    await prisma.property.deleteMany();
    await prisma.kycSubmission.deleteMany();
    await prisma.investor.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /imoveis retorna os dados on-chain serializados", async () => {
    await createProperty();

    const res = await app.inject({ method: "GET", url: "/imoveis" });
    expect(res.statusCode).toBe(200);
    const [imovel] = res.json();
    expect(imovel.nome).toBe("Edificio Aurora");
    expect(imovel.valorTotal).toBe((1_000n * 1_000n).toString());
    expect(imovel.totalCotas).toBe(1000);
    expect(imovel.cotasRestantes).toBe(900);
    expect(imovel.precoPorCota).toBe("1000");
  });

  it("GET /imoveis/:id retorna 404 para imovel inexistente", async () => {
    const res = await app.inject({ method: "GET", url: "/imoveis/nao-existe" });
    expect(res.statusCode).toBe(404);
  });

  it("POST /imoveis/:id/comprar executa a compra e registra o investimento", async () => {
    const property = await createProperty();
    const investor = await createInvestor();

    const res = await app.inject({
      method: "POST",
      url: `/imoveis/${property.id}/comprar`,
      payload: { investorId: investor.id, quantidade: 2 },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().txHash).toBe("0xcomprahash");
    expect(comprarCotasOnChain).toHaveBeenCalledWith(
      expect.objectContaining({ quantidade: 2n, valorPago: 2_000n }),
    );

    const investment = await prisma.investment.findFirstOrThrow({ where: { investorId: investor.id } });
    expect(investment.cotas).toBe(2);
    expect(investment.valorPago).toBe("2000");
    expect(investment.txHash).toBe("0xcomprahash");
  });

  it("rejeita com SEM_KYC quando a claim on-chain nao esta aprovada, mesmo que a submissao no banco diga aprovado (RNF-16)", async () => {
    const property = await createProperty();
    const investor = await createInvestor();
    await prisma.kycSubmission.create({
      data: { investorId: investor.id, status: "APPROVED", provider: "mock", claimTxHash: "0xantigo" },
    });
    vi.mocked(isVerifiedOnChain).mockResolvedValue(false);

    const res = await app.inject({
      method: "POST",
      url: `/imoveis/${property.id}/comprar`,
      payload: { investorId: investor.id, quantidade: 1 },
    });

    expect(res.statusCode).toBe(403);
    expect(res.json().codigo).toBe("SEM_KYC");
    expect(comprarCotasOnChain).not.toHaveBeenCalled();
  });

  it("rejeita com COTAS_INSUFICIENTES quando a quantidade excede o disponivel", async () => {
    const property = await createProperty();
    const investor = await createInvestor();

    const res = await app.inject({
      method: "POST",
      url: `/imoveis/${property.id}/comprar`,
      payload: { investorId: investor.id, quantidade: 1_000 },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().codigo).toBe("COTAS_INSUFICIENTES");
    expect(comprarCotasOnChain).not.toHaveBeenCalled();
  });

  it("rejeita com VALOR_MINIMO_NAO_ATINGIDO quando o valor da compra fica abaixo do minimo", async () => {
    const property = await createProperty({ valorMinimoInvestimento: "5000" });
    const investor = await createInvestor();

    const res = await app.inject({
      method: "POST",
      url: `/imoveis/${property.id}/comprar`,
      payload: { investorId: investor.id, quantidade: 1 },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().codigo).toBe("VALOR_MINIMO_NAO_ATINGIDO");
    expect(comprarCotasOnChain).not.toHaveBeenCalled();
  });
});
