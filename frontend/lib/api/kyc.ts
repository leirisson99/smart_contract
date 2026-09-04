import { apiGetInvestidor, apiPostInvestidor } from "./http";
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

/**
 * RF-27: cadastro + submissão de KYC. Espelha `backend/src/routes/investors.ts` + `kyc.ts`.
 * Autentica automaticamente (feature 006-autenticacao-investidor) — o cookie
 * de sessão já vem no próprio 201 de `POST /investors`, sem precisar de um
 * passo de login separado logo após o cadastro.
 */
export async function cadastrar(dados: DadosCadastro): Promise<Investidor> {
  const { investorId } = await apiPostInvestidor<{ investorId: string; walletAddress: string }>("/investors", {
    fullName: dados.nome,
    email: dados.email,
    cpf: dados.cpf,
  });

  await apiPostInvestidor("/kyc", {});

  return { id: investorId, nome: dados.nome, email: dados.email, statusKyc: "pendente" };
}

export async function obterStatusKyc(): Promise<StatusKyc> {
  const kyc = await apiGetInvestidor<{ status: string }>("/kyc");
  return STATUS_KYC_BACKEND_PARA_FRONTEND[kyc.status] ?? "pendente";
}
