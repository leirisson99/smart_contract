import { createPublicClient, http } from "viem";
import { config } from "./config.js";

/**
 * Definicao de chain/cliente publico compartilhada por todos os servicos que
 * leem/escrevem on-chain (trustedIssuerSigner, propertyChain). Extraido para
 * nao duplicar esta definicao a cada novo servico que precisa falar com a
 * mesma chain configurada via RPC_URL/CHAIN_ID.
 */
export const chain = {
  id: config.chainId,
  name: "backend-configured-chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [config.rpcUrl] } },
} as const;

export const publicClient = createPublicClient({ chain, transport: http(config.rpcUrl) });
