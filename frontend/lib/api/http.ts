import { ApiError, type CodigoErro } from "@/lib/errors";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

async function request<T>(path: string, init?: RequestInit, baseUrl: string = BASE_URL): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError("ERRO_DESCONHECIDO");
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const codigo = (body?.codigo as CodigoErro | undefined) ?? "ERRO_DESCONHECIDO";
    throw new ApiError(codigo, response.status);
  }
  return body as T;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path);
}

export function apiPost<T>(path: string, payload?: unknown): Promise<T> {
  // Sempre manda um corpo JSON valido (mesmo que `{}`) quando o header
  // Content-Type: application/json esta presente - o parser de body do
  // Fastify rejeita com 400 uma requisicao com esse header mas sem corpo.
  return request<T>(path, { method: "POST", body: JSON.stringify(payload ?? {}) });
}

/**
 * Chamadas administrativas passam por `app/api/admin/[...path]/route.ts`
 * (mesma origem, roda no servidor do Next.js) em vez de ir direto ao backend
 * com a chave `x-admin-api-key` no navegador — essa chave nunca pode chegar
 * ao cliente, ao contrário do que uma env var `NEXT_PUBLIC_*` faria. Por isso
 * usa `""` como base (caminho relativo) em vez de `BASE_URL`.
 */
function requestAdmin<T>(path: string, init?: RequestInit): Promise<T> {
  return request<T>(path, init, "");
}

export function apiGetAdmin<T>(path: string): Promise<T> {
  return requestAdmin<T>(`/api${path}`);
}

export function apiPostAdmin<T>(path: string, payload?: unknown): Promise<T> {
  return requestAdmin<T>(`/api${path}`, { method: "POST", body: JSON.stringify(payload ?? {}) });
}

/**
 * Chamadas que exigem a sessao do investidor (feature 006) passam por
 * `app/api/investor/[...path]/route.ts` (mesma origem, roda no servidor do
 * Next.js) em vez de ir direto ao backend — assim o cookie `sid` (httpOnly)
 * viaja sempre same-origin do ponto de vista do browser, sem depender de
 * `credentials:'include'`/CORS cross-site (mesmo racional do proxy admin,
 * que existe para nao expor `x-admin-api-key` ao cliente).
 */
function requestInvestidor<T>(path: string, init?: RequestInit): Promise<T> {
  return request<T>(path, init, "");
}

export function apiGetInvestidor<T>(path: string): Promise<T> {
  return requestInvestidor<T>(`/api/investor${path}`);
}

export function apiPostInvestidor<T>(path: string, payload?: unknown): Promise<T> {
  return requestInvestidor<T>(`/api/investor${path}`, { method: "POST", body: JSON.stringify(payload ?? {}) });
}
