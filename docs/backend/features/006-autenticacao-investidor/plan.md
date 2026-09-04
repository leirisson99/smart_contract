---
status: approved
owner: tech-lead
last_updated: 2026-09-04
---

# Plano Técnico — Feature Backend 006

## Componentes

| Componente | Camada | Responsabilidade |
|---|---|---|
| `services/hotp.ts` | Off-chain | Geração/verificação do código HOTP (RFC 4226), fina camada sobre `otplib` |
| `services/mailer.ts` | Off-chain | Envio do código por SMTP (`nodemailer`); fallback de log quando SMTP não está configurado (dev/test) |
| `services/investorSession.ts` | Off-chain | Criação/validação/revogação de sessão (token opaco, cookie httpOnly) |
| `middleware/investorAuth.ts` | Off-chain | `preHandler exigirInvestidor` — decora `request.investorId` a partir do cookie de sessão |
| `routes/auth.ts` | Off-chain | Endpoints `POST /auth/otp/solicitar`, `POST /auth/otp/verificar`, `GET /auth/me`, `POST /auth/logout` |
| Proxy de investidor (frontend) | Off-chain | `frontend/app/api/investor/[...path]/route.ts` — repassa cookie same-origin entre browser e backend |

## Decisão: HOTP + sessão opaca + proxy same-origin

Quatro decisões arquiteturais, cada uma com alternativas descartadas:

### 1. Algoritmo do código: HOTP (RFC 4226), não TOTP nem código aleatório genérico

| Alternativa | Prós | Contras | Motivo da rejeição |
|---|---|---|---|
| Código aleatório + hash (ex. `randomBytes` + HMAC-SHA256 armazenado) | Simples, sem dependência nova | Reinventa uma primitiva já padronizada; cada solicitação é uma linha de histórico a gerenciar (expiração, limpeza) | Descartado — HOTP dá a mesma garantia com uma primitiva auditada e sem precisar guardar o código (só segredo + contador) |
| TOTP (RFC 6238, baseado em tempo) | Padrão para apps autenticadores, expira sozinho | Pensado para o *cliente* computar o código independentemente (app autenticador) sem transmissão — não é o caso aqui, o próprio servidor gera e envia por e-mail; exigiria sincronismo de relógio | Descartado a pedido explícito — o requisito era HOTP |
| HOTP (escolhido) | Primitiva padronizada (RFC 4226), servidor gera e verifica o mesmo desafio (sem necessidade de janela de tolerância de contador), via `otplib` (evita reimplementar o truncamento dinâmico do RFC à mão) | Não expira sozinho — precisa de um timestamp de validade a nível de aplicação, combinado por cima | — |

O segredo HOTP (`Investor.otpSecretEnc`) é cifrado em repouso reaproveitando `encryptSecret`/`decryptSecret` de `walletCustody.ts` (mesmo mecanismo já usado para CPF e chave privada da wallet custodial) — o servidor precisa lê-lo de volta a cada verificação, diferente de um código aleatório (que poderia só ser hasheado, já que nunca precisaria ser lido de volta).

### 2. Sessão: token opaco em cookie httpOnly, não JWT

| Alternativa | Prós | Contras | Motivo da rejeição |
|---|---|---|---|
| JWT autocontido | Sem consulta ao banco para validar | Não é revogável de verdade sem uma denylist (que anula a vantagem de ser stateless) — logout real e "derrubar todas as sessões" exigiriam o mesmo estado que um token opaco já tem | Descartado — não há ganho de performance relevante nesta escala (POC) que justifique perder revogação de verdade |
| Token opaco (escolhido) | Revogável de verdade (`InvestorSession.revokedAt`), só o hash (sha256) fica no banco — vazamento do banco não permite forjar sessão | Uma consulta ao banco por chamada autenticada | — |

### 3. Cookie cross-origin: proxy same-origin no Next.js, não CORS direto

| Alternativa | Prós | Contras | Motivo da rejeição |
|---|---|---|---|
| CORS direto (`credentials:true`, `SameSite=Lax`/`None`) | Sem proxy adicional, `fetch` direto do browser pro backend | Funciona em dev (mesmo host `localhost`, portas diferentes = same-site), mas degrada em produção se frontend/backend acabarem em domínios de registro diferentes — cookie vira third-party de fato, alvo do bloqueio que Safari já aplica e Chrome vem endurecendo | Descartado — mesma classe de problema que motivou o proxy admin (`SEC-B01`) |
| Proxy same-origin (escolhido) | Cookie nunca é, do ponto de vista do browser, de outra origem — imune à topologia de produção | Refactor do cliente HTTP do frontend (`apiGetInvestidor`/`apiPostInvestidor`) | — |

Generaliza o padrão já validado em `frontend/app/api/admin/[...path]/route.ts` (criado para não expor `x-admin-api-key` ao browser) para `frontend/app/api/investor/[...path]/route.ts`, repassando `Cookie` na ida e `Set-Cookie` (via `getSetCookie()`, preserva múltiplos cookies) na volta.

### 4. Shape das rotas: remove `:id`, não mantém + valida contra a sessão

| Alternativa | Prós | Contras | Motivo da rejeição |
|---|---|---|---|
| Manter `:id`/`investorId` no payload, validar que bate com a sessão | Não muda o shape da URL/payload | A checagem "bate com a sessão?" é uma linha que uma rota nova pode esquecer de escrever — a classe de bug (IDOR) continua existindo como superfície viva | Descartado |
| Remover o `:id`/`investorId` (escolhido) | Sem `:id` na URL, não existe id para divergir — a classe de bug desaparece, não só uma instância dela | Muda o shape de `/investors/:id/portfolio` → `/portfolio`, `/investors/:id/kyc` → `/kyc`, etc. (quebra de contrato aceitável — único consumidor é o frontend deste repo) | — |

## Fluxo ponta a ponta

Cadastro (`POST /investors`, e-mail agora obrigatório) → backend gera o segredo HOTP do investidor, cria a sessão e responde `201` com `Set-Cookie: sid=...` → frontend já está autenticado, sem passo de login adicional → submissão de KYC (`POST /kyc`) usa a mesma sessão. Investidor que volta depois: `POST /auth/otp/solicitar {email}` → backend avança o contador HOTP, calcula o código, envia por e-mail (ou loga, se SMTP não configurado) → `POST /auth/otp/verificar {email, codigo}` → sessão nova. Toda rota de `001`-`004` usa `preHandler: exigirInvestidor`, que decora `request.investorId` a partir do cookie — nenhuma delas mais lê `investorId` de body/query/`:id`. Ver tabela de cenários em `spec.md`.

## Dependências
- Depende de [001-onboarding-e-custodia](../../../plan.md) (o `Investor` já existe; esta feature adiciona `email`/estado de OTP a ele).
- Reendurece as rotas de [002-investimento-primario](../002-investimento-primario/spec.md), [003-portfolio-e-rendimentos](../003-portfolio-e-rendimentos/spec.md) e [004-mercado-secundario](../004-mercado-secundario/spec.md) — ver `implement.md` para o mapa rota a rota.
- É consumida por `../../../frontend/features/001-interface-investidor` (tela `/entrar`, guarda de rota, todos os call sites que hoje mandavam `investorId` explícito).
