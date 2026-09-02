import { apiGet, apiPost } from "./http";
import { weiParaReais } from "./money";
import { obterInvestidorSalvo } from "./session";
import type { Imovel, StatusImovel } from "./types";

type ImovelBackend = {
  id: string;
  nome: string;
  imagemUrl: string | null;
  valorTotal: string;
  totalCotas: number;
  cotasRestantes: number;
  precoPorCota: string;
  rendimentoEstimadoAnual: number;
  status: string;
  valorMinimoInvestimento: string;
};

const IMAGEM_FALLBACK =
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=800&auto=format&fit=crop";

const STATUS_BACKEND_PARA_FRONTEND: Record<string, StatusImovel> = {
  EM_CAPTACAO: "em_captacao",
  VENDIDO: "vendido",
  ALUGADO: "alugado",
};

function converterImovel(imovel: ImovelBackend): Imovel {
  return {
    id: imovel.id,
    nome: imovel.nome,
    imagemUrl: imovel.imagemUrl ?? IMAGEM_FALLBACK,
    valorTotal: weiParaReais(imovel.valorTotal),
    totalCotas: imovel.totalCotas,
    cotasRestantes: imovel.cotasRestantes,
    precoPorCota: weiParaReais(imovel.precoPorCota),
    rendimentoEstimadoAnual: imovel.rendimentoEstimadoAnual,
    status: STATUS_BACKEND_PARA_FRONTEND[imovel.status] ?? "em_captacao",
    valorMinimoInvestimento: weiParaReais(imovel.valorMinimoInvestimento),
  };
}

/** RF-28: leitura de imóveis. Espelha `backend/src/routes/imoveis.ts` (`002-investimento-primario`). */
export async function listarImoveis(): Promise<Imovel[]> {
  const imoveis = await apiGet<ImovelBackend[]>("/imoveis");
  return imoveis.map(converterImovel);
}

export async function obterImovel(id: string): Promise<Imovel | null> {
  try {
    const imovel = await apiGet<ImovelBackend>(`/imoveis/${id}`);
    return converterImovel(imovel);
  } catch {
    return null;
  }
}

export async function comprarCotas(imovelId: string, quantidade: number): Promise<void> {
  const investidor = obterInvestidorSalvo();
  if (!investidor) throw new Error("nenhum investidor cadastrado nesta sessão");

  await apiPost(`/imoveis/${imovelId}/comprar`, { investorId: investidor.id, quantidade });
}
