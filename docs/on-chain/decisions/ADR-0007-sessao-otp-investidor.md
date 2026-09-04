---
status: approved
last_updated: 2026-09-04
---

# ADR-0007: Login sem senha (HOTP) + sessão opaca para o investidor

## Status
approved

## Contexto
O backend nunca teve autenticação/sessão para as rotas do investidor (`001`-`004`): o frontend guardava o `investorId` retornado pelo cadastro em `localStorage` e reenviava explicitamente em cada chamada (body/query/`:id` na URL), sem nenhuma verificação de que quem chamava era de fato aquele investidor. Isso foi avaliado e aceito como dívida da POC na Sprint 8 (`SEC-B02` em [`../../backend/security-checklist.md`](../../backend/security-checklist.md)), com o argumento de que o risco prático era baixo porque toda ação que move fundos revalida KYC/saldo on-chain no momento da chamada (RNF-16, `SEC-B03`) e nenhuma feature de frontend previa tela de login.

Essa decisão tinha uma lacuna não coberta pelo argumento de segurança: sem sessão real, um investidor que limpasse os dados do navegador, trocasse de dispositivo ou usasse outro navegador ficava **permanentemente sem conseguir entrar na própria conta** — não é só um risco de segurança residual, é uma falha de produto (perda de acesso). Essa lacuna, discutida fora do fluxo normal de sprint, motivou reabrir `SEC-B02` como uma decisão arquitetural formal em vez de deixá-la como dívida aceita indefinidamente.

Decisão de escopo explícita: **sem senha, sem 2FA completo** — só um código de acesso por e-mail (posse da caixa de e-mail cadastrada é o único fator), para não introduzir hash/política/recuperação de senha numa POC.

## Decisão
- **Algoritmo do código: HOTP** (RFC 4226, contador), via `otplib` — não um código aleatório genérico nem TOTP. O servidor gera e verifica o mesmo desafio (nunca um cliente independente, como um app autenticador), então não há necessidade de janela de tolerância de contador nem de sincronismo de relógio (que TOTP exigiria). O segredo por investidor é cifrado em repouso reaproveitando `encryptSecret`/`decryptSecret` (`walletCustody.ts`, já usado para CPF e chave privada da wallet custodial).
- **Sessão: token opaco de 256 bits em cookie httpOnly**, não JWT — só o hash (sha256) fica no banco (`InvestorSession.tokenHash`), revogável de verdade (`revokedAt`, logout real).
- **Cookie sempre same-origin via proxy no Next.js** (`frontend/app/api/investor/[...path]/route.ts`, generaliza o padrão já usado pelo proxy admin que fechou `SEC-B01`) — não CORS direto com `credentials:true`. Evita depender de `SameSite=None`/cookie third-party, que degrada em produção se frontend e backend acabarem em domínios de registro diferentes.
- **Toda rota de `001`-`004` deriva o `investorId` da sessão** (`preHandler exigirInvestidor`), não mais de um campo enviado pelo cliente — algumas mudaram de shape de URL para isso (`/investors/:id/portfolio` → `/portfolio`, etc.), removendo o `:id`/`investorId` em vez de só validá-lo contra a sessão, para que a classe de bug (IDOR) não fique como superfície viva.
- **Cadastro (`POST /investors`) passa a exigir `email` e autentica automaticamente** — a sessão é emitida na própria resposta 201, sem exigir um passo de OTP nesse primeiro acesso. HOTP fica só para o retorno de quem já tem conta.

## Alternativas consideradas

| Alternativa | Prós | Contras | Motivo da rejeição |
|---|---|---|---|
| Manter a dívida aceita (`investorId` explícito) | Zero esforço | Não resolve a perda de acesso; SEC-B02 continua em aberto | Rejeitada — a lacuna de produto (não só de segurança) tornou a dívida insustentável |
| E-mail + senha (com HOTP como 2º fator) | Mais próximo do padrão de mercado de 2FA | Exige hash de senha, política mínima e fluxo de recuperação de senha — escopo bem maior para uma POC | Rejeitada — decisão explícita de manter só um fator (posse do e-mail) |
| Código aleatório + hash, sem HOTP | Simples | Reinventa uma primitiva já padronizada; cada solicitação vira uma linha de histórico a gerenciar | Rejeitada — HOTP dá a mesma garantia com uma primitiva auditada (RFC 4226) e sem precisar guardar o código |
| JWT autocontido | Sem consulta ao banco para validar | Não é revogável de verdade sem uma denylist, que anula a vantagem de ser stateless | Rejeitada — sem ganho de performance relevante na escala da POC que justifique perder revogação real |
| CORS direto (`credentials:true`) em vez de proxy | Sem proxy adicional | Cookie vira third-party de fato se front/back ficarem em domínios de registro diferentes em produção | Rejeitada — mesma classe de problema que motivou o proxy admin (`SEC-B01`) |

## Consequências
- Positivas: fecha `SEC-B02` por completo (não só reduz o risco); resolve a perda de acesso que a dívida aceita original não cobria; estabelece o padrão de proxy same-origin como a forma canônica de qualquer chamada autenticada do frontend investidor daqui pra frente.
- Negativas / trade-offs aceitos: sem 2FA completo (aceito — decisão de escopo, não de limitação técnica); sem provedor de e-mail transacional real configurado por padrão (SMTP genérico via `nodemailer`, com fallback de log em dev/test — escolha de provedor é decisão de operação, fora do escopo desta ADR); mudança de contrato quebradora em várias rotas de `002`-`004` (aceitável, único consumidor é o frontend deste repo).
- Impacto em specs de feature relacionadas: [`../../backend/features/006-autenticacao-investidor`](../../backend/features/006-autenticacao-investidor/spec.md) (feature nova), [`../../backend/features/001-onboarding-e-custodia`](../../backend/features/001-onboarding-e-custodia/spec.md) (cadastro exige `email`), [`002`](../../backend/features/002-investimento-primario/spec.md)/[`003`](../../backend/features/003-portfolio-e-rendimentos/spec.md)/[`004`](../../backend/features/004-mercado-secundario/spec.md) (rotas endurecidas), [`../../frontend/features/001-interface-investidor`](../../frontend/features/001-interface-investidor/spec.md) (tela `/entrar`, guarda de rota, proxy).
