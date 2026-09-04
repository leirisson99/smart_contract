import { apiGetInvestidor, apiPostInvestidor } from "./http";
import { ApiError } from "@/lib/errors";
import type { Investidor, StatusKyc } from "./types";

type SessaoBackend = { investorId: string; fullName: string; email: string; statusKyc: string; walletAddress?: string };

const STATUS_KYC_BACKEND_PARA_FRONTEND: Record<string, StatusKyc> = {
  PENDING: "pendente",
  PROCESSING: "pendente",
  APPROVED: "aprovado",
  REJECTED: "reprovado",
};

function converterSessao(sessao: SessaoBackend): Investidor {
  return {
    id: sessao.investorId,
    nome: sessao.fullName,
    email: sessao.email,
    walletAddress: sessao.walletAddress,
    statusKyc: STATUS_KYC_BACKEND_PARA_FRONTEND[sessao.statusKyc] ?? "pendente",
  };
}

/** Login sem senha (feature 006): passo 1, pede o codigo HOTP por e-mail. Resposta identica exista ou nao o e-mail (anti-enumeracao). */
export async function solicitarCodigo(email: string): Promise<void> {
  await apiPostInvestidor("/auth/otp/solicitar", { email });
}

/** Passo 2: verifica o codigo e recebe o cookie de sessao (setado pelo proxy, nunca lido pelo JS do client). */
export async function verificarCodigo(email: string, codigo: string): Promise<Investidor> {
  const sessao = await apiPostInvestidor<SessaoBackend>("/auth/otp/verificar", { email, codigo });
  return converterSessao(sessao);
}

/** `null` quando nao ha sessao valida (SESSAO_INVALIDA) - nao deve ser tratado como erro de UI pelos chamadores. */
export async function obterSessaoAtual(): Promise<Investidor | null> {
  try {
    const sessao = await apiGetInvestidor<SessaoBackend>("/auth/me");
    return converterSessao(sessao);
  } catch (error) {
    if (error instanceof ApiError && error.codigo === "SESSAO_INVALIDA") return null;
    throw error;
  }
}

export async function logout(): Promise<void> {
  await apiPostInvestidor("/auth/logout");
}
