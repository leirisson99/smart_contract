import { createPublicClient, createWalletClient, http, keccak256, stringToHex, toHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config.js";
import { identityRegistryAbi } from "../abi/IdentityRegistry.js";

const KYC_APPROVED_TOPIC = keccak256(stringToHex("KYC_APPROVED"));

const account = privateKeyToAccount(config.trustedIssuerPrivateKey);

const chain = {
  id: config.chainId,
  name: "backend-configured-chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [config.rpcUrl] } },
} as const;

const publicClient = createPublicClient({ chain, transport: http(config.rpcUrl) });
const walletClient = createWalletClient({ account, chain, transport: http(config.rpcUrl) });

/**
 * Emite a claim KYC_APPROVED on-chain para a carteira do investidor.
 * `emitirClaim` no contrato nao faz verificacao criptografica real sobre o
 * campo `assinatura` (ver docs/on-chain/features/001-identidade-kyc) - ele so
 * precisa ser unico por chamada para nao colidir com o replay guard
 * (`AssinaturaJaUtilizada`). Por isso usamos um uuid como payload.
 */
export async function emitirClaimOnChain(walletAddress: `0x${string}`): Promise<`0x${string}`> {
  const assinatura = toHex(uuidv4());
  const hash = await walletClient.writeContract({
    address: config.identityRegistryAddress,
    abi: identityRegistryAbi,
    functionName: "emitirClaim",
    args: [walletAddress, KYC_APPROVED_TOPIC, assinatura],
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function isVerifiedOnChain(walletAddress: `0x${string}`): Promise<boolean> {
  return publicClient.readContract({
    address: config.identityRegistryAddress,
    abi: identityRegistryAbi,
    functionName: "isVerified",
    args: [walletAddress],
  }) as Promise<boolean>;
}
