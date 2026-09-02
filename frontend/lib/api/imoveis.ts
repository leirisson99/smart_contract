import { ApiError } from "@/lib/errors";
import { delay } from "./delay";
import { imoveis, portfolioDemo } from "./fixtures";
import { garantirKycAprovado, obterStatusKyc } from "./kyc";
import type { Imovel } from "./types";

/** RF-28: leitura de imóveis. Espelha `002-investimento-primario` (ainda em draft no backend real). */
export async function listarImoveis(): Promise<Imovel[]> {
  await delay(500);
  return imoveis.map((imovel) => ({ ...imovel }));
}

export async function obterImovel(id: string): Promise<Imovel | null> {
  await delay(400);
  const imovel = imoveis.find((item) => item.id === id);
  return imovel ? { ...imovel } : null;
}

export async function comprarCotas(imovelId: string, quantidade: number): Promise<void> {
  const statusKyc = await obterStatusKyc();
  garantirKycAprovado(statusKyc);

  const imovel = imoveis.find((item) => item.id === imovelId);
  if (!imovel) throw new ApiError("ERRO_DESCONHECIDO");

  const valorInvestido = quantidade * imovel.precoPorCota;
  if (valorInvestido < imovel.valorMinimoInvestimento) throw new ApiError("VALOR_MINIMO_NAO_ATINGIDO");
  if (quantidade > imovel.cotasRestantes) throw new ApiError("COTAS_INSUFICIENTES");

  await delay(1500);

  imovel.cotasRestantes -= quantidade;
  portfolioDemo.valorTotalInvestido += valorInvestido;
  const holding = portfolioDemo.holdings.find((item) => item.imovelId === imovelId);
  if (holding) {
    holding.cotas += quantidade;
    holding.valorInvestido += valorInvestido;
  } else {
    portfolioDemo.holdings.push({
      imovelId,
      imovelNome: imovel.nome,
      cotas: quantidade,
      valorInvestido,
    });
  }
}
