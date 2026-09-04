import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createPublicClient, http } from "viem";
import { prisma } from "../src/db/client.js";
import { buildServer } from "../src/server.js";
import { config } from "../src/config.js";
import { propertyTokenAbi } from "../src/abi/PropertyToken.js";
import { lerImovelOnChain } from "../src/services/propertyChain.js";

/**
 * Teste end-to-end real da feature 004 (mercado secundario): exige Anvil
 * rodando em RPC_URL com o pipeline de imovel ja deployado (mesmo
 * pre-requisito de `property-flow.e2e.test.ts`) e o `Marketplace`
 * (`MARKETPLACE_ADDRESS`, ja exigido por `config.ts` fora do modo e2e) com
 * claim KYC_APPROVED emitida (`npm run grant-marketplace-kyc`), sem o que o
 * `ComplianceModule` recusa o contrato manter cotas em escrow. Roda so com
 * RUN_E2E=1, igual `kyc-flow.e2e.test.ts`/`property-flow.e2e.test.ts`.
 *
 * Financiamento de gas/moeda de teste (ETH e MockERC20) e automatico via
 * `garantirGasParaCarteira`/`garantirSaldoMoedaTeste`, acionados pelas
 * proprias rotas - nao precisa mintar nada manualmente aqui (diferente de
 * `property-flow.e2e.test.ts`, escrito antes desse auto-funding cobrir
 * tambem a compra primaria).
 */
const shouldRun = process.env.RUN_E2E === "1";

const PROPERTY_TOKEN_ADDRESS = process.env.TEST_PROPERTY_TOKEN_ADDRESS as `0x${string}` | undefined;
const DIVIDEND_DISTRIBUTOR_ADDRESS = process.env.TEST_DIVIDEND_DISTRIBUTOR_ADDRESS as `0x${string}` | undefined;

