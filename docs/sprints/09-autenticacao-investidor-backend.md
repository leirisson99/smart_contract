---
status: done
owner: tech-lead
last_updated: 2026-09-04
---

# Sprint 9 — Autenticação do Investidor

## Objetivo
Fechar `SEC-B02` (ausência de autenticação/sessão nas rotas do investidor, `001`-`004`), reaberto como decisão arquitetural formal em vez de mantido como dívida aceita da Sprint 8 — a dívida original cobria só o risco de segurança (mitigado na prática por RNF-16), mas não a perda de acesso: sem sessão real, um investidor que limpava os dados do navegador ou trocava de dispositivo ficava permanentemente sem conseguir entrar na própria conta. Depende só de `001-onboarding-e-custodia` (o `Investor` já existe); não depende de `005` (RBAC administrativo é um mecanismo separado, chave estática, sem relação com esta sprint).

## Backlog
Referência: [`../backend/features/006-autenticacao-investidor/tasks.md`](../backend/features/006-autenticacao-investidor/tasks.md).

- [x] **Login sem senha via código HOTP** (RFC 4226, `otplib`) — decisão registrada em [`006/plan.md`](../backend/features/006-autenticacao-investidor/plan.md) e [`../on-chain/decisions/ADR-0007-sessao-otp-investidor.md`](../on-chain/decisions/ADR-0007-sessao-otp-investidor.md): `POST /auth/otp/solicitar` + `POST /auth/otp/verificar`, com cooldown de 60s/e-mail e limite de 5/min/IP.
- [x] **Sessão real** — token opaco de 256 bits em cookie httpOnly (`InvestorSession`, hash sha256, revogável), `GET /auth/me` + `POST /auth/logout`.
- [x] **Cadastro autentica automaticamente** — `POST /investors` passa a exigir `email` (único) e emite a sessão na própria resposta 201.
- [x] **Endurecimento das rotas `001`-`004`** — toda rota de investidor passa a derivar `investorId` da sessão (`preHandler exigirInvestidor`, `backend/src/middleware/investorAuth.ts`), nunca mais de um campo confiado do payload/query/URL. Algumas mudaram de shape (`/investors/:id/portfolio` → `/portfolio`, `/investors/:id/kyc` → `/kyc`, `GET /listagens?investorId=` → `GET /listagens` pública + `GET /listagens/minhas`).
- [x] **Cookie same-origin via proxy no Next.js** — `frontend/app/api/investor/[...path]/route.ts`, generaliza o padrão do proxy admin (`SEC-B01`) para evitar cookie cross-site em produção.
- [x] **Frontend**: tela `/entrar` (2 passos, e-mail → código), guarda de rota (`frontend/middleware.ts`, `/portfolio`), link Entrar/Sair na navegação, `frontend/lib/api/session.ts` (localStorage fake) removido.
- [x] Alinhar respostas de erro ao vocabulário de [`../backend/api-contract.md`](../backend/api-contract.md) — novos códigos `EMAIL_INVALIDO`, `EMAIL_JA_CADASTRADO`, `CODIGO_INVALIDO`, `CODIGO_EXPIRADO`, `LIMITE_SOLICITACOES_EXCEDIDO`, `LIMITE_TENTATIVAS_EXCEDIDO`, `SESSAO_INVALIDA`.
- [x] Testes de integração — `backend/test/auth.routes.test.ts` (novo, 12 cenários) + `imoveis`/`marketplace`/`portfolio`/`routes` atualizados para simular login via cookie. Verificação manual ponta a ponta no browser (cadastro → autenticado → logout → guarda de rota redireciona → login por código → autenticado de novo).

## Dependências / bloqueios
- Depende de [001-onboarding-e-custodia](../backend/features/001-onboarding-e-custodia/spec.md) (o `Investor` já existe).
- Não depende de `005-painel-administrativo` — mecanismo de autenticação separado (chave estática vs. sessão de investidor).

## Marco de saída
Login sem senha (código HOTP por e-mail) funcionando ponta a ponta, com sessão real via cookie httpOnly revogável, e todas as rotas de investidor (`001`-`004`) derivando a identidade da sessão em vez de um campo confiado do cliente. `SEC-B02` passa de `risco aceito` para `mitigado` (5/9 itens do checklist off-chain agora `mitigado`, 0/9 `risco aceito`) — ver [`../backend/security-checklist.md`](../backend/security-checklist.md). Fecha também a lacuna de perda de acesso que a dívida original da Sprint 8 não cobria.
