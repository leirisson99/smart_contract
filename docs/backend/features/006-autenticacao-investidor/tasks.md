---
status: approved
owner: tech-lead
last_updated: 2026-09-04
---

# Tasks — Feature Backend 006

1. [x] Migration Prisma (`backend/prisma/migrations/20260904214949_add_investor_auth/`): `email` (único) + estado do HOTP (`otpSecretEnc`, `otpCounter`, `otpConsumedCounter`, `otpCodeExpiresAt`, `otpAttempts`, `otpLastRequestedAt`) em `Investor`; novo model `InvestorSession` (`tokenHash` único, `expiresAt`, `revokedAt`). Banco de dev/test descartável — `email` entra direto como `NOT NULL UNIQUE`, sem backfill em duas etapas (decisão em `plan.md`).
2. [x] `backend/src/services/hotp.ts` — geração/verificação HOTP (RFC 4226) via `otplib`, `counterTolerance: 0` (servidor gera e verifica o mesmo desafio, sem janela de look-ahead).
3. [x] `backend/src/services/mailer.ts` — envio por SMTP (`nodemailer`, novo dep), fallback de log quando `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` ausentes (`backend/.env.example` documenta as vars, todas opcionais).
4. [x] `backend/src/services/investorSession.ts` — `criarSessao`/`validarSessao`/`renovarSeNecessario`/`revogarSessao` + `setSessionCookie`/`clearSessionCookie` (token opaco de 256 bits, hash sha256, cookie `sid` httpOnly/`SameSite=Lax`/`Secure` em produção, TTL 7 dias com renovação deslizante).
5. [x] `backend/src/middleware/investorAuth.ts` — `exigirInvestidor`, decora `request.investorId`; passado como `preHandler` **por rota** (não `app.addHook` no plugin inteiro, diferente de `exigirGestor`, porque `imoveis.ts`/`marketplace.ts` misturam rotas públicas e privadas no mesmo arquivo).
6. [x] `backend/src/routes/auth.ts` — `POST /auth/otp/solicitar` (cooldown 60s/e-mail + rate-limit 5/min/IP via `@fastify/rate-limit`, novo dep), `POST /auth/otp/verificar`, `GET /auth/me`, `POST /auth/logout`. Registrado em `server.ts` junto com os plugins `@fastify/cookie` (novo dep) e `@fastify/rate-limit`.
7. [x] `backend/src/routes/investors.ts` (`POST /investors`) — exige `email` (schema zod), rejeita duplicado com `409 EMAIL_JA_CADASTRADO`, gera o segredo HOTP do investidor e autentica automaticamente (sessão emitida na mesma resposta 201). `GET /investors/:id/kyc` → `GET /kyc`, atrás de `exigirInvestidor`.
8. [x] `backend/src/routes/kyc.ts` (`POST /investors/:id/kyc` → `POST /kyc`) — atrás de `exigirInvestidor`, usa `request.investorId`.
9. [x] `backend/src/routes/imoveis.ts` (`POST /imoveis/:id/comprar`) — remove `investorId` do schema zod, atrás de `exigirInvestidor`.
10. [x] `backend/src/routes/marketplace.ts` — `GET /listagens` volta a ser sempre pública (sem `?investorId=`); novo `GET /listagens/minhas` (atrás de `exigirInvestidor`) para o frontend cruzar e marcar `criadaPeloUsuarioAtual` sem receber id do cliente. `POST /listagens`, `POST /listagens/:id/comprar`, `POST /listagens/:id/cancelar` — atrás de `exigirInvestidor`, sem `investorId` no payload.
11. [x] `backend/src/routes/portfolio.ts` — `GET /investors/:id/portfolio` → `GET /portfolio`, `POST /investors/:id/portfolio/claim` → `POST /portfolio/claim`, ambas atrás de `exigirInvestidor`.
12. [x] Testes: `backend/test/auth.routes.test.ts` (novo — solicitar/verificar HOTP, cooldown por e-mail, rate-limit por IP com `remoteAddress` simulado por teste, limite de tentativas, expiração, replay, reenvio invalida o código anterior, `GET /auth/me`, logout); `backend/test/{imoveis,marketplace,portfolio}.routes.test.ts` e `routes.test.ts` atualizados para simular login via cookie (`app.inject({..., cookies: {sid: token}})`, token obtido de `criarSessao()` direto ou do `Set-Cookie` de `POST /investors`); `backend/test/{admin,webhooks,kycWebhookService,yieldClaimJob}.routes.test.ts` com a fixture `createInvestor()` atualizada (`email`, `otpSecretEnc` agora obrigatórios no schema); os três `*-flow.e2e.test.ts` (gated `RUN_E2E=1`) atualizados para o novo fluxo de cookie. 62/66 testes passam localmente (os 4 restantes são os cenários `RUN_E2E=1`, que exigem Anvil rodando — não executados nesta verificação).
