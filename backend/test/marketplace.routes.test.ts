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
  balanceOfOnChain: vi.fn(async () => 10n),
}));

const ENDERECO_ZERO = "0x0000000000000000000000000000000000000000";

vi.mock("../src/services/marketplaceChain.js", () => ({
  listagensAtivasPorTokenOnChain: vi.fn(async () => [] as bigint[]),
  lerListagemOnChain: vi.fn(async () => ({
    vendedor: ENDERECO_ZERO,
    propertyToken: "0xtoken",
    quantidadeDisponivel: 0n,
    precoPorCota: 0n,
    ativa: false,
  })),
  listarOnChain: vi.fn(async () => ({ idListagem: 1n, txHash: "0xlistarhash" })),
  comprarOnChain: vi.fn(async () => "0xcomprarhash"),
  cancelarOnChain: vi.fn(async () => "0xcancelarhash"),
  TransacaoRevertidaError: class TransacaoRevertidaError extends Error {},
}));

import { buildServer } from "../src/server.js";
import { isVerifiedOnChain } from "../src/services/trustedIssuerSigner.js";
import { balanceOfOnChain, lerImovelOnChain } from "../src/services/propertyChain.js";
import {
  cancelarOnChain,
  comprarOnChain,
  lerListagemOnChain,
  listagensAtivasPorTokenOnChain,
  listarOnChain,
  TransacaoRevertidaError,
} from "../src/services/marketplaceChain.js";

