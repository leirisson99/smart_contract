import { ApiError } from "@/lib/errors";
import type { Investidor } from "./types";

/**
 * Não existe autenticação/sessão no backend ainda (gap conhecido, ver
 * PENDENCIAS.md) — o investidor cadastrado precisa ser lembrado entre
 * navegações client-side de alguma forma. Guardamos localmente no browser.
 */
const STORAGE_KEY = "investidorAtual";

export function salvarInvestidor(investidor: Investidor): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(investidor));
}

export function obterInvestidorSalvo(): Investidor | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Investidor;
  } catch {
    return null;
  }
}

export function atualizarStatusKycSalvo(status: Investidor["statusKyc"]): void {
  const atual = obterInvestidorSalvo();
  if (!atual) return;
  salvarInvestidor({ ...atual, statusKyc: status });
}

/** Usado por toda chamada de API que exige um investidor na sessão atual. */
export function exigirInvestidor(): Investidor {
  const investidor = obterInvestidorSalvo();
  if (!investidor) throw new ApiError("ERRO_DESCONHECIDO");
  return investidor;
}
