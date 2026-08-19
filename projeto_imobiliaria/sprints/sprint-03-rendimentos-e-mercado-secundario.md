---
status: not-started
owner: tech-lead
last_updated: 2026-08-19
---

# Sprint 3 — Features 003 (Distribuição de Rendimentos) e 004 (Mercado Secundário)

## Objetivo
Entregar `DividendDistributor` e `Marketplace` implementados via TDD, testados e deployados em testnet. Ambos dependem apenas de `002` (e `004` também de `001`), portanto **podem ser trabalhados em paralelo** se houver dois desenvolvedores; com um único desenvolvedor, sugerimos sequenciar `003` antes de `004`.

## Backlog

### Feature `003-distribuicao-rendimentos`
Backlog completo em [`tasks.md`](../specs/features/003-distribuicao-rendimentos/tasks.md):
- [ ] Escrever testes de `DividendDistributor` a partir de [`contracts/dividend-distributor.md`](../specs/features/003-distribuicao-rendimentos/contracts/dividend-distributor.md).
- [ ] Implementar `DividendDistributor` até os testes passarem.
- [ ] Testes de integração com `PropertyToken` (transferência de cota entre ciclos de distribuição).
- [ ] Fork test em testnet Polygon com 2 ciclos completos de depósito/claim.
- [ ] Checklist de segurança: `SEC-01`, `SEC-06`, `SEC-07` mitigados.
- [ ] Definir e documentar processo operacional de depósito mensal pelo gestor (fora do contrato, necessário para a Fase 4 do roadmap — não bloqueia esta sprint).

### Feature `004-mercado-secundario`
Backlog completo em [`tasks.md`](../specs/features/004-mercado-secundario/tasks.md):
- [ ] Escrever testes de `Marketplace` a partir de [`contracts/marketplace.md`](../specs/features/004-mercado-secundario/contracts/marketplace.md).
- [ ] Implementar `Marketplace` até os testes passarem.
- [ ] Testes de integração com `PropertyToken`/`ComplianceModule`.
- [ ] Teste de concorrência (duas compras na mesma listagem no mesmo bloco).
- [ ] Fork test em testnet Polygon.
- [ ] Checklist de segurança: `SEC-01`, `SEC-04`, `SEC-08` mitigados.

## Dependências / bloqueios
- Depende da Sprint 2 concluída (`PropertyToken`).
- `004` depende adicionalmente da Sprint 1 (`ComplianceModule`, já concluída).

## Marco de saída
Os 4 contratos da POC (`IdentityRegistry`, `ComplianceModule`, `PropertyToken`, `PropertyFactory`, `DividendDistributor`, `Marketplace`) estão implementados, testados e deployados em testnet. Habilita a Sprint 4 (fechamento de segurança e preparação para auditoria).
