import { apiGet, apiPost } from "./http";
import { atualizarStatusKycSalvo, exigirInvestidor, obterInvestidorSalvo, salvarInvestidor } from "./session";
import type { Investidor, StatusKyc } from "./types";

export interface DadosCadastro {
  nome: string;
  email: string;
  cpf: string;
}

export const STATUS_KYC_BACKEND_PARA_FRONTEND: Record<string, StatusKyc> = {
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
  const status = STATUS_KYC_BACKEND_PARA_FRONTEND[kyc.status] ?? "pendente";
  atualizarStatusKycSalvo(status);
  return status;
}

export async function obterInvestidorAtual(): Promise<Investidor> {
  const investidor = exigirInvestidor();
  const status = await obterStatusKyc();
  return { ...investidor, statusKyc: status };
}
