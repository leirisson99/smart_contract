import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { config } from "../config.js";

/**
 * Stub de custodia de carteira para a POC. Gera uma wallet real (chave
 * derivada com viem) e "criptografa" a chave privada com AES-256-GCM usando
 * WALLET_ENC_KEY. Isto NAO substitui a custodia real (HSM/KMS) prevista na
 * task 1 de docs/backend/features/001-onboarding-e-custodia/tasks.md -
 * mantido simples de proposito para a POC.
 */

function deriveKey(): Buffer {
  return scryptSync(config.walletEncKey, "wallet-custody-salt", 32);
}

/** Cifra generica AES-256-GCM usada tanto para a chave privada da wallet custodial quanto para CPF (LGPD, nunca on-chain). */
export function encryptSecret(plainText: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decryptSecret(payload: string): string {
  const raw = Buffer.from(payload, "base64");
  const iv = raw.subarray(0, 12);
  const authTag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", deriveKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function createCustodialWallet(): { address: `0x${string}`; walletKeyEnc: string } {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  return { address: account.address, walletKeyEnc: encryptSecret(privateKey) };
}
