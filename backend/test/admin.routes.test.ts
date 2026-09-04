import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../src/db/client.js";
import { config } from "../src/config.js";
import { createCustodialWallet, encryptSecret } from "../src/services/walletCustody.js";
import { gerarSegredoOtp } from "../src/services/hotp.js";

vi.mock("../src/services/adminChain.js", () => ({
  criarImovelOnChain: vi.fn(async () => ({
    propertyTokenAddress: `0x${"7".repeat(40)}`,
    dividendDistributorAddress: `0x${"8".repeat(40)}`,
    txHashCriacao: "0xcriacaohash",
    txHashDistributor: "0xdistributorhash",
  })),
  depositarRendimentoOnChain: vi.fn(async () => ({ idCiclo: 1n, txHash: "0xdepositohash" })),
  TransacaoRevertidaError: class TransacaoRevertidaError extends Error {},
}));

vi.mock("../src/services/propertyChain.js", () => ({
  lerImovelOnChain: vi.fn(async () => ({
    nome: "Edificio Aurora",
    precoPorCota: 10_000n,
    totalCotas: 100n,
    cotasDisponiveis: 100n,
    totalSupply: 0n,
    moedaPagamento: "0xmoeda",
  })),
  balanceOfOnChain: vi.fn(async () => 0n),
}));

import { buildServer } from "../src/server.js";
import { criarImovelOnChain, depositarRendimentoOnChain, TransacaoRevertidaError } from "../src/services/adminChain.js";

const ADMIN_HEADERS = { "x-admin-api-key": config.adminApiKey };

async function createInvestor(overrides: Partial<{ fullName: string }> = {}) {
  const wallet = createCustodialWallet();
  return prisma.investor.create({
    data: {
      fullName: overrides.fullName ?? "Investidor Teste",
      email: `${wallet.address.toLowerCase()}@teste.local`,
      cpfEncrypted: encryptSecret("12345678900"),
      walletAddress: wallet.address,
      walletKeyEnc: wallet.walletKeyEnc,
      otpSecretEnc: encryptSecret(gerarSegredoOtp()),
    },
  });
}

async function createProperty() {
  return prisma.property.create({
    data: {
      propertyTokenAddress: `0x${"7".repeat(40)}`,
      dividendDistributorAddress: `0x${"8".repeat(40)}`,
      rendimentoEstimadoAnual: 8.5,
      valorMinimoInvestimento: "1000",
    },
  });
}