async function createInvestor(overrides: Partial<{ fullName: string }> = {}) {
  const wallet = createCustodialWallet();
  const investor = await prisma.investor.create({
    data: {
      fullName: overrides.fullName ?? "Investidor Teste",
      cpfEncrypted: encryptSecret("12345678900"),
      walletAddress: wallet.address,
      walletKeyEnc: wallet.walletKeyEnc,
    },
  });
  return investor;
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

describe("rotas de mercado secundario (feature 004)", () => {
  const app = buildServer();

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(isVerifiedOnChain).mockResolvedValue(true);
    vi.mocked(balanceOfOnChain).mockResolvedValue(10n);
    vi.mocked(lerImovelOnChain).mockResolvedValue({
      nome: "Edificio Aurora",
      precoPorCota: 1_000n,
      totalCotas: 1_000n,
      cotasDisponiveis: 900n,
      totalSupply: 100n,
      moedaPagamento: "0xmoeda" as `0x${string}`,
    });
    vi.mocked(listagensAtivasPorTokenOnChain).mockResolvedValue([]);
    vi.mocked(listarOnChain).mockResolvedValue({ idListagem: 1n, txHash: "0xlistarhash" as `0x${string}` });
    vi.mocked(comprarOnChain).mockResolvedValue("0xcomprarhash" as `0x${string}`);
    vi.mocked(cancelarOnChain).mockResolvedValue("0xcancelarhash" as `0x${string}`);

    await prisma.investment.deleteMany();
    await prisma.property.deleteMany();
    await prisma.kycSubmission.deleteMany();
    await prisma.investor.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /listagens agrega as listagens ativas de todos os imoveis, com dados on-chain serializados", async () => {
    const property = await createProperty();
    const vendedor = await createInvestor({ fullName: "Vendedor Um" });

    vi.mocked(listagensAtivasPorTokenOnChain).mockResolvedValue([1n]);
    vi.mocked(lerListagemOnChain).mockResolvedValue({
      vendedor: vendedor.walletAddress as `0x${string}`,
      propertyToken: property.propertyTokenAddress as `0x${string}`,
      quantidadeDisponivel: 5n,
      precoPorCota: 200n,
      ativa: true,
    });

    const res = await app.inject({ method: "GET", url: "/listagens" });
    expect(res.statusCode).toBe(200);
    const [listagem] = res.json();
    expect(listagem.imovelId).toBe(property.id);
    expect(listagem.imovelNome).toBe("Edificio Aurora");
    expect(listagem.vendedorNome).toBe("Vendedor Um");
    expect(listagem.cotas).toBe(5);
    expect(listagem.precoPorCota).toBe("200");
    expect(listagem.status).toBe("ativa");
    expect(listagem.criadaPeloUsuarioAtual).toBe(false);
  });

  it("GET /listagens?investorId marca criadaPeloUsuarioAtual quando o vendedor e o investidor atual", async () => {
    const property = await createProperty();
    const vendedor = await createInvestor();

    vi.mocked(listagensAtivasPorTokenOnChain).mockResolvedValue([1n]);
    vi.mocked(lerListagemOnChain).mockResolvedValue({
      vendedor: vendedor.walletAddress as `0x${string}`,
      propertyToken: property.propertyTokenAddress as `0x${string}`,
      quantidadeDisponivel: 5n,
      precoPorCota: 200n,
      ativa: true,
    });

    const res = await app.inject({ method: "GET", url: `/listagens?investorId=${vendedor.id}` });
    const [listagem] = res.json();
    expect(listagem.criadaPeloUsuarioAtual).toBe(true);
  });

  it("POST /listagens assina Marketplace.listar e retorna a listagem criada", async () => {
    const property = await createProperty();
    const investor = await createInvestor();

    const res = await app.inject({
      method: "POST",
      url: "/listagens",
      payload: { investorId: investor.id, imovelId: property.id, cotas: 3, precoPorCota: "500" },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.id).toBe("1");
    expect(body.criadaPeloUsuarioAtual).toBe(true);
    expect(listarOnChain).toHaveBeenCalledWith(
      expect.objectContaining({ quantidade: 3n, precoPorCota: 500n }),
    );
  });

  it("POST /listagens rejeita com SALDO_INSUFICIENTE quando o investidor nao tem cotas suficientes", async () => {
    const property = await createProperty();
    const investor = await createInvestor();
    vi.mocked(balanceOfOnChain).mockResolvedValue(1n);

    const res = await app.inject({
      method: "POST",
      url: "/listagens",
      payload: { investorId: investor.id, imovelId: property.id, cotas: 3, precoPorCota: "500" },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().codigo).toBe("SALDO_INSUFICIENTE");
    expect(listarOnChain).not.toHaveBeenCalled();
  });

  it("POST /listagens/:id/comprar assina Marketplace.comprar para uma listagem ativa", async () => {
    const property = await createProperty();
    const vendedor = await createInvestor({ fullName: "Vendedor" });
    const comprador = await createInvestor({ fullName: "Comprador" });

    vi.mocked(lerListagemOnChain).mockResolvedValue({
      vendedor: vendedor.walletAddress as `0x${string}`,
      propertyToken: property.propertyTokenAddress as `0x${string}`,
      quantidadeDisponivel: 5n,
      precoPorCota: 200n,
      ativa: true,
    });

    const res = await app.inject({
      method: "POST",
      url: "/listagens/1/comprar",
      payload: { investorId: comprador.id },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().txHash).toBe("0xcomprarhash");
    expect(comprarOnChain).toHaveBeenCalledWith(
      expect.objectContaining({ idListagem: 1n, quantidade: 5n, valorTotal: 1_000n }),
    );

    const investment = await prisma.investment.findFirstOrThrow({ where: { investorId: comprador.id } });
    expect(investment.cotas).toBe(5);
    expect(investment.valorPago).toBe("1000");
  });

  it("POST /listagens/:id/comprar rejeita com LISTAGEM_JA_VENDIDA quando a compra reverte por concorrencia (SEC-04)", async () => {
    const property = await createProperty();
    const vendedor = await createInvestor();
    const comprador = await createInvestor();

    vi.mocked(lerListagemOnChain).mockResolvedValue({
      vendedor: vendedor.walletAddress as `0x${string}`,
      propertyToken: property.propertyTokenAddress as `0x${string}`,
      quantidadeDisponivel: 5n,
      precoPorCota: 200n,
      ativa: true,
    });
    vi.mocked(comprarOnChain).mockRejectedValue(new TransacaoRevertidaError("0xhash"));

    const res = await app.inject({
      method: "POST",
      url: "/listagens/1/comprar",
      payload: { investorId: comprador.id },
    });

    expect(res.statusCode).toBe(409);
    expect(res.json().codigo).toBe("LISTAGEM_JA_VENDIDA");
    const investment = await prisma.investment.findFirst({ where: { investorId: comprador.id } });
    expect(investment).toBeNull();
  });

  it("POST /listagens/:id/comprar rejeita com SEM_KYC quando o comprador nao tem claim aprovada", async () => {
    const property = await createProperty();
    const vendedor = await createInvestor();
    const comprador = await createInvestor();
    vi.mocked(isVerifiedOnChain).mockResolvedValue(false);
    vi.mocked(lerListagemOnChain).mockResolvedValue({
      vendedor: vendedor.walletAddress as `0x${string}`,
      propertyToken: property.propertyTokenAddress as `0x${string}`,
      quantidadeDisponivel: 5n,
      precoPorCota: 200n,
      ativa: true,
    });

    const res = await app.inject({
      method: "POST",
      url: "/listagens/1/comprar",
      payload: { investorId: comprador.id },
    });

    expect(res.statusCode).toBe(403);
    expect(res.json().codigo).toBe("SEM_KYC");
    expect(comprarOnChain).not.toHaveBeenCalled();
  });

  it("POST /listagens/:id/comprar rejeita com LISTAGEM_JA_VENDIDA quando a listagem nao esta mais ativa", async () => {
    const comprador = await createInvestor();
    vi.mocked(lerListagemOnChain).mockResolvedValue({
      vendedor: `0x${"9".repeat(40)}` as `0x${string}`,
      propertyToken: "0xtoken" as `0x${string}`,
      quantidadeDisponivel: 0n,
      precoPorCota: 0n,
      ativa: false,
    });

    const res = await app.inject({
      method: "POST",
      url: "/listagens/1/comprar",
      payload: { investorId: comprador.id },
    });

    expect(res.statusCode).toBe(409);
    expect(res.json().codigo).toBe("LISTAGEM_JA_VENDIDA");
  });

  it("POST /listagens/:id/comprar rejeita com LISTAGEM_NAO_ENCONTRADA quando o id nunca existiu", async () => {
    const comprador = await createInvestor();
    vi.mocked(lerListagemOnChain).mockResolvedValue({
      vendedor: ENDERECO_ZERO as `0x${string}`,
      propertyToken: "0xtoken" as `0x${string}`,
      quantidadeDisponivel: 0n,
      precoPorCota: 0n,
      ativa: false,
    });

    const res = await app.inject({
      method: "POST",
      url: "/listagens/999/comprar",
      payload: { investorId: comprador.id },
    });

    expect(res.statusCode).toBe(404);
    expect(res.json().codigo).toBe("LISTAGEM_NAO_ENCONTRADA");
  });

  it("POST /listagens/:id/cancelar assina Marketplace.cancelar quando o investidor e o vendedor", async () => {
    const vendedor = await createInvestor();
    vi.mocked(lerListagemOnChain).mockResolvedValue({
      vendedor: vendedor.walletAddress as `0x${string}`,
      propertyToken: "0xtoken" as `0x${string}`,
      quantidadeDisponivel: 5n,
      precoPorCota: 200n,
      ativa: true,
    });

    const res = await app.inject({
      method: "POST",
      url: "/listagens/1/cancelar",
      payload: { investorId: vendedor.id },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().txHash).toBe("0xcancelarhash");
    expect(cancelarOnChain).toHaveBeenCalledWith(expect.objectContaining({ idListagem: 1n }));
  });

  it("POST /listagens/:id/cancelar rejeita quando o investidor nao e o dono da listagem", async () => {
    const vendedor = await createInvestor();
    const outro = await createInvestor();
    vi.mocked(lerListagemOnChain).mockResolvedValue({
      vendedor: vendedor.walletAddress as `0x${string}`,
      propertyToken: "0xtoken" as `0x${string}`,
      quantidadeDisponivel: 5n,
      precoPorCota: 200n,
      ativa: true,
    });

    const res = await app.inject({
      method: "POST",
      url: "/listagens/1/cancelar",
      payload: { investorId: outro.id },
    });

    expect(res.statusCode).toBe(403);
    expect(cancelarOnChain).not.toHaveBeenCalled();
  });
});
