---
status: approved
owner: tech-lead
last_updated: 2026-09-04
---

# Feature Backend 006 — Autenticação do Investidor

Origem: fechamento de `SEC-B02` ([`../../security-checklist.md`](../../security-checklist.md)), dívida aceita na Sprint 8 ([`../../../sprints/08-painel-administrativo-e-seguranca-backend.md`](../../../sprints/08-painel-administrativo-e-seguranca-backend.md)) junto com a introdução do RBAC administrativo (`005-painel-administrativo`). Depende de [001-onboarding-e-custodia](../001-onboarding-e-custodia/spec.md) (o `Investor` já existe, esta feature adiciona `email` e o estado de login a ele).

## Objetivo

Substituir o "login" fake do investidor — `investorId` guardado em `localStorage` no navegador e reenviado explicitamente em cada chamada (`001`-`004`) — por sessão real, autenticada, derivada no servidor. Fecha dois problemas distintos:
1. **Segurança**: nenhuma rota de investidor verificava que quem chamava era de fato aquele investidor — só as rotas que movem fundos on-chain eram protegidas de fato, por revalidação on-chain (RNF-16, `SEC-B03`); leitura de portfólio e criação de listagem, não.
2. **Perda de acesso**: sem sessão real, um investidor que limpasse os dados do navegador, trocasse de dispositivo ou usasse outro navegador ficava permanentemente sem conseguir entrar na própria conta — não havia login nem recuperação.

## Personas
- **Investidor**: se cadastra e já sai autenticado; se voltar depois (mesmo dispositivo ou não), pede um código por e-mail e entra.

## Requisitos funcionais

| ID | Requisito |
|---|---|
| RF-36 | `POST /investors` (cadastro, 001) passa a exigir `email` (único) e, na mesma resposta, emitir uma sessão (cookie httpOnly) — o investidor sai do cadastro já autenticado, sem precisar de um passo de login separado antes de submeter o KYC. |
| RF-37 | O backend deve expor um login sem senha para quem já tem cadastro: `POST /auth/otp/solicitar` (pede um código de acesso por e-mail) e `POST /auth/otp/verificar` (verifica o código e emite a sessão). O código é gerado por HOTP (RFC 4226, contador) — decisão registrada em `plan.md` e [`../../../on-chain/decisions/ADR-0007-sessao-otp-investidor.md`](../../../on-chain/decisions/ADR-0007-sessao-otp-investidor.md) — não senha nem 2FA completo: posse da caixa de e-mail cadastrada é o único fator. |
| RF-38 | A sessão deve ser revogável (`POST /auth/logout`) e consultável pelo frontend (`GET /auth/me`), via cookie `sid` httpOnly — nunca lido pelo JavaScript do client. |
| RF-39 | Toda rota de investidor das features `001`-`004` deve derivar o `investorId` da sessão (via um `preHandler` compartilhado), nunca de um campo enviado pelo cliente (body/query/`:id` na URL) — fecha `SEC-B02` por completo, não só troca o mecanismo de "lembrar quem é o investidor". |

### Contrato de API
- `POST /auth/otp/solicitar` — pede o código de acesso.
- `POST /auth/otp/verificar` — verifica o código, emite a sessão.
- `GET /auth/me` — sessão atual (ou `SESSAO_INVALIDA`).
- `POST /auth/logout` — revoga a sessão.
- `POST /investors` (001, alterado) — agora exige `email`, autentica automaticamente.
- Rotas de `002`-`004` (alteradas) — deixam de aceitar `investorId` explícito; algumas mudam de shape de URL (ver `implement.md`).

Payloads, formato de erro e o vocabulário completo de códigos ficam em [`../../api-contract.md`](../../api-contract.md).

## Requisitos não funcionais
- **Sem senha, sem 2FA completo**: decisão explícita de escopo — evita hash/política/recuperação de senha numa POC. O código HOTP é o único fator.
- **RNF-16 continua válido**: a sessão resolve *quem está chamando*, não substitui a revalidação on-chain de KYC/saldo/role — que continua sendo a última linha de defesa (`SEC-B03`).
- **Cookie same-origin**: o cookie de sessão nunca é exposto a uma chamada cross-origin direta do browser — todo tráfego autenticado do frontend passa por um proxy server-side no Next.js (mesmo padrão que corrigiu o vazamento de `SEC-B01`), evitando problemas de cookie third-party em topologias de produção com front/back em domínios de registro diferentes.
- **Anti-enumeração**: `POST /auth/otp/solicitar` responde `202` de forma idêntica exista ou não o e-mail — não revela quais e-mails têm cadastro.
- **Rate limiting**: cooldown de 60s por e-mail entre solicitações + limite de 5/min por IP, contra abuso de envio.

## Cenários de aceite

| Cenário | Dado | Quando | Então |
|---|---|---|---|
| Cadastro autentica | Investidor preenche o formulário de cadastro | `POST /investors` é chamado com `email` válido e não usado | Backend cria o investidor, responde `201` com `Set-Cookie` de uma sessão nova — nenhum passo de login adicional necessário |
| E-mail duplicado | E-mail já usado por outro investidor | `POST /investors` é chamado com esse e-mail | Backend rejeita com `409 EMAIL_JA_CADASTRADO` |
| Login por código | Investidor com cadastro existente | Pede o código (`solicitar`) e o informa corretamente (`verificar`) dentro da janela de validade | Backend emite uma sessão nova (`Set-Cookie`) |
| Código errado | Investidor informa um código incorreto | `POST /auth/otp/verificar` | Backend rejeita com `401 CODIGO_INVALIDO`, incrementa o contador de tentativas |
| Muitas tentativas erradas | Investidor erra o código 5 vezes seguidas | Uma 6ª tentativa, mesmo com o código certo | Backend rejeita com `429 LIMITE_TENTATIVAS_EXCEDIDO` — precisa pedir um código novo |
| Código expirado | Código pedido há mais de 5 minutos | `POST /auth/otp/verificar` | Backend rejeita com `401 CODIGO_EXPIRADO` |
| Reenvio invalida o anterior | Investidor pede um novo código antes de verificar o antigo | Tenta verificar com o código antigo | Backend rejeita com `401 CODIGO_INVALIDO` — só o código mais recente é válido |
| Ação sem sessão | Requisição a uma rota que exige investidor (ex. `POST /imoveis/:id/comprar`) sem cookie `sid` válido | Backend recebe a chamada | Backend rejeita com `401 SESSAO_INVALIDA`, sem consultar nenhum dado do payload |
| Logout | Investidor autenticado | Chama `POST /auth/logout` | Sessão é revogada; chamadas seguintes com o mesmo cookie voltam a `401 SESSAO_INVALIDA` |

## Fora de escopo desta feature
- Senha e recuperação de senha — decisão explícita de manter o login sem senha (só o código por e-mail).
- Autenticação do gestor/painel administrativo — já coberta por `005-painel-administrativo` (`SEC-B01`), mecanismo separado (chave estática).
- Provedor real de envio de e-mail transacional (SendGrid/Resend/etc.) — usa SMTP genérico (`nodemailer`), qualquer conta serve; escolha de provedor é decisão de negócio/operação, fora do escopo de código.
- Recuperação de conta por outro canal (SMS, pergunta de segurança) — só e-mail.