describe("rotas administrativas (feature 005)", () => {
  const app = buildServer();

  beforeEach(async () => {
    vi.clearAllMocks();
    await prisma.investment.deleteMany();
    await prisma.propertyCreationAttempt.deleteMany();
    await prisma.property.deleteMany();
    await prisma.kycSubmission.deleteMany();
    await prisma.investor.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it("rejeita qualquer rota /admin sem o header x-admin-api-key", async () => {
    const res = await app.inject({ method: "GET", url: "/admin/investidores" });
    expect(res.statusCode).toBe(403);
    expect(res.json().codigo).toBe("ROLE_INVALIDA");
  });

  it("rejeita com uma chave x-admin-api-key incorreta", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/admin/investidores",
      headers: { "x-admin-api-key": "chave-errada" },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().codigo).toBe("ROLE_INVALIDA");
  });

  it("GET /admin/investidores lista investidores com status de KYC", async () => {
    const investor = await createInvestor({ fullName: "Investidor KYC" });
    await prisma.kycSubmission.create({
      data: { investorId: investor.id, status: "APPROVED", provider: "mock" },
    });
    const semKyc = await createInvestor({ fullName: "Sem KYC" });

    const res = await app.inject({ method: "GET", url: "/admin/investidores", headers: ADMIN_HEADERS });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { id: string; nome: string; statusKyc: string }[];
    expect(body).toHaveLength(2);
    expect(body.find((i) => i.id === investor.id)).toMatchObject({ nome: "Investidor KYC", statusKyc: "APPROVED" });
    expect(body.find((i) => i.id === semKyc.id)).toMatchObject({ nome: "Sem KYC", statusKyc: "PENDING" });
  });

  it("POST /admin/imoveis cria o imovel on-chain e persiste os metadados", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/admin/imoveis",
      headers: ADMIN_HEADERS,
      payload: { nome: "Edificio Aurora", imagemUrl: "https://img", valorTotal: "1000000", totalCotas: 100, rendimentoEstimadoAnual: 0.08 },
    });

    expect(res.statusCode).toBe(201);
    expect(criarImovelOnChain).toHaveBeenCalledWith(
      { nome: "Edificio Aurora", valorTotal: 1_000_000n, numeroCotas: 100n },
      expect.any(Function),
    );
    const property = await prisma.property.findFirstOrThrow();
    expect(property.valorMinimoInvestimento).toBe("10000");
  });

  it("POST /admin/imoveis registra a tentativa como FAILED com os enderecos ja obtidos quando uma transacao intermediaria falha", async () => {
    vi.mocked(criarImovelOnChain).mockImplementationOnce(async (_params, onProgress) => {
      await onProgress?.({ propertyTokenAddress: `0x${"7".repeat(40)}`, txHashCriacao: "0xcriacaohash" });
      throw new Error("deploy do DividendDistributor revertido");
    });

    const res = await app.inject({
      method: "POST",
      url: "/admin/imoveis",
      headers: ADMIN_HEADERS,
      payload: { nome: "Edificio Orfao", valorTotal: "1000000", totalCotas: 100, rendimentoEstimadoAnual: 0.08 },
    });

    expect(res.statusCode).toBe(502);
    expect(await prisma.property.count()).toBe(0);
    const tentativa = await prisma.propertyCreationAttempt.findFirstOrThrow();
    expect(tentativa).toMatchObject({
      status: "FAILED",
      propertyTokenAddress: `0x${"7".repeat(40)}`,
      dividendDistributorAddress: null,
      erro: "deploy do DividendDistributor revertido",
    });
  });

  it("POST /admin/imoveis rejeita valorTotal nao divisivel por totalCotas", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/admin/imoveis",
      headers: ADMIN_HEADERS,
      payload: { nome: "Edificio Aurora", valorTotal: "1000001", totalCotas: 100, rendimentoEstimadoAnual: 0.08 },
    });

    expect(res.statusCode).toBe(400);
    expect(criarImovelOnChain).not.toHaveBeenCalled();
  });

  it("POST /admin/imoveis/:id/depositar-rendimento aciona o deposito e retorna a confirmacao", async () => {
    const property = await createProperty();

    const res = await app.inject({
      method: "POST",
      url: `/admin/imoveis/${property.id}/depositar-rendimento`,
      headers: ADMIN_HEADERS,
      payload: { valor: "100000000000000000000" },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ idCiclo: 1, txHash: "0xdepositohash" });
    expect(depositarRendimentoOnChain).toHaveBeenCalledWith({
      dividendDistributorAddress: property.dividendDistributorAddress,
      valor: 100_000_000_000_000_000_000n,
    });
  });

  it("POST /admin/imoveis/:id/depositar-rendimento retorna 404 para imovel inexistente", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/admin/imoveis/id-inexistente/depositar-rendimento",
      headers: ADMIN_HEADERS,
      payload: { valor: "100" },
    });

    expect(res.statusCode).toBe(404);
    expect(depositarRendimentoOnChain).not.toHaveBeenCalled();
  });

  it("POST /admin/imoveis/:id/depositar-rendimento retorna DEPOSITO_EM_ANDAMENTO se ja houver um deposito em andamento para o imovel", async () => {
    const property = await createProperty();
    await prisma.property.update({ where: { id: property.id }, data: { rendimentoDepositoTravadoEm: new Date() } });

    const res = await app.inject({
      method: "POST",
      url: `/admin/imoveis/${property.id}/depositar-rendimento`,
      headers: ADMIN_HEADERS,
      payload: { valor: "100" },
    });

    expect(res.statusCode).toBe(409);
    expect(res.json().codigo).toBe("DEPOSITO_EM_ANDAMENTO");
    expect(depositarRendimentoOnChain).not.toHaveBeenCalled();
  });

  it("POST /admin/imoveis/:id/depositar-rendimento libera a trava apos concluir, permitindo um novo deposito em seguida", async () => {
    const property = await createProperty();

    const primeiro = await app.inject({
      method: "POST",
      url: `/admin/imoveis/${property.id}/depositar-rendimento`,
      headers: ADMIN_HEADERS,
      payload: { valor: "100" },
    });
    expect(primeiro.statusCode).toBe(200);

    const segundo = await app.inject({
      method: "POST",
      url: `/admin/imoveis/${property.id}/depositar-rendimento`,
      headers: ADMIN_HEADERS,
      payload: { valor: "100" },
    });
    expect(segundo.statusCode).toBe(200);
    expect(depositarRendimentoOnChain).toHaveBeenCalledTimes(2);
  });

  it("POST /admin/imoveis/:id/depositar-rendimento retorna ERRO_DESCONHECIDO quando a transacao reverte", async () => {
    const property = await createProperty();
    vi.mocked(depositarRendimentoOnChain).mockRejectedValueOnce(new TransacaoRevertidaError("0xhash"));

    const res = await app.inject({
      method: "POST",
      url: `/admin/imoveis/${property.id}/depositar-rendimento`,
      headers: ADMIN_HEADERS,
      payload: { valor: "100" },
    });

    expect(res.statusCode).toBe(502);
    expect(res.json().codigo).toBe("ERRO_DESCONHECIDO");
  });
});
