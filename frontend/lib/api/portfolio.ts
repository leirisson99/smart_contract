import { delay } from "./delay";
import { portfolioDemo } from "./fixtures";
import type { Portfolio } from "./types";

/** RF-29: leitura de portfólio + claim de rendimentos. Espelha `003-portfolio-e-rendimentos`. */
export async function obterPortfolio(): Promise<Portfolio> {
  await delay(500);
  return {
    ...portfolioDemo,
    holdings: [...portfolioDemo.holdings],
    rendimentosRecebidos: [...portfolioDemo.rendimentosRecebidos],
  };
}

export async function claimRendimentos(): Promise<void> {
  await delay(1500);
  if (portfolioDemo.rendimentoPendenteClaim <= 0) return;

  portfolioDemo.rendimentosRecebidos.unshift({
    id: `rend-${Date.now()}`,
    imovelNome: portfolioDemo.holdings[0]?.imovelNome ?? "Portfólio",
    cicloReferencia: new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
    valor: portfolioDemo.rendimentoPendenteClaim,
    dataRecebimento: new Date().toISOString(),
  });
  portfolioDemo.rendimentoPendenteClaim = 0;
}
