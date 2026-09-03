import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createPublicClient, createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { prisma } from "../src/db/client.js";
import { buildServer } from "../src/server.js";
import { config } from "../src/config.js";
import { propertyTokenAbi } from "../src/abi/PropertyToken.js";
import { mockErc20Abi } from "../src/abi/MockERC20.js";
import { runYieldClaimJob } from "../src/services/yieldClaimJob.js";

/**
 * Teste end-to-end real das features 002 (investimento primario) e 003
 * (portfolio e rendimentos): exige Anvil rodando em RPC_URL com o pipeline de
 * imovel ja deployado (`forge script script/DeployPropertyPipeline.s.sol
 * --broadcast`, projeto_imobiliaria/) e o backend ja registrado como Trusted
 * Issuer (`npm run grant-trusted-issuer`). Roda so com RUN_E2E=1, igual
 * `kyc-flow.e2e.test.ts`.
 *
 * Enderecos do imovel de teste vem de env (ver .env.example) - copiados do
 * output do script de deploy, mesma convencao ja usada para
 * IDENTITY_REGISTRY_ADDRESS.
 */
const shouldRun = process.env.RUN_E2E === "1";

const DEPLOYER_PRIVATE_KEY = (process.env.DEPLOYER_PRIVATE_KEY ??
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80") as `0x${string}`;
const PROPERTY_TOKEN_ADDRESS = process.env.TEST_PROPERTY_TOKEN_ADDRESS as `0x${string}` | undefined;
const DIVIDEND_DISTRIBUTOR_ADDRESS = process.env.TEST_DIVIDEND_DISTRIBUTOR_ADDRESS as `0x${string}` | undefined;
const MOEDA_PAGAMENTO_ADDRESS = process.env.TEST_MOEDA_PAGAMENTO_ADDRESS as `0x${string}` | undefined;

describe.skipIf(!shouldRun)("fluxo de investimento primario + rendimentos end-to-end contra Anvil local", () => {
  const app = buildServer();
  const chain = {
    id: config.chainId,
    name: "backend-configured-chain",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [config.rpcUrl] } },
  } as const;
  const publicClient = createPublicClient({ chain, transport: http(config.rpcUrl) });
  const deployerWallet = createWalletClient({
    account: privateKeyToAccount(DEPLOYER_PRIVATE_KEY),
    chain,
    transport: http(config.rpcUrl),
  });

  beforeAll(() => {
    if (!PROPERTY_TOKEN_ADDRESS || !DIVIDEND_DISTRIBUTOR_ADDRESS || !MOEDA_PAGAMENTO_ADDRESS) {
      throw new Error(
        "RUN_E2E=1 exige TEST_PROPERTY_TOKEN_ADDRESS, TEST_DIVIDEND_DISTRIBUTOR_ADDRESS e TEST_MOEDA_PAGAMENTO_ADDRESS em env " +
          "(saida de `forge script script/DeployPropertyPipeline.s.sol --broadcast`).",
      );
    }
  });

  beforeEach(async () => {
    await prisma.yieldClaim.deleteMany();
    await prisma.investment.deleteMany();
    await prisma.property.deleteMany();
    await prisma.kycSubmission.deleteMany();
    await prisma.investor.deleteMany();
  });

  it("cadastro -> KYC aprovado -> compra de cotas -> portfolio -> deposito de rendimento -> claim automatico", async () => {
    const signup = await app.inject({
      method: "POST",
      url: "/investors",
      payload: { fullName: "Investidor E2E Imovel", cpf: "45678912300" },
    });
    const { investorId, walletAddress } = signup.json();

    await app.inject({ method: "POST", url: `/investors/${investorId}/kyc`, payload: { forceResult: "APPROVED" } });
    await vi.waitFor(
      async () => {
        const status = await app.inject({ method: "GET", url: `/investors/${investorId}/kyc` });
        expect(status.json().status).toBe("APPROVED");
      },
      { timeout: 10000 },
    );

    // Financia a carteira custodial do investidor com a moeda de teste
    // (MockERC20.mint e publica/sem controle de acesso - so por ser um mock
    // de teste, ver test/mocks/MockERC20.sol).
    const mintHash = await deployerWallet.writeContract({
      address: MOEDA_PAGAMENTO_ADDRESS!,
      abi: mockErc20Abi,
      functionName: "mint",
      args: [walletAddress, parseEther("2000")],
    });
    await publicClient.waitForTransactionReceipt({ hash: mintHash });

    const property = await prisma.property.create({
      data: {
        propertyTokenAddress: PROPERTY_TOKEN_ADDRESS!,
        dividendDistributorAddress: DIVIDEND_DISTRIBUTOR_ADDRESS!,
        rendimentoEstimadoAnual: 8.5,
        valorMinimoInvestimento: parseEther("500").toString(),
      },
    });

    const compra = await app.inject({
      method: "POST",
      url: `/imoveis/${property.id}/comprar`,
      payload: { investorId, quantidade: 1 },
    });
    expect(compra.statusCode).toBe(200);

    const saldoOnChain = await publicClient.readContract({
      address: PROPERTY_TOKEN_ADDRESS!,
      abi: propertyTokenAbi,
      functionName: "balanceOf",
      args: [walletAddress],
    });
    expect(saldoOnChain).toBe(1n);

    const portfolioAntes = await app.inject({ method: "GET", url: `/investors/${investorId}/portfolio` });
    expect(portfolioAntes.json().holdings[0]).toMatchObject({ cotas: 1 });
    expect(portfolioAntes.json().rendimentoPendenteClaim).toBe("0");

    // Gestor deposita rendimento (RF-25, feature 005) via o endpoint
    // administrativo real - a carteira do gestor (GESTOR_PRIVATE_KEY,
    // mesma DEPLOYER_PRIVATE_KEY usada para deployar o pipeline acima) e
    // financiada automaticamente com a moeda de teste pela propria rota
    // (ver `adminChain.depositarRendimentoOnChain`).
    const valorRendimento = parseEther("100");
    const deposito = await app.inject({
      method: "POST",
      url: `/admin/imoveis/${property.id}/depositar-rendimento`,
      headers: { "x-admin-api-key": config.adminApiKey },
      payload: { valor: valorRendimento.toString() },
    });
    expect(deposito.statusCode).toBe(200);

    const jobResult = await runYieldClaimJob();
    expect(jobResult.claimsExecutados).toBeGreaterThanOrEqual(1);

    const portfolioDepois = await app.inject({ method: "GET", url: `/investors/${investorId}/portfolio` });
    const body = portfolioDepois.json();
    expect(body.rendimentosRecebidos).toHaveLength(1);
    expect(body.rendimentoPendenteClaim).toBe("0");
  }, 30000);
});
