---
status: approved
owner: tech-lead
last_updated: 2026-09-04
---

# Contrato de API — Backend

> Consolida, num único lugar, os endpoints e o vocabulário de erro que as 5 features de backend (`docs/backend/features/001-005`) expõem — destrava a task 5 de [001-onboarding-e-custodia](features/001-onboarding-e-custodia/tasks.md) e evita que cada spec reinvente o formato. O vocabulário de erro abaixo já é consumido pelo frontend mockado (`frontend/lib/errors.ts`, RF-32) — qualquer endpoint real deve responder exatamente com esses códigos.

## Formato de erro

Toda resposta de erro de negócio (4xx) deve ter o corpo:

```json
{ "codigo": "SEM_KYC" }
```

`codigo` é um dos valores abaixo (`CodigoErro` em `frontend/lib/errors.ts`). Erros inesperados (5xx, infraestrutura) usam `ERRO_DESCONHECIDO`.

| Código | Mensagem exibida ao investidor (pt-BR) | Quando ocorre |
|---|---|---|
| `SEM_KYC` | "Sua verificação de identidade precisa ser concluída antes de investir." | Endpoint de negócio chamado por carteira sem `isVerified` (001, 002, 004) |
| `KYC_REPROVADO` | "Sua verificação de identidade não foi aprovada. Entre em contato com o suporte." | Consulta de status de KYC reprovado (001) |
| `COTAS_INSUFICIENTES` | "Não há cotas suficientes disponíveis para essa quantidade." | Compra primária além de `cotasRestantes` (002) |
| `VALOR_MINIMO_NAO_ATINGIDO` | "A quantidade escolhida está abaixo do investimento mínimo." | Compra primária abaixo de `valorMinimoInvestimento` (002) |
| `LISTAGEM_JA_VENDIDA` | "Essa listagem já foi vendida para outro investidor." | Compra no mercado secundário sobre listagem já `vendida`/`cancelada` (004) |
| `LISTAGEM_NAO_ENCONTRADA` | "Essa listagem não está mais disponível." | Compra/cancelamento sobre `id` inexistente (004) |
| `SALDO_INSUFICIENTE` | "Você não possui cotas suficientes para criar essa listagem." | Criação de listagem além do holding do investidor (004) |
| `ROLE_INVALIDA` | "Acesso restrito ao gestor da plataforma." | Chamada a qualquer rota `/admin/*` sem o header `x-admin-api-key` válido (005) |
| `ERRO_DESCONHECIDO` | "Não foi possível concluir a ação. Tente novamente em instantes." | Qualquer falha não mapeada (timeout de RPC, erro de infraestrutura) |
| `EMAIL_INVALIDO` | "Informe um e-mail válido." | `POST /investors`/`POST /auth/otp/solicitar` com e-mail malformado (006) |
| `EMAIL_JA_CADASTRADO` | "Já existe um cadastro com esse e-mail. Faça login em vez de se cadastrar novamente." | `POST /investors` com e-mail já usado por outro investidor (006) |
| `CODIGO_INVALIDO` | "Código incorreto. Confira o e-mail e tente novamente." | `POST /auth/otp/verificar` com código que não bate com o HOTP esperado, ou já consumido (006) |
| `CODIGO_EXPIRADO` | "Esse código expirou. Solicite um novo." | `POST /auth/otp/verificar` após a janela de validade do código (5 min, 006) |
| `LIMITE_SOLICITACOES_EXCEDIDO` | "Aguarde um minuto antes de pedir um novo código." | `POST /auth/otp/solicitar` antes do cooldown de 60s por e-mail, ou acima do limite de 5/min por IP (006) |
| `LIMITE_TENTATIVAS_EXCEDIDO` | "Muitas tentativas incorretas. Solicite um novo código." | `POST /auth/otp/verificar` após 5 tentativas erradas seguidas para o mesmo código (006) |
| `SESSAO_INVALIDA` | "Sua sessão expirou. Faça login novamente." | Qualquer rota que exija sessão (`preHandler: exigirInvestidor`) sem cookie `sid` válido (006) |

## Endpoints por feature

