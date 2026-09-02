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
    throw new ApiError(codigo);
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
