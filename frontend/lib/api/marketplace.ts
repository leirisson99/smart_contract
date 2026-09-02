import { ApiError } from "@/lib/errors";
import { delay } from "./delay";
import { listagens, portfolioDemo } from "./fixtures";
import { garantirKycAprovado, obterStatusKyc } from "./kyc";
import type { Listagem } from "./types";

/** RF-31: mercado secundário. Espelha `004-mercado-secundario`. */
export async function listarListagens(): Promise<Listagem[]> {
  await delay(500);
  return listagens.filter((item) => item.status === "ativa").map((item) => ({ ...item }));
}

export async function criarListagem(
  imovelId: string,
  imovelNome: string,
  cotas: number,
  precoPorCota: number,
): Promise<void> {
  const holding = portfolioDemo.holdings.find((item) => item.imovelId === imovelId);
  if (!holding || holding.cotas < cotas) throw new ApiError("SALDO_INSUFICIENTE");

  await delay(1200);

  holding.cotas -= cotas;
  listagens.unshift({
    id: `lst-${Date.now()}`,
    imovelId,
    imovelNome,
    vendedorNome: "Você",
    cotas,
    precoPorCota,
    status: "ativa",
    criadaPeloUsuarioAtual: true,
  });
}

export async function comprarListagem(id: string): Promise<void> {
  const statusKyc = await obterStatusKyc();
  garantirKycAprovado(statusKyc);

  const listagem = listagens.find((item) => item.id === id);
  if (!listagem) throw new ApiError("LISTAGEM_NAO_ENCONTRADA");
  if (listagem.status !== "ativa") throw new ApiError("LISTAGEM_JA_VENDIDA");

  await delay(1500);
  listagem.status = "vendida";

  const holding = portfolioDemo.holdings.find((item) => item.imovelId === listagem.imovelId);
  const valorInvestido = listagem.cotas * listagem.precoPorCota;
  if (holding) {
    holding.cotas += listagem.cotas;
    holding.valorInvestido += valorInvestido;
  } else {
    portfolioDemo.holdings.push({
      imovelId: listagem.imovelId,
      imovelNome: listagem.imovelNome,
      cotas: listagem.cotas,
      valorInvestido,
    });
  }
  portfolioDemo.valorTotalInvestido += valorInvestido;
}

export async function cancelarListagem(id: string): Promise<void> {
  const listagem = listagens.find((item) => item.id === id);
  if (!listagem) throw new ApiError("LISTAGEM_NAO_ENCONTRADA");

  await delay(800);
  listagem.status = "cancelada";
  const holding = portfolioDemo.holdings.find((item) => item.imovelId === listagem.imovelId);
  if (holding) holding.cotas += listagem.cotas;
  else
    portfolioDemo.holdings.push({
      imovelId: listagem.imovelId,
      imovelNome: listagem.imovelNome,
      cotas: listagem.cotas,
      valorInvestido: 0,
    });
}
