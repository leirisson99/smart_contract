import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy server-side para as rotas de investidor autenticado do backend
 * (feature 006-autenticacao-investidor). Existe pelo mesmo motivo do proxy
 * admin (`app/api/admin/[...path]/route.ts`): o cookie de sessao (`sid`,
 * httpOnly) precisa ser first-party do ponto de vista do browser. Se o
 * frontend chamasse o backend direto (origem diferente, `NEXT_PUBLIC_API_URL`),
 * o navegador so aceitaria/enviaria o cookie sob `credentials:'include'` +
 * CORS `credentials:true` com origem explicita, o que ainda quebraria em
 * producao se front e back acabarem em dominios de registro diferentes
 * (cookie vira third-party de fato). Rodando pelo proprio servidor do
 * Next.js, o cookie nunca sai da origem do frontend.
 */
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

async function encaminhar(request: NextRequest, path: string[]): Promise<NextResponse> {
  const destino = `${BACKEND_URL}/${path.join("/")}`;
  const init: RequestInit = {
    method: request.method,
    headers: {
      "Content-Type": "application/json",
      cookie: request.headers.get("cookie") ?? "",
    },
  };
  if (request.method !== "GET") {
    init.body = await request.text();
  }

  let resposta: Response;
  try {
    resposta = await fetch(destino, init);
  } catch {
    return NextResponse.json({ codigo: "ERRO_DESCONHECIDO" }, { status: 502 });
  }

  const corpo = await resposta.text();
  const nextRes = new NextResponse(corpo, {
    status: resposta.status,
    headers: { "Content-Type": "application/json" },
  });

  // `getSetCookie()` preserva multiplos cookies como entradas separadas -
  // `.get("set-cookie")` colapsaria tudo numa unica string e quebraria o
  // parsing de atributos (Path, HttpOnly, etc. de cada cookie).
  for (const cookie of resposta.headers.getSetCookie()) {
    nextRes.headers.append("set-cookie", cookie);
  }

  return nextRes;
}

type RouteParams = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  return encaminhar(request, path);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  return encaminhar(request, path);
}
