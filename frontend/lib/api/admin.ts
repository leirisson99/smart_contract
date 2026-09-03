import { apiGetAdmin, apiPostAdmin } from "./http";
import { reaisParaWei, weiParaReais } from "./money";
import type { Imovel, Investidor, StatusImovel, StatusKyc } from "./types";

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

const STATUS_IMOVEL_BACKEND_PARA_FRONTEND: Record<string, StatusImovel> = {
  EM_CAPTACAO: "em_captacao",
  VENDIDO: "vendido",
  ALUGADO: "alugado",
};

const STATUS_KYC_BACKEND_PARA_FRONTEND: Record<string, StatusKyc> = {
  PENDING: "pendente",
  PROCESSING: "pendente",
  APPROVED: "aprovado",
  REJECTED: "reprovado",
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
    status: STATUS_IMOVEL_BACKEND_PARA_FRONTEND[imovel.status] ?? "em_captacao",
    valorMinimoInvestimento: weiParaReais(imovel.valorMinimoInvestimento),
  };
}

type InvestidorBackend = { id: string; nome: string; walletAddress: string; statusKyc: string };

/** RF-30: painel do gestor. Espelha `005-painel-administrativo`. */
export async function listarInvestidoresAdmin(): Promise<Investidor[]> {
  const investidores = await apiGetAdmin<InvestidorBackend[]>("/admin/investidores");
  return investidores.map((investidor) => ({
    id: investidor.id,
    nome: investidor.nome,
    walletAddress: investidor.walletAddress,
    statusKyc: STATUS_KYC_BACKEND_PARA_FRONTEND[investidor.statusKyc] ?? "pendente",
  }));
}

export interface DadosNovoImovel {
  nome: string;
  imagemUrl: string;
  valorTotal: number;
  totalCotas: number;
  rendimentoEstimadoAnual: number;
}

export async function criarImovel(dados: DadosNovoImovel): Promise<Imovel> {
  const imovel = await apiPostAdmin<ImovelBackend>("/admin/imoveis", {
    nome: dados.nome,
    imagemUrl: dados.imagemUrl,
    valorTotal: reaisParaWei(dados.valorTotal),
    totalCotas: dados.totalCotas,
    rendimentoEstimadoAnual: dados.rendimentoEstimadoAnual,
  });
  return converterImovel(imovel);
}

export async function depositarRendimento(imovelId: string, valor: number): Promise<void> {
  await apiPostAdmin(`/admin/imoveis/${imovelId}/depositar-rendimento`, { valor: reaisParaWei(valor) });
}
