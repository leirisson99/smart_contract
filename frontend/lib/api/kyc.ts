import { ApiError } from "@/lib/errors";
import { apiGet, apiPost } from "./http";
import { atualizarStatusKycSalvo, obterInvestidorSalvo, salvarInvestidor } from "./session";
import type { Investidor, StatusKyc } from "./types";

export interface DadosCadastro {
  nome: string;
  email: string;
  cpf: string;
}

const STATUS_BACKEND_PARA_FRONTEND: Record<string, StatusKyc> = {
  PENDING: "pendente",
  PROCESSING: "pendente",
  APPROVED: "aprovado",
  REJECTED: "reprovado",
};

/** RF-27: cadastro + submissão de KYC. Espelha `backend/src/routes/investors.ts` + `kyc.ts`. */
export async function cadastrar(dados: DadosCadastro): Promise<Investidor> {
  const { investorId } = await apiPost<{ investorId: string; walletAddress: string }>("/investors", {
    fullName: dados.nome,
    cpf: dados.cpf,
  });

  const investidor: Investidor = { id: investorId, nome: dados.nome, email: dados.email, statusKyc: "pendente" };
  salvarInvestidor(investidor);

  await apiPost(`/investors/${investorId}/kyc`, {});

  return investidor;
}

export async function obterStatusKyc(): Promise<StatusKyc> {
  const investidor = obterInvestidorSalvo();
  if (!investidor) return "pendente";

  const kyc = await apiGet<{ status: string }>(`/investors/${investidor.id}/kyc`);
  const status = STATUS_BACKEND_PARA_FRONTEND[kyc.status] ?? "pendente";
  atualizarStatusKycSalvo(status);
  return status;
}

export async function obterInvestidorAtual(): Promise<Investidor> {
  const investidor = obterInvestidorSalvo();
  if (!investidor) throw new Error("nenhum investidor cadastrado nesta sessão");
  const status = await obterStatusKyc();
  return { ...investidor, statusKyc: status };
}

/** Usado hoje só por `marketplace.ts` (mock, feature 004 ainda não existe no backend real). */
export function garantirKycAprovado(status: StatusKyc) {
  if (status === "reprovado") throw new ApiError("KYC_REPROVADO");
  if (status !== "aprovado") throw new ApiError("SEM_KYC");
}