### 001 — Onboarding e Custódia ([spec](features/001-onboarding-e-custodia/spec.md))
| Endpoint | Payload de entrada | Retorno (sucesso) | Erros possíveis |
|---|---|---|---|
| `POST /investors` | `{ fullName, email, cpf }` | `201`, `{ investorId, walletAddress }` + `Set-Cookie: sid=...` (autentica automaticamente, ver 006) | `EMAIL_JA_CADASTRADO`, `ERRO_DESCONHECIDO` |
| `GET /kyc` | — (via cookie `sid`) | `{ statusKyc }` | `SESSAO_INVALIDA`, `ERRO_DESCONHECIDO` |
| `POST /kyc` | `multipart/form-data` (documentos), via cookie `sid` | `202 Accepted` | `SESSAO_INVALIDA`, `409` se já houver submissão `PENDING`/`PROCESSING`/`APPROVED` |
| `POST /webhooks/kyc/mock` | payload do provedor (`providerReference`, resultado) | `200 OK` (idempotente) | — |

### 002 — Investimento Primário ([spec](features/002-investimento-primario/spec.md))
| Endpoint | Payload de entrada | Retorno (sucesso) | Erros possíveis |
|---|---|---|---|
| `GET /imoveis` | — | `Imovel[]` | — |
| `GET /imoveis/:id` | — | `Imovel \| null` | — |
| `POST /imoveis/:id/comprar` | `{ quantidade }`, via cookie `sid` | `200 OK` | `SESSAO_INVALIDA`, `SEM_KYC`, `COTAS_INSUFICIENTES`, `VALOR_MINIMO_NAO_ATINGIDO` |

### 003 — Portfólio e Rendimentos ([spec](features/003-portfolio-e-rendimentos/spec.md))
| Endpoint | Payload de entrada | Retorno (sucesso) | Erros possíveis |
|---|---|---|---|
| `GET /portfolio` | — (via cookie `sid`) | `Portfolio { holdings[], valorTotalInvestido, rendimentosRecebidos[], rendimentoPendenteClaim }` | `SESSAO_INVALIDA` |
| `POST /portfolio/claim` | — (via cookie `sid`) | `{ claimsExecutados }` | `SESSAO_INVALIDA`, `ERRO_DESCONHECIDO` |

O `claim` automático (RF-24) é um job periódico, não um endpoint chamado pelo frontend — `POST /portfolio/claim` é o claim manual disparado pelo próprio investidor.

### 004 — Mercado Secundário ([spec](features/004-mercado-secundario/spec.md))
| Endpoint | Payload de entrada | Retorno (sucesso) | Erros possíveis |
|---|---|---|---|
| `GET /listagens` | — (pública, sem `criadaPeloUsuarioAtual`) | `Listagem[]` (só `status: "ativa"`) | — |
| `GET /listagens/minhas` | — (via cookie `sid`) | `Listagem[]` só do investidor autenticado (`criadaPeloUsuarioAtual: true` em todas) | `SESSAO_INVALIDA` |
| `POST /listagens` | `{ imovelId, cotas, precoPorCota }` (`precoPorCota` em wei, 18 casas — mesma unidade de `Imovel.precoPorCota`), via cookie `sid` | `Listagem` criada | `SESSAO_INVALIDA`, `SALDO_INSUFICIENTE` |
| `POST /listagens/:id/comprar` | — (via cookie `sid`) | `200 OK` | `SESSAO_INVALIDA`, `SEM_KYC`, `LISTAGEM_JA_VENDIDA`, `LISTAGEM_NAO_ENCONTRADA` |
| `POST /listagens/:id/cancelar` | — (via cookie `sid`) | `200 OK` | `SESSAO_INVALIDA`, `LISTAGEM_NAO_ENCONTRADA` |

`comprar` sempre adquire a quantidade total disponível da listagem (sem compra parcial — mesmo comportamento do mock que o frontend tinha antes desta feature). Desde a feature 006, o identificador do investidor nunca mais vem do payload/query — o frontend cruza `GET /listagens` (pública) com `GET /listagens/minhas` (autenticada) para marcar `criadaPeloUsuarioAtual` sem depender de um id vindo do cliente.

### 005 — Painel Administrativo ([spec](features/005-painel-administrativo/spec.md))

