import { createWalletClient, http, keccak256, stringToHex, toHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config.js";
import { chain, publicClient } from "../chain.js";
import { identityRegistryAbi } from "../abi/IdentityRegistry.js";

const KYC_APPROVED_TOPIC = keccak256(stringToHex("KYC_APPROVED"));

const account = privateKeyToAccount(config.trustedIssuerPrivateKey);
const walletClient = createWalletClient({ account, chain, transport: http(config.rpcUrl) });

/** Mesmo problema de `marketplaceChain.TransacaoRevertidaError`: `writeContract` nao simula antes de enviar. */
export class TransacaoRevertidaError extends Error {
  constructor(hash: `0x${string}`) {
    super(`transacao ${hash} revertida on-chain`);
  }
}

async function aguardarSucesso(hash: `0x${string}`) {
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status === "reverted") throw new TransacaoRevertidaError(hash);
  return receipt;
}

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
  await aguardarSucesso(hash);
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
