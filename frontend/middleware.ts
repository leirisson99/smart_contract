import { NextResponse, type NextRequest } from "next/server";

/**
 * Guarda de rota (feature 006-autenticacao-investidor): checa só a
 * PRESENÇA do cookie de sessão (`sid`), sem round-trip ao backend no Edge —
 * a validade de fato é sempre revalidada pelo backend em cada chamada
 * autenticada (401 `SESSAO_INVALIDA` se o cookie estiver expirado/revogado).
 * Páginas mistas (catálogo público + ação protegida, ex. `/imoveis/[id]`,
 * `/mercado-secundario`) não entram aqui de propósito — continuam com o
 * padrão reativo já existente (erro tratado no componente ao chamar a ação).
 */
export function middleware(request: NextRequest) {
  if (request.cookies.has("sid")) {
    return NextResponse.next();
  }
  const url = new URL("/entrar", request.url);
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/portfolio"],
};