| Endpoint | Payload de entrada | Retorno (sucesso) | Erros possíveis |
|---|---|---|---|
| `GET /admin/investidores` | — (header `x-admin-api-key`) | `{ id, nome, walletAddress, statusKyc }[]` | `403 ROLE_INVALIDA` |
| `POST /admin/imoveis` | `{ nome, imagemUrl?, valorTotal (wei), totalCotas, rendimentoEstimadoAnual }` | `Imovel` criado (mesmo formato de `GET /imoveis`) | `403 ROLE_INVALIDA`; `400` se `valorTotal` não for divisível por `totalCotas` |
| `POST /admin/imoveis/:id/depositar-rendimento` | `{ valor (wei) }` | `{ idCiclo, txHash }` | `403 ROLE_INVALIDA`; `404` se imóvel não existir |

Todas as rotas `/admin/*` exigem o header `x-admin-api-key` (feature 005 — único mecanismo de autenticação administrativa do backend, decisão em [`features/005-painel-administrativo/plan.md`](features/005-painel-administrativo/plan.md)). `statusKyc` retorna o enum bruto do backend (`PENDING`/`PROCESSING`/`APPROVED`/`REJECTED`, sem submissão = `PENDING`), traduzido pelo frontend como em `GET /kyc`.

### 006 — Autenticação do Investidor ([spec](features/006-autenticacao-investidor/spec.md))

| Endpoint | Payload de entrada | Retorno (sucesso) | Erros possíveis |
|---|---|---|---|
| `POST /auth/otp/solicitar` | `{ email }` | `202`, `{ ok: true }` (idêntico mesmo se o e-mail não existir — anti-enumeração) | `EMAIL_INVALIDO`, `LIMITE_SOLICITACOES_EXCEDIDO` |
| `POST /auth/otp/verificar` | `{ email, codigo }` | `200`, `{ investorId, fullName, email, statusKyc }` + `Set-Cookie: sid=...` | `CODIGO_INVALIDO`, `CODIGO_EXPIRADO`, `LIMITE_TENTATIVAS_EXCEDIDO` |
| `GET /auth/me` | — (via cookie `sid`) | `{ investorId, fullName, email, statusKyc, walletAddress }` | `SESSAO_INVALIDA` (resposta esperada de visitante deslogado, não deve virar alerta de erro no frontend) |
| `POST /auth/logout` | — | `200`, `{ ok: true }` (idempotente mesmo sem sessão) | — |

Cookie `sid`: httpOnly, `SameSite=Lax`, `Secure` fora de dev, TTL de 7 dias com renovação deslizante. Nunca lido pelo JS do client — o frontend descobre se está autenticado chamando `GET /auth/me` através do proxy same-origin (`frontend/app/api/investor/[...path]/route.ts`), nunca inspecionando o cookie diretamente. Decisão completa (HOTP vs TOTP vs código aleatório, sessão opaca vs JWT, proxy vs CORS direto) em [`features/006-autenticacao-investidor/plan.md`](features/006-autenticacao-investidor/plan.md) e [`../on-chain/decisions/ADR-0007-sessao-otp-investidor.md`](../on-chain/decisions/ADR-0007-sessao-otp-investidor.md).

## Gap conhecido (2026-09-04)

O código real de 001 (`backend/src/routes/{investors,kyc,webhooks}.ts`) ainda retorna alguns erros como strings livres (`{ error: "investidor nao encontrado" }`) em vez do formato `codigo` — permanece como dívida técnica. Os endpoints de 002/003/004/005 seguem o vocabulário `codigo` para os cenários RNF-16/de negócio; erros de "recurso não encontrado" (imóvel/listagem inexistente, ou listagem que não pertence ao investidor) e de validação de payload usam mensagens livres, por não terem código próprio nesta lista.

**Fechado em 2026-09-04**: as rotas de `001`-`004` (investidor) agora exigem sessão (cookie `sid`, feature 006) e derivam a identidade do investidor dela, nunca mais de um campo confiado do payload/query/URL — fecha `SEC-B02` (ver `security-checklist.md`). O gap era rastreado aqui desde a Sprint 8; ver histórico em [`PENDENCIAS.md`](../PENDENCIAS.md#resolvidas).
