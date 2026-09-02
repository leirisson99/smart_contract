---
status: not-started
owner: tech-lead
last_updated: 2026-09-02
---

# Sprint 7 — Mercado Secundário

## Objetivo
Implementar, via TDD, a feature de backend `004-mercado-secundario`. Embora dependa só de `001` (como `002`/`003`), foi isolada em sprint própria porque introduz o primeiro fluxo de negócio entre **duas** carteiras custodiais diferentes (vendedor e comprador de uma listagem), um padrão de teste distinto (estado compartilhado da listagem, concorrência) que justifica não sobrecarregar a Sprint 6. Pode rodar em paralelo à Sprint 6 se houver 2 desenvolvedores — a ordem entre 06 e 07 não importa, só a dependência de ambas em `001`.

## Backlog
Referência: [`../backend/features/004-mercado-secundario/tasks.md`](../backend/features/004-mercado-secundario/tasks.md) (expandir com o mesmo nível de granularidade de [`001/tasks.md`](../backend/features/001-onboarding-e-custodia/tasks.md)).

- [ ] Endpoint de listagem (`POST /listagens`) — assina e envia `Marketplace.listar` (RF-34), validando saldo suficiente do vendedor (`SALDO_INSUFICIENTE`).
- [ ] Endpoint de leitura de listagens ativas (`GET /listagens`).
- [ ] Endpoint de compra (`POST /listagens/:id/comprar`) — assina e envia `Marketplace.comprar` (RF-35), com checagem otimista de KYC do comprador antes do envio (`SEM_KYC`), e tratamento de `LISTAGEM_JA_VENDIDA`/`LISTAGEM_NAO_ENCONTRADA`.
- [ ] Endpoint de cancelamento (`POST /listagens/:id/cancelar`) — assina e envia `Marketplace.cancelar`.
- [ ] Teste do cenário de concorrência: duas compras quase simultâneas sobre a mesma listagem (só uma deve ter sucesso; a segunda recebe `LISTAGEM_JA_VENDIDA`) — o contrato `Marketplace` já cobre isso on-chain (`test/Marketplace.t.sol`, 19 testes), a responsabilidade do backend é propagar o revert corretamente como esse código de erro.
- [ ] Alinhar respostas de erro ao vocabulário de [`../backend/api-contract.md`](../backend/api-contract.md).
- [ ] Testes de integração (unit, mockando a chain) + e2e gated contra Anvil local, cobrindo listar → comprar (saldo atualizado em ambos os portfólios) e listar → cancelar.

## Dependências / bloqueios
- Depende de `001-onboarding-e-custodia` (carteira custodial, status de KYC) — já implementada e testada.
- Depende do contrato on-chain `../on-chain/features/004-mercado-secundario` (`Marketplace.listar`/`comprar`/`cancelar`) — já completo, testado (19 testes) e com Slither/Mythril sem findings.
- Depende da Sprint 5 (spec `004` aprovada). Não depende da Sprint 6.

## Marco de saída
Listar, comprar e cancelar funcionando ponta a ponta contra um Anvil local, incluindo o cenário de checagem otimista de KYC e o de concorrência sobre a mesma listagem. Respostas de erro seguindo `api-contract.md`.
