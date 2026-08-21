---
status: in-progress
owner: tech-lead
last_updated: 2026-08-21
---

# Sprint 3 — Features 003 (Distribuição de Rendimentos) e 004 (Mercado Secundário)

## Objetivo
Entregar `DividendDistributor` e `Marketplace` implementados via TDD, testados e deployados em testnet. Ambos dependem apenas de `002` (e `004` também de `001`), portanto **podem ser trabalhados em paralelo** se houver dois desenvolvedores; com um único desenvolvedor, sugerimos sequenciar `003` antes de `004`.

## Backlog

### Feature `003-distribuicao-rendimentos`
Backlog completo em [`tasks.md`](../specs/features/003-distribuicao-rendimentos/tasks.md):
- [x] Escrever testes de `DividendDistributor` a partir de [`contracts/dividend-distributor.md`](../specs/features/003-distribuicao-rendimentos/contracts/dividend-distributor.md). (`test/DividendDistributor.t.sol`, 15 testes cobrindo RF-11 a RF-15, dust e o cenário "transferência entre ciclos".)
- [x] Implementar `DividendDistributor` até os testes passarem. (`src/DividendDistributor.sol` — 15/15 testes verdes, 100% de cobertura. A spec dependia de um mecanismo de snapshot que a feature 002 não previu; estendido retroativamente `PropertyToken` com `snapshot()`/`balanceOfAt()` via `Checkpoints` da OZ, sem quebrar os testes já existentes.)
- [x] Testes de integração com `PropertyToken` (transferência de cota entre ciclos de distribuição). (Incluído no mesmo arquivo — `test_Integracao_transferenciaEntreCiclosNaoAfetaClaimAnterior`.)
- [ ] Fork test em testnet Polygon com 2 ciclos completos de depósito/claim. (Mesmo bloqueio das sprints anteriores: falta RPC + MATIC de teste no `.env`.)
- [x] Checklist de segurança: `SEC-01`, `SEC-06`, `SEC-07` mitigados.
- [ ] Definir e documentar processo operacional de depósito mensal pelo gestor (fora do contrato, necessário para a Fase 4 do roadmap — não bloqueia esta sprint).

### Feature `004-mercado-secundario`
Backlog completo em [`tasks.md`](../specs/features/004-mercado-secundario/tasks.md):
- [x] Escrever testes de `Marketplace` a partir de [`contracts/marketplace.md`](../specs/features/004-mercado-secundario/contracts/marketplace.md). (`test/Marketplace.t.sol`, 19 testes cobrindo RF-16 a RF-20, taxa de transação e concorrência.)
- [x] Implementar `Marketplace` até os testes passarem. (`src/Marketplace.sol` — 19/19 testes verdes, 100% de cobertura. Usa `transfer`/`transferFrom` normais do `PropertyToken` — nenhum atalho de compliance; o próprio endereço do Marketplace precisa de uma claim KYC_APPROVED, documentado como passo de deploy.)
- [x] Testes de integração com `PropertyToken`/`ComplianceModule`. (Usa o `PropertyToken` real, não mock — já é o teste de integração.)
- [x] Teste de concorrência (duas compras na mesma listagem no mesmo bloco). (`test_duasComprasSequenciaisNaMesmaListagem_segundaAjustaAoRestante` — resolve deterministicamente pela ordem de execução, sem código extra.)
- [ ] Fork test em testnet Polygon. (Mesmo bloqueio.)
- [x] Checklist de segurança: `SEC-01`, `SEC-04`, `SEC-08` mitigados.

## Dependências / bloqueios
- Depende da Sprint 2 concluída (`PropertyToken`).
- `004` depende adicionalmente da Sprint 1 (`ComplianceModule`, já concluída).
- **Passos de deploy necessários** (não documentados na spec original, ver [`PENDENCIAS.md`](../PENDENCIAS.md)): o `DividendDistributor` de cada imóvel precisa de `SNAPSHOT_ROLE` no `PropertyToken` correspondente; o endereço do `Marketplace` precisa de uma claim `KYC_APPROVED` no `IdentityRegistry` para poder receber/manter cotas em escrow.

## Marco de saída
Os 6 contratos da POC (`IdentityRegistry`, `ComplianceModule`, `PropertyToken`, `PropertyFactory`, `DividendDistributor`, `Marketplace`) estão implementados e testados (101/101 testes, 100% de cobertura). Deploy em testnet segue pendente (bloqueio externo: RPC + MATIC de teste). Habilita a Sprint 4 (fechamento de segurança e preparação para auditoria).
