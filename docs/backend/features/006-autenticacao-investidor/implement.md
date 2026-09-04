---
status: approved
owner: tech-lead
last_updated: 2026-09-04
---

# Implementação — Feature Backend 006

> Consolida mapa de rotas alteradas, estratégia de testes e status de implementação desta feature.

## Rotas endurecidas (001-004) — rota a rota

| Arquivo | Rota atual | Rota nova | Mudança |
|---|---|---|---|
| `investors.ts` | `GET /investors/:id/kyc` | `GET /kyc` | remove `:id`; `preHandler: exigirInvestidor` |
| `kyc.ts` | `POST /investors/:id/kyc` | `POST /kyc` | idem — cadastro já emite sessão, essa chamada (logo após `POST /investors`) segue funcionando sem gap |
| `imoveis.ts` | `POST /imoveis/:id/comprar` (`body.investorId`) | mesma URL | remove `investorId` do zod; `preHandler: exigirInvestidor`; usa `request.investorId` |
| `marketplace.ts` | `GET /listagens` (`query.investorId` opcional) | `GET /listagens` (sempre pública) + novo `GET /listagens/minhas` | split em duas rotas — evita inspecionar `request.query` antes do zod rodar |
| `marketplace.ts` | `POST /listagens` (`body.investorId`) | mesma URL | remove do zod; `preHandler: exigirInvestidor` |
| `marketplace.ts` | `POST /listagens/:id/comprar` | mesma URL | idem; `:id` é da listagem, não do investidor |
| `marketplace.ts` | `POST /listagens/:id/cancelar` | mesma URL | idem; checagem de "é o dono?" compara contra `request.investorId` (sessão) |
| `portfolio.ts` | `GET /investors/:id/portfolio` | `GET /portfolio` | remove `:id`; `preHandler: exigirInvestidor` |
| `portfolio.ts` | `POST /investors/:id/portfolio/claim` | `POST /portfolio/claim` | idem |

Mudança de contrato quebradora (shapes de URL mudam) — aceitável porque o único consumidor é o frontend deste repo, sem clientes externos a preservar.

## Integração com o proxy do frontend

`frontend/app/api/investor/[...path]/route.ts` repassa `Cookie` (ida) e `Set-Cookie` (volta, via `getSetCookie()`) entre o browser e o backend, mantendo o cookie `sid` sempre same-origin do ponto de vista do browser — mesmo padrão do proxy admin (`SEC-B01`). `frontend/lib/api/http.ts` ganhou `apiGetInvestidor`/`apiPostInvestidor` (base `/api/investor`, espelhando `apiGetAdmin`/`apiPostAdmin`).

## Estratégia de testes

- `backend/test/auth.routes.test.ts` (novo, 12 cenários): cadastro autentica automaticamente, e-mail duplicado, solicitar→verificar emite sessão válida, anti-enumeração (e-mail inexistente), código errado incrementa tentativas, limite de tentativas excedido, código expirado, replay (código já usado não pode ser reusado), reenvio invalida o código anterior, cooldown por e-mail (`LIMITE_SOLICITACOES_EXCEDIDO`), `GET /auth/me` sem cookie, logout revoga a sessão. Rate-limit por IP isolado entre testes via `remoteAddress` simulado (`app.inject`) — sem isso, todos os testes do arquivo compartilhariam o mesmo limite de 5/min por rodarem sob o mesmo IP simulado.
- `backend/test/{imoveis,marketplace,portfolio}.routes.test.ts`, `routes.test.ts` e os três `*-flow.e2e.test.ts`: atualizados para simular login via cookie antes de cada chamada que exige sessão — `criarSessao()` chamado direto (fixtures que criam o investidor via Prisma) ou cookie extraído do `Set-Cookie` de `POST /investors` (fluxos ponta a ponta via HTTP).
- Verificação manual ponta a ponta no browser (Playwright headless, `frontend`/`backend` já rodando em dev): cadastro → autenticado automaticamente (nav mostra "Sair") → `/portfolio` acessível → logout → nav mostra "Entrar" → `/portfolio` redireciona para `/entrar?next=/portfolio` (guarda de rota, `frontend/middleware.ts`) → solicitar código → código extraído do log de dev do backend (SMTP não configurado) → verificar → login recuperado, redireciona para `/imoveis`.

### Critério de saída
Todos os cenários de `spec.md` cobertos por teste de integração. `npm test` (backend): 62/66 testes passam (os 4 restantes exigem `RUN_E2E=1` com Anvil rodando, não executado nesta verificação). Fluxo ponta a ponta confirmado manualmente no browser.

## Status de implementação

Implementada em 2026-09-04. Ver detalhe em `tasks.md` e as decisões de mecanismo em `plan.md`/[`../../../on-chain/decisions/ADR-0007-sessao-otp-investidor.md`](../../../on-chain/decisions/ADR-0007-sessao-otp-investidor.md).

- Novos: `backend/src/services/{hotp,mailer,investorSession}.ts`, `backend/src/middleware/investorAuth.ts`, `backend/src/routes/auth.ts`, `backend/src/types/fastify.d.ts` (augmenta `FastifyRequest.investorId`), `backend/test/auth.routes.test.ts`.
- Alterados: `backend/prisma/schema.prisma` (+ migration), `backend/src/config.ts` (vars SMTP opcionais), `backend/src/server.ts` (plugins `@fastify/cookie`/`@fastify/rate-limit`, rota `auth.ts`), `backend/src/routes/{investors,kyc,imoveis,marketplace,portfolio}.ts`, `backend/.env.example`.
- Novos deps: `@fastify/cookie`, `@fastify/rate-limit`, `nodemailer` (+ `@types/nodemailer`), `otplib`.
- Frontend: `frontend/app/api/investor/[...path]/route.ts` (novo proxy), `frontend/lib/api/auth.ts` (novo), `frontend/lib/api/{kyc,imoveis,marketplace,portfolio}.ts` (atualizados, sem `investorId` explícito), `frontend/lib/api/session.ts` (removido), `frontend/middleware.ts` (novo, guarda de rota), `frontend/app/entrar/page.tsx` + `frontend/components/auth/otp-login-form.tsx` (novos), `frontend/components/layout/nav-investidor.tsx` (link Entrar/Sair), `frontend/lib/errors.ts` (novos códigos).
- Testado: `npm test` no backend (62/66, resto gated `RUN_E2E=1`) e verificação manual ponta a ponta no browser via script Playwright ad-hoc.
