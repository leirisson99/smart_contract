import { apiGetAdmin, apiPostAdmin } from "./http";
import { reaisParaWei } from "./money";
import { converterImovel } from "./imoveis";
import { STATUS_KYC_BACKEND_PARA_FRONTEND } from "./kyc";
import type { ImovelBackend } from "./imoveis";
import type { Imovel, Investidor } from "./types";

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
