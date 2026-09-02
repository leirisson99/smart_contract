const DECIMALS = 1e18;

/** Todo valor monetário on-chain é wei de 18 casas (a moeda de pagamento é um ERC-20 padrão). */
export function weiParaReais(wei: string): number {
  return Number(BigInt(wei)) / DECIMALS;
}