describe.skipIf(!shouldRun)("fluxo de mercado secundario end-to-end contra Anvil local", () => {
  const app = buildServer();
  const chain = {
    id: config.chainId,
    name: "backend-configured-chain",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [config.rpcUrl] } },
  } as const;
  const publicClient = createPublicClient({ chain, transport: http(config.rpcUrl) });

  beforeAll(() => {
    if (!PROPERTY_TOKEN_ADDRESS || !DIVIDEND_DISTRIBUTOR_ADDRESS) {
      throw new Error(
        "RUN_E2E=1 exige TEST_PROPERTY_TOKEN_ADDRESS e TEST_DIVIDEND_DISTRIBUTOR_ADDRESS em env " +
          "(saida de `forge script script/DeployPropertyPipeline.s.sol --broadcast`), com MARKETPLACE_ADDRESS " +
          "ja apontando para um Marketplace deployado e com `npm run grant-marketplace-kyc` rodado.",
      );
    }
  });

  beforeEach(async () => {
    await prisma.investment.deleteMany();
    await prisma.property.deleteMany();
    await prisma.kycSubmission.deleteMany();
    await prisma.investor.deleteMany();
  });

  async function criarInvestidorAprovado(fullName: string, cpf: string) {
    const signup = await app.inject({ method: "POST", url: "/investors", payload: { fullName, cpf } });
    const { investorId, walletAddress } = signup.json() as { investorId: string; walletAddress: `0x${string}` };

    await app.inject({ method: "POST", url: `/investors/${investorId}/kyc`, payload: { forceResult: "APPROVED" } });
    await vi.waitFor(
      async () => {
        const status = await app.inject({ method: "GET", url: `/investors/${investorId}/kyc` });
        expect(status.json().status).toBe("APPROVED");
      },
      { timeout: 10000 },
    );

    return { investorId, walletAddress };
  }

  /** Cria o imovel de teste e um vendedor com `cotasIniciais` compradas na primaria, para ter o que listar depois. */
  async function criarPropertyComVendedor(cotasIniciais: number) {
    const property = await prisma.property.create({
      data: {
        propertyTokenAddress: PROPERTY_TOKEN_ADDRESS!,
        dividendDistributorAddress: DIVIDEND_DISTRIBUTOR_ADDRESS!,
        rendimentoEstimadoAnual: 8.5,
        // Minimo baixo de proposito: o preco por cota real vem do deploy e
        // varia por ambiente, aqui so importa nao bloquear a compra primaria.
        valorMinimoInvestimento: "1",
      },
    });
    const vendedor = await criarInvestidorAprovado("Vendedor E2E Marketplace", "11122233344");

    const compraPrimaria = await app.inject({
      method: "POST",
      url: `/imoveis/${property.id}/comprar`,
      payload: { investorId: vendedor.investorId, quantidade: cotasIniciais },
    });
    expect(compraPrimaria.statusCode).toBe(200);

    return { property, vendedor };
  }

  async function saldoOnChain(wallet: `0x${string}`) {
    return publicClient.readContract({
      address: PROPERTY_TOKEN_ADDRESS!,
      abi: propertyTokenAbi,
      functionName: "balanceOf",
      args: [wallet],
    }) as Promise<bigint>;
  }

  it("listar -> comprar atualiza o saldo on-chain e o portfolio de vendedor e comprador", async () => {
    // 1 cota so: o PropertyToken de teste e compartilhado entre varias
    // rodadas de e2e/dev local e `cotasDisponiveis` e finito (nao reseta
    // sozinho - so um novo `forge script ... --broadcast` faz isso).
    const { property, vendedor } = await criarPropertyComVendedor(1);
    const imovel = await lerImovelOnChain(PROPERTY_TOKEN_ADDRESS!);

    const listagem = await app.inject({
      method: "POST",
      url: "/listagens",
      payload: {
        investorId: vendedor.investorId,
        imovelId: property.id,
        cotas: 1,
        precoPorCota: imovel.precoPorCota.toString(),
      },
    });
    expect(listagem.statusCode).toBe(201);
    const idListagem = listagem.json().id as string;

    const comprador = await criarInvestidorAprovado("Comprador E2E Marketplace", "55566677788");

    const compra = await app.inject({
      method: "POST",
      url: `/listagens/${idListagem}/comprar`,
      payload: { investorId: comprador.investorId },
    });
    expect(compra.statusCode).toBe(200);
    expect(compra.json().txHash).toBeTruthy();

    // Vendedor listou sua unica cota e ela foi vendida: saldo livre volta a zero.
    expect(await saldoOnChain(vendedor.walletAddress)).toBe(0n);
    expect(await saldoOnChain(comprador.walletAddress)).toBe(1n);

    const [portfolioVendedor, portfolioComprador] = await Promise.all([
      app.inject({ method: "GET", url: `/investors/${vendedor.investorId}/portfolio` }),
      app.inject({ method: "GET", url: `/investors/${comprador.investorId}/portfolio` }),
    ]);
    // O holding do vendedor continua aparecendo (ledger `Investment` da
    // compra primaria nunca e apagado), so que com `cotas` refletindo o
    // saldo on-chain atual (0), ja que `holdings[].cotas` e sempre lido ao
    // vivo do contrato (nunca cacheado - ver `routes/portfolio.ts`).
    expect(portfolioVendedor.json().holdings[0]).toMatchObject({ cotas: 0 });
    expect(portfolioComprador.json().holdings[0]).toMatchObject({ cotas: 1 });
  }, 30000);

  it("listar -> cancelar devolve as cotas ao vendedor e a listagem deixa de aparecer como ativa", async () => {
    const { property, vendedor } = await criarPropertyComVendedor(1);
    const imovel = await lerImovelOnChain(PROPERTY_TOKEN_ADDRESS!);

    const listagem = await app.inject({
      method: "POST",
      url: "/listagens",
      payload: {
        investorId: vendedor.investorId,
        imovelId: property.id,
        cotas: 1,
        precoPorCota: imovel.precoPorCota.toString(),
      },
    });
    expect(listagem.statusCode).toBe(201);
    const idListagem = listagem.json().id as string;

    // Cota ja sai do saldo "livre" do vendedor assim que listada (fica em
    // escrow no Marketplace via `approve`+`transferFrom` de `listarOnChain`).
    expect(await saldoOnChain(vendedor.walletAddress)).toBe(0n);

    const cancelamento = await app.inject({
      method: "POST",
      url: `/listagens/${idListagem}/cancelar`,
      payload: { investorId: vendedor.investorId },
    });
    expect(cancelamento.statusCode).toBe(200);
    expect(cancelamento.json().txHash).toBeTruthy();

    expect(await saldoOnChain(vendedor.walletAddress)).toBe(1n);

    const listagensAtivas = (await app.inject({ method: "GET", url: "/listagens" })).json() as { id: string }[];
    expect(listagensAtivas.some((l) => l.id === idListagem)).toBe(false);
  }, 30000);
});
