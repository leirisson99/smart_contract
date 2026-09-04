import { apiGet, apiGetInvestidor, apiPostInvestidor } from "./http";
import { reaisParaWei, weiParaReais } from "./money";
import { ApiError } from "@/lib/errors";
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

/**
 * RF-31: mercado secundário. Espelha `backend/src/routes/marketplace.ts` (`004-mercado-secundario`).
 * `GET /listagens` é público e não sabe mais quem é "você" (feature 006 —
 * antes disso vinha de `?investorId=` no query, confiado do cliente). Pra
 * marcar `criadaPeloUsuarioAtual` sem voltar a confiar num id vindo do
 * client, busca também `GET /listagens/minhas` (autenticada, via cookie de
 * sessão) e cruza os ids no frontend. Se não houver sessão, trata como
 * "nenhuma listagem própria" em vez de erro — é um estado normal (visitante
 * ainda não logado).
 */
export async function listarListagens(): Promise<Listagem[]> {
  const todas = await apiGet<ListagemBackend[]>("/listagens");

  let meusIds = new Set<string>();
  try {
    const minhas = await apiGetInvestidor<ListagemBackend[]>("/listagens/minhas");
    meusIds = new Set(minhas.map((listagem) => listagem.id));
  } catch (error) {
    if (!(error instanceof ApiError && error.codigo === "SESSAO_INVALIDA")) throw error;
  }

  return todas.map((listagem) =>
    converterListagem({ ...listagem, criadaPeloUsuarioAtual: meusIds.has(listagem.id) }),
  );
}

export async function criarListagem(imovelId: string, cotas: number, precoPorCota: number): Promise<void> {
  await apiPostInvestidor("/listagens", {
    imovelId,
    cotas,
    precoPorCota: reaisParaWei(precoPorCota),
  });
}

export async function comprarListagem(id: string): Promise<void> {
  await apiPostInvestidor(`/listagens/${id}/comprar`);
}

export async function cancelarListagem(id: string): Promise<void> {
  await apiPostInvestidor(`/listagens/${id}/cancelar`);
}
