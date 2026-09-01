import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { config } from "../src/config.js";
import { identityRegistryAbi } from "../src/abi/IdentityRegistry.js";

/**
 * Registra o endereco do Trusted Issuer do backend (TRUSTED_ISSUER_PRIVATE_KEY)
 * no IdentityRegistry local (Anvil). So funciona contra uma chain onde o
 * signer que assina esta transacao (DEPLOYER_PRIVATE_KEY) tem
 * PLATFORM_ADMIN_ROLE - por padrao, a conta #0 do Anvil, que e quem faz o
 * deploy em DeployIdentityKyc.s.sol.
 */
const DEPLOYER_PRIVATE_KEY = (process.env.DEPLOYER_PRIVATE_KEY ??
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80") as `0x${string}`;

async function main() {
  const deployer = privateKeyToAccount(DEPLOYER_PRIVATE_KEY);
  const trustedIssuer = privateKeyToAccount(config.trustedIssuerPrivateKey);

  const chain = {
    id: config.chainId,
    name: "backend-configured-chain",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [config.rpcUrl] } },
  } as const;

  const publicClient = createPublicClient({ chain, transport: http(config.rpcUrl) });
  const walletClient = createWalletClient({ account: deployer, chain, transport: http(config.rpcUrl) });

  const hash = await walletClient.writeContract({
    address: config.identityRegistryAddress,
    abi: identityRegistryAbi,
    functionName: "adicionarTrustedIssuer",
    args: [trustedIssuer.address],
  });
  await publicClient.waitForTransactionReceipt({ hash });

  console.log(`Trusted issuer ${trustedIssuer.address} registrado em ${config.identityRegistryAddress} (tx ${hash})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
