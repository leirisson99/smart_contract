/**
 * Simula a latência de uma transação on-chain processada pelo backend.
 * Toda função de `lib/api` usa isso para exercitar os estados idle/processando/sucesso/erro (RNF-15)
 * mesmo sem um backend real por trás — trocar por `fetch` real não muda a assinatura das funções.
 */
export function delay(ms = 900) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
