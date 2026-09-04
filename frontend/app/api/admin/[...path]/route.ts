import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy server-side para `/admin/*` do backend. Existe porque a chave
 * administrativa (`x-admin-api-key`) nao pode chegar ao navegador: uma
 * variavel `NEXT_PUBLIC_*` e embutida em texto plano no bundle do cliente, o
 * que anulava por completo a autenticacao do painel assim que o frontend
 * fosse servido de qualquer lugar alem de localhost. Rotas de API do Next.js
 * rodam só no servidor, entao a chave (`ADMIN_API_KEY`, sem prefixo
 * `NEXT_PUBLIC_`) nunca sai daqui.
 */
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";
const ADMIN_API_KEY = process.env.ADMIN_API_KEY ?? "";

async function encaminhar(request: NextRequest, path: string[]): Promise<NextResponse> {
  const destino = `${BACKEND_URL}/admin/${path.join("/")}`;
  const init: RequestInit = {
    method: request.method,
    headers: { "Content-Type": "application/json", "x-admin-api-key": ADMIN_API_KEY },
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
  return new NextResponse(corpo, {
    status: resposta.status,
    headers: { "Content-Type": "application/json" },
  });
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
