---
status: approved
owner: tech-lead
last_updated: 2026-09-02
---

# Contrato de API — Backend

> Consolida, num único lugar, os endpoints e o vocabulário de erro que as 5 features de backend (`docs/backend/features/001-005`) expõem — destrava a task 5 de [001-onboarding-e-custodia](features/001-onboarding-e-custodia/tasks.md) e evita que cada spec reinvente o formato. O vocabulário de erro abaixo já é consumido pelo frontend mockado (`frontend/lib/errors.ts`, RF-32) — qualquer endpoint real deve responder exatamente com esses códigos.

## Formato de erro

Toda resposta de erro de negócio (4xx) deve ter o corpo:

```json
{ "codigo": "SEM_KYC" }
```

`codigo` é um dos 9 valores abaixo (`CodigoErro` em `frontend/lib/errors.ts`). Erros inesperados (5xx, infraestrutura) usam `ERRO_DESCONHECIDO`.

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

## Endpoints por feature

### 001 — Onboarding e Custódia ([spec](features/001-onboarding-e-custodia/spec.md))
| Endpoint | Payload de entrada | Retorno (sucesso) | Erros possíveis |
|---|---|---|---|
| `POST /investors` | `{ nome, email, cpf }` | `Investidor { id, nome, email, statusKyc }` | `ERRO_DESCONHECIDO` |
| `GET /investors/:id/kyc` | — | `{ statusKyc }` | `ERRO_DESCONHECIDO` |
| `POST /investors/:id/kyc` | `multipart/form-data` (documentos) | `202 Accepted` | `409` se já houver submissão `PENDING`/`PROCESSING`/`APPROVED` |
| `POST /webhooks/kyc/mock` | payload do provedor (`providerReference`, resultado) | `200 OK` (idempotente) | — |

### 002 — Investimento Primário ([spec](features/002-investimento-primario/spec.md))
| Endpoint | Payload de entrada | Retorno (sucesso) | Erros possíveis |
|---|---|---|---|
| `GET /imoveis` | — | `Imovel[]` | — |
| `GET /imoveis/:id` | — | `Imovel \| null` | — |
| `POST /imoveis/:id/comprar` | `{ quantidade }` | `200 OK` | `SEM_KYC`, `COTAS_INSUFICIENTES`, `VALOR_MINIMO_NAO_ATINGIDO` |

### 003 — Portfólio e Rendimentos ([spec](features/003-portfolio-e-rendimentos/spec.md))
| Endpoint | Payload de entrada | Retorno (sucesso) | Erros possíveis |
|---|---|---|---|
| `GET /investors/:id/portfolio` | — | `Portfolio { holdings[], valorTotalInvestido, rendimentosRecebidos[], rendimentoPendenteClaim }` | — |

O `claim` automático (RF-24) é um job periódico, não um endpoint chamado pelo frontend.

### 004 — Mercado Secundário ([spec](features/004-mercado-secundario/spec.md))
| Endpoint | Payload de entrada | Retorno (sucesso) | Erros possíveis |
|---|---|---|---|
| `GET /listagens?investorId=` | — (`investorId` opcional, só para computar `criadaPeloUsuarioAtual`) | `Listagem[]` (só `status: "ativa"`) | — |
| `POST /listagens` | `{ investorId, imovelId, cotas, precoPorCota }` (`precoPorCota` em wei, 18 casas — mesma unidade de `Imovel.precoPorCota`) | `Listagem` criada | `SALDO_INSUFICIENTE` |
| `POST /listagens/:id/comprar` | `{ investorId }` | `200 OK` | `SEM_KYC`, `LISTAGEM_JA_VENDIDA`, `LISTAGEM_NAO_ENCONTRADA` |
| `POST /listagens/:id/cancelar` | `{ investorId }` | `200 OK` | `LISTAGEM_NAO_ENCONTRADA` |

`comprar` sempre adquire a quantidade total disponível da listagem (sem compra parcial — mesmo comportamento do mock que o frontend tinha antes desta feature). `investorId` é necessário nesses três endpoints porque não existe autenticação/sessão no backend (mesmo gap de 001) — diverge do payload originalmente desenhado nesta tabela antes da implementação (Sprint 7), que não previa `investorId` explícito.

### 005 — Painel Administrativo ([spec](features/005-painel-administrativo/spec.md))
| Endpoint | Payload de entrada | Retorno (sucesso) | Erros possíveis |
|---|---|---|---|
| `GET /admin/investidores` | — (header `x-admin-api-key`) | `{ id, nome, walletAddress, statusKyc }[]` | `403 ROLE_INVALIDA` |
| `POST /admin/imoveis` | `{ nome, imagemUrl?, valorTotal (wei), totalCotas, rendimentoEstimadoAnual }` | `Imovel` criado (mesmo formato de `GET /imoveis`) | `403 ROLE_INVALIDA`; `400` se `valorTotal` não for divisível por `totalCotas` |
| `POST /admin/imoveis/:id/depositar-rendimento` | `{ valor (wei) }` | `{ idCiclo, txHash }` | `403 ROLE_INVALIDA`; `404` se imóvel não existir |

Todas as rotas `/admin/*` exigem o header `x-admin-api-key` (feature 005 — único mecanismo de autenticação do backend hoje, decisão em [`features/005-painel-administrativo/plan.md`](features/005-painel-administrativo/plan.md)). `statusKyc` retorna o enum bruto do backend (`PENDING`/`PROCESSING`/`APPROVED`/`REJECTED`, sem submissão = `PENDING`), traduzido pelo frontend como em `GET /investors/:id/kyc`.

## Gap conhecido (2026-09-02)

O código real de 001 (`backend/src/routes/{investors,kyc,webhooks}.ts`) hoje retorna erros como strings livres (`{ error: "fullName e cpf sao obrigatorios" }`), não neste formato — permanece como dívida técnica (não alinhado nesta sprint). Os endpoints de 002/003 (Sprint 6), 004 (Sprint 7) e 005 (Sprint 8) já foram implementados seguindo o vocabulário `codigo` para os cenários RNF-16/de negócio (`SEM_KYC`, `COTAS_INSUFICIENTES`, `VALOR_MINIMO_NAO_ATINGIDO`, `SALDO_INSUFICIENTE`, `LISTAGEM_JA_VENDIDA`, `LISTAGEM_NAO_ENCONTRADA`, `ROLE_INVALIDA`); erros de "recurso não encontrado" (imóvel/investidor/listagem inexistente, ou listagem que não pertence ao investidor) e de validação de payload usam mensagens livres, por não terem código próprio nesta lista.

As rotas de `001`-`004` (investidor) permanecem sem nenhuma autenticação mesmo após esta sprint — `investorId` seguem indo explícito no payload, sem sessão. Avaliado como parte da Sprint 8 (`docs/sprints/08-painel-administrativo-e-seguranca-backend.md`) e mantido como dívida aceita da POC: o RBAC introduzido cobre o gap de maior severidade (ações administrativas que criam imóveis e movem fundos de rendimento), enquanto autenticar o investidor exigiria um mecanismo de sessão/login que nenhuma feature de negócio previu — rastreado como melhoria futura, não um bloqueio de código (ver checklist de segurança off-chain, `security-checklist.md`).
