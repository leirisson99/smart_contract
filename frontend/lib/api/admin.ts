import { delay } from "./delay";
import { imoveis, investidoresAdmin } from "./fixtures";
import type { Imovel, Investidor } from "./types";

/** RF-30: painel do gestor. Espelha `005-painel-administrativo`. */
export async function listarInvestidoresAdmin(): Promise<Investidor[]> {
  await delay(500);
  return investidoresAdmin.map((item) => ({ ...item }));
}

export interface DadosNovoImovel {
  nome: string;
  imagemUrl: string;
  valorTotal: number;
  totalCotas: number;
  rendimentoEstimadoAnual: number;
}

export async function criarImovel(dados: DadosNovoImovel): Promise<Imovel> {
  await delay(1200);
  const novoImovel: Imovel = {
    id: `imv-${Date.now()}`,
    nome: dados.nome,
    imagemUrl: dados.imagemUrl,
    valorTotal: dados.valorTotal,
    totalCotas: dados.totalCotas,
    cotasRestantes: dados.totalCotas,
    precoPorCota: Math.round(dados.valorTotal / dados.totalCotas),
    rendimentoEstimadoAnual: dados.rendimentoEstimadoAnual,
    status: "em_captacao",
    valorMinimoInvestimento: Math.round(dados.valorTotal / dados.totalCotas),
  };
  imoveis.unshift(novoImovel);
  return novoImovel;
}

export async function depositarRendimento(_imovelId: string, _valor: number): Promise<void> {
  await delay(1200);
}
