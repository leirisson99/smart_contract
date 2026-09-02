import { createPublicClient, createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { config } from "../src/config.js";
import { prisma } from "../src/db/client.js";
import { dividendDistributorAbi } from "../src/abi/DividendDistributor.js";
import { erc20Abi } from "../src/abi/ERC20.js";

/**
 * Passo do "gestor" ainda manual: deposita rendimento no DividendDistributor
 * de um imovel (RF-25). Nao existe endpoint administrativo para isso ainda
 * (feature 005-painel-administrativo, Sprint 8, not-started) - este script
 * mimetiza o mesmo trecho ja usado em test/property-flow.e2e.test.ts, so que
 * contra a Anvil local de verdade em vez de dentro do teste.
 *
 * Depois de rodar isto, o investidor ja pode clicar em "Resgatar rendimento"
 * no portfolio (chama POST /investors/:id/portfolio/claim).
 *
 * Uso: PROPERTY_ID=<uuid da tabela Property> VALOR=100 npm run deposit-yield
 */
const DEPLOYER_PRIVATE_KEY = (process.env.DEPLOYER_PRIVATE_KEY ??
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80") as `0x${string}`;

async function main() {
  const propertyId = process.env.PROPERTY_ID;
  if (!propertyId) {
    const properties = await prisma.property.findMany({ select: { id: true, propertyTokenAddress: true } });
    throw new Error(
      `PROPERTY_ID e obrigatorio em env. Imoveis disponiveis: ${JSON.stringify(properties)}`,
    );
  }
  const valor = parseEther(process.env.VALOR ?? "100");

  const property = await prisma.property.findUniqueOrThrow({ where: { id: propertyId } });
  const distributorAddress = property.dividendDistributorAddress as `0x${string}`;

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

  const moedaPagamento = (await publicClient.readContract({
    address: distributorAddress,
    abi: dividendDistributorAbi,
    functionName: "moedaPagamento",
  })) as `0x${string}`;

  const approveHash = await deployerWallet.writeContract({
    address: moedaPagamento,
    abi: erc20Abi,
    functionName: "approve",
    args: [distributorAddress, valor],
  });
  await publicClient.waitForTransactionReceipt({ hash: approveHash });

  const depositoHash = await deployerWallet.writeContract({
    address: distributorAddress,
    abi: dividendDistributorAbi,
    functionName: "depositarRendimento",
    args: [valor],
  });
  await publicClient.waitForTransactionReceipt({ hash: depositoHash });

  console.log(`Rendimento de ${process.env.VALOR ?? "100"} depositado em ${distributorAddress} (tx ${depositoHash})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
