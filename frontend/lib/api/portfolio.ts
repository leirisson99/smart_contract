import { apiGetInvestidor, apiPostInvestidor } from "./http";
import { weiParaReais } from "./money";
import { ApiError } from "@/lib/errors";
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

const PORTFOLIO_VAZIO: Portfolio = {
  holdings: [],
  valorTotalInvestido: 0,
  rendimentosRecebidos: [],
  rendimentoPendenteClaim: 0,
};

/** RF-29: leitura de portfólio + claim de rendimentos. Espelha `backend/src/routes/portfolio.ts`. */
export async function obterPortfolio(): Promise<Portfolio> {
  try {
    const portfolio = await apiGetInvestidor<PortfolioBackend>("/portfolio");
    return converterPortfolio(portfolio);
  } catch (error) {
    if (error instanceof ApiError && error.codigo === "SESSAO_INVALIDA") return PORTFOLIO_VAZIO;
    throw error;
  }
}

export async function claimRendimentos(): Promise<void> {
  await apiPostInvestidor("/portfolio/claim");
}
