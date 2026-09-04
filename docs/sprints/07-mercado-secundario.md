---
status: done
owner: tech-lead
last_updated: 2026-09-04
---

# Sprint 7 — Mercado Secundário

## Objetivo
Implementar, via TDD, a feature de backend `004-mercado-secundario`. Embora dependa só de `001` (como `002`/`003`), foi isolada em sprint própria porque introduz o primeiro fluxo de negócio entre **duas** carteiras custodiais diferentes (vendedor e comprador de uma listagem), um padrão de teste distinto (estado compartilhado da listagem, concorrência) que justifica não sobrecarregar a Sprint 6. Pode rodar em paralelo à Sprint 6 se houver 2 desenvolvedores — a ordem entre 06 e 07 não importa, só a dependência de ambas em `001`.

## Backlog
Referência: [`../backend/features/004-mercado-secundario/tasks.md`](../backend/features/004-mercado-secundario/tasks.md) (expandir com o mesmo nível de granularidade de [`001/tasks.md`](../backend/features/001-onboarding-e-custodia/tasks.md)).

- [x] Endpoint de listagem (`POST /listagens`) — assina e envia `Marketplace.listar` (RF-34), validando saldo suficiente do vendedor (`SALDO_INSUFICIENTE`).
- [x] Endpoint de leitura de listagens ativas (`GET /listagens`).
- [x] Endpoint de compra (`POST /listagens/:id/comprar`) — assina e envia `Marketplace.comprar` (RF-35), com checagem otimista de KYC do comprador antes do envio (`SEM_KYC`), e tratamento de `LISTAGEM_JA_VENDIDA`/`LISTAGEM_NAO_ENCONTRADA`.
- [x] Endpoint de cancelamento (`POST /listagens/:id/cancelar`) — assina e envia `Marketplace.cancelar`. Corrigido em 2026-09-04: o `catch` não tratava `TransacaoRevertidaError` (mesma corrida SEC-04 de `comprar`), caindo em `502 ERRO_DESCONHECIDO` em vez de `409 LISTAGEM_JA_VENDIDA`.
- [x] Teste do cenário de concorrência: duas compras/cancelamentos quase simultâneos sobre a mesma listagem (só um deve ter sucesso; o outro recebe `LISTAGEM_JA_VENDIDA`) — o contrato `Marketplace` já cobre isso on-chain (`test/Marketplace.t.sol`, 19 testes); o backend propaga o revert como esse código de erro em `comprar` e (desde 2026-09-04) em `cancelar` também, ambos com teste (`backend/test/marketplace.routes.test.ts`).
- [x] Alinhar respostas de erro ao vocabulário de [`../backend/api-contract.md`](../backend/api-contract.md).
- [x] Testes de integração (unit, mockando a chain) — `backend/test/marketplace.routes.test.ts`, 12 testes.
- [x] Teste e2e gated contra Anvil local (listar → comprar, listar → cancelar) — `backend/test/marketplace-flow.e2e.test.ts` (2026-09-04), mesmo padrão `RUN_E2E=1` de `kyc-flow.e2e.test.ts`/`property-flow.e2e.test.ts`. Roda de ponta a ponta contra um Anvil real: confirma saldo on-chain e portfolio de vendedor/comprador após a compra, e devolução da cota + remoção da listagem ativa após o cancelamento.

## Dependências / bloqueios
- Depende de `001-onboarding-e-custodia` (carteira custodial, status de KYC) — já implementada e testada.
- Depende do contrato on-chain `../on-chain/features/004-mercado-secundario` (`Marketplace.listar`/`comprar`/`cancelar`) — já completo, testado (19 testes) e com Slither/Mythril sem findings.
- Depende da Sprint 5 (spec `004` aprovada). Não depende da Sprint 6.

## Marco de saída
Listar, comprar e cancelar funcionando ponta a ponta contra um Anvil local, incluindo o cenário de checagem otimista de KYC e o de concorrência sobre a mesma listagem. Respostas de erro seguindo `api-contract.md`.
