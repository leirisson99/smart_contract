const DECIMALS = 1e18;
const WEI_POR_CENTAVO = BigInt("10000000000000000"); // 1e18 / 100

/** Todo valor monetário on-chain é wei de 18 casas (a moeda de pagamento é um ERC-20 padrão). */
export function weiParaReais(wei: string): number {
  return Number(BigInt(wei)) / DECIMALS;
}

/**
 * Inverso de `weiParaReais` — usado ao enviar um valor monetário digitado
 * pelo investidor para o backend. Arredonda para centavos antes de converter
 * para BigInt: multiplicar um float por 1e18 direto expõe erro de ponto
 * flutuante nas casas decimais além da precisão de um double (~15-17 dígitos
 * significativos), o que centavos (2 casas) nunca atinge.
 */
export function reaisParaWei(reais: number): string {
  const centavos = BigInt(Math.round(reais * 100));
  return (centavos * WEI_POR_CENTAVO).toString();
}
