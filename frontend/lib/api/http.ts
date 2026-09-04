import { ApiError, type CodigoErro } from "@/lib/errors";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
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
 * Header enviado pelo painel do gestor em toda chamada a `/admin/*`
 * (feature 005 - unico mecanismo de autenticacao/RBAC do backend hoje, ver
 * `docs/backend/features/005-painel-administrativo/plan.md`). So existe uma
 * unica chave/um unico gestor na POC - sem tela de login, ver non-goals da
 * constituicao do projeto.
 */
const ADMIN_HEADERS = { "x-admin-api-key": process.env.NEXT_PUBLIC_ADMIN_API_KEY ?? "" };

export function apiGetAdmin<T>(path: string): Promise<T> {
  return request<T>(path, { headers: ADMIN_HEADERS });
}

export function apiPostAdmin<T>(path: string, payload?: unknown): Promise<T> {
  return request<T>(path, { method: "POST", headers: ADMIN_HEADERS, body: JSON.stringify(payload ?? {}) });
}
