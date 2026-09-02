import { apiGet, apiPost } from "./http";
import { reaisParaWei, weiParaReais } from "./money";
import { obterInvestidorSalvo } from "./session";
import type { Listagem, StatusListagem } from "./types";

type ListagemBackend = {
  id: string;
  imovelId: string;
  imovelNome: string;
  vendedorNome: string;
  cotas: number;
  precoPorCota: string;
  status: StatusListagem;
  criadaPeloUsuarioAtual: boolean;
};

function converterListagem(listagem: ListagemBackend): Listagem {
  return {
    id: listagem.id,
    imovelId: listagem.imovelId,
    imovelNome: listagem.imovelNome,
    vendedorNome: listagem.vendedorNome,
    cotas: listagem.cotas,
    precoPorCota: weiParaReais(listagem.precoPorCota),
    status: listagem.status,
    criadaPeloUsuarioAtual: listagem.criadaPeloUsuarioAtual,
  };
}

/** RF-31: mercado secundário. Espelha `backend/src/routes/marketplace.ts` (`004-mercado-secundario`). */
export async function listarListagens(): Promise<Listagem[]> {
  const investidor = obterInvestidorSalvo();
  const query = investidor ? `?investorId=${investidor.id}` : "";
  const listagens = await apiGet<ListagemBackend[]>(`/listagens${query}`);
  return listagens.map(converterListagem);
}

export async function criarListagem(imovelId: string, cotas: number, precoPorCota: number): Promise<void> {
  const investidor = obterInvestidorSalvo();
  if (!investidor) throw new Error("nenhum investidor cadastrado nesta sessão");

  await apiPost("/listagens", {
    investorId: investidor.id,
    imovelId,
    cotas,
    precoPorCota: reaisParaWei(precoPorCota),
  });
}

export async function comprarListagem(id: string): Promise<void> {
  const investidor = obterInvestidorSalvo();
  if (!investidor) throw new Error("nenhum investidor cadastrado nesta sessão");

  await apiPost(`/listagens/${id}/comprar`, { investorId: investidor.id });
}

export async function cancelarListagem(id: string): Promise<void> {
  const investidor = obterInvestidorSalvo();
  if (!investidor) throw new Error("nenhum investidor cadastrado nesta sessão");

  await apiPost(`/listagens/${id}/cancelar`, { investorId: investidor.id });
}
