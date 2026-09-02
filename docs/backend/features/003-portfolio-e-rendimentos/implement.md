---
status: approved
owner: tech-lead
last_updated: 2026-09-02
---

# Implementação — Feature Backend 003

> Consolida mapa de integração on-chain, estratégia de testes e status de implementação desta feature.

## Integração com contratos

| Ação na plataforma | Contrato acionado | Feature on-chain | Observação |
|---|---|---|---|
| Job automático de claim | `DividendDistributor.claimTodos` (fallback: `claim` por ciclo) | `../../../on-chain/features/003-distribuicao-rendimentos` | Rodado periodicamente pelo backend (`backend/scripts/run-yield-claim-job.ts`), em nome de cada investidor com valor pendente, usando a carteira custodial de [001](../001-onboarding-e-custodia/implement.md) |

### Consulta de estado (view functions, sem transação)
- `PropertyToken.balanceOf` — exibir portfólio (`balanceOfOnChain`).
- `DividendDistributor.{cicloAtual,valorReivindicavel}` — exibir rendimentos pendentes e identificar quem o job deve processar (`pendingCyclesFor`, reaproveitado pelo job e pelo endpoint de portfólio).

## Estratégia de testes

Depende dos contratos de `../../../on-chain/features/003-distribuicao-rendimentos` já testados. A estratégia aqui cobre a camada de integração backend ↔ contrato.

- Unit (`test/portfolio.routes.test.ts`, `test/yieldClaimJob.test.ts`, mockando `propertyChain`): agregação de holdings/histórico/pendente no portfólio; job identifica ciclos pendentes e executa `claimTodos`; idempotência (rodar o job duas vezes não reclama o mesmo ciclo); fallback para `claim` individual quando `claimTodos` reverte, isolando a falha por ciclo; falha total de um investidor não impede o sucesso dos demais.
- E2e real (`test/property-flow.e2e.test.ts`, gated por `RUN_E2E=1`): depósito de rendimento (chamado direto via viem no teste, já que o endpoint administrativo de [005](../005-painel-administrativo/implement.md) ainda não existe) → job de claim automático → saldo refletido no portfólio — rodado uma vez contra Anvil local para verificação.
- Teste end-to-end em testnet Polygon Amoy: ainda não feito (mesmo bloqueio de RPC/MATIC de faucet da trilha on-chain, `PENDENCIAS.md`).

### Critério de saída
Todos os cenários de `spec.md` cobertos por teste de integração ou end-to-end (Anvil local). Testnet pendente por bloqueio externo, não de código.

## Status de implementação
Implementado e testado — `backend/src/routes/portfolio.ts`, `backend/src/services/yieldClaimJob.ts`. Testes unitários (mockando a chain) + e2e real gated contra Anvil local. Reconciliado com o código em 2026-09-02 (Sprint 6).
