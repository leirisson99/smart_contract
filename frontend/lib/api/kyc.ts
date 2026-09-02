import { ApiError } from "@/lib/errors";
import { delay } from "./delay";
import { investidorDemo } from "./fixtures";
import type { Investidor, StatusKyc } from "./types";

export interface DadosCadastro {
  nome: string;
  email: string;
  cpf: string;
}

/** RF-27: cadastro + upload de KYC. Espelha `backend/src/routes/investors.ts` + `kyc.ts`. */
export async function cadastrar(dados: DadosCadastro): Promise<Investidor> {
  await delay(1200);
  investidorDemo.nome = dados.nome;
  investidorDemo.email = dados.email;
  investidorDemo.statusKyc = "pendente";

  // Simula o webhook assíncrono do provedor de KYC aprovando o investidor.
  setTimeout(() => {
    investidorDemo.statusKyc = "aprovado";
  }, 6000);

  return { ...investidorDemo };
}

export async function obterStatusKyc(): Promise<StatusKyc> {
  await delay(300);
  return investidorDemo.statusKyc;
}

export async function obterInvestidorAtual(): Promise<Investidor> {
  await delay(300);
  return { ...investidorDemo };
}

export function garantirKycAprovado(status: StatusKyc) {
  if (status === "reprovado") throw new ApiError("KYC_REPROVADO");
  if (status !== "aprovado") throw new ApiError("SEM_KYC");
}
