import { apiGet, apiPost } from "./http";
import { weiParaReais } from "./money";
import { obterInvestidorSalvo } from "./session";
import type { Portfolio } from "./types";

type PortfolioBackend = {
  holdings: { imovelId: string; imovelNome: string; cotas: number; valorInvestido: string }[];
  valorTotalInvestido: string;
  rendimentosRecebidos: {
    id: string;
    imovelNome: string;
    cicloReferencia: number;
    valor: string;
    dataRecebimento: string;
  }[];
  rendimentoPendenteClaim: string;
};

function converterPortfolio(portfolio: PortfolioBackend): Portfolio {
  return {
    holdings: portfolio.holdings.map((h) => ({
      imovelId: h.imovelId,
      imovelNome: h.imovelNome,
      cotas: h.cotas,
      valorInvestido: weiParaReais(h.valorInvestido),
    })),
    valorTotalInvestido: weiParaReais(portfolio.valorTotalInvestido),
    rendimentosRecebidos: portfolio.rendimentosRecebidos.map((r) => ({
      id: r.id,
      imovelNome: r.imovelNome,
      cicloReferencia: `Ciclo ${r.cicloReferencia}`,
      valor: weiParaReais(r.valor),
      dataRecebimento: r.dataRecebimento,
    })),
    rendimentoPendenteClaim: weiParaReais(portfolio.rendimentoPendenteClaim),
  };
}

/** RF-29: leitura de portfólio + claim de rendimentos. Espelha `backend/src/routes/portfolio.ts`. */
export async function obterPortfolio(): Promise<Portfolio> {
  const investidor = obterInvestidorSalvo();
  if (!investidor) {
    return { holdings: [], valorTotalInvestido: 0, rendimentosRecebidos: [], rendimentoPendenteClaim: 0 };
  }
  const portfolio = await apiGet<PortfolioBackend>(`/investors/${investidor.id}/portfolio`);
  return converterPortfolio(portfolio);
}

export async function claimRendimentos(): Promise<void> {
  const investidor = obterInvestidorSalvo();
  if (!investidor) throw new Error("nenhum investidor cadastrado nesta sessão");

  await apiPost(`/investors/${investidor.id}/portfolio/claim`);
}
