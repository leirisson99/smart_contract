---
status: draft
owner: tech-lead
last_updated: 2026-09-01
---

# Implementação — Feature Backend 003

> Consolida mapa de integração on-chain, estratégia de testes e status de implementação desta feature.

## Integração com contratos

| Ação na plataforma | Contrato acionado | Feature on-chain | Observação |
|---|---|---|---|
| Job automático de claim | `DividendDistributor.claim` / `claimTodos` | `../../../on-chain/features/003-distribuicao-rendimentos` | Rodado periodicamente pelo backend, em nome de cada investidor com valor pendente, usando a carteira custodial de [001](../001-onboarding-e-custodia/implement.md) |

### Consulta de estado (view functions, sem transação)
- `PropertyToken.balanceOf` — exibir portfólio.
- `DividendDistributor.valorReivindicavel` — exibir rendimentos pendentes e identificar quem o job deve processar.

## Estratégia de testes

Depende dos contratos de `../../../on-chain/features/003-distribuicao-rendimentos` já testados. A estratégia aqui cobre a camada de integração backend ↔ contrato.

- Job de claim automático identifica corretamente todos os investidores com `valorReivindicavel > 0` e executa `claim` para cada um.
- Falha de claim de um investidor não interrompe o processamento dos demais.
- Teste end-to-end (testnet), cruzando com [005-painel-administrativo](../005-painel-administrativo/implement.md): depósito de rendimento pelo gestor → job de claim automático → saldo refletido no portfólio.

### Critério de saída
Todos os cenários de `spec.md` cobertos por teste de integração ou end-to-end.

## Status de implementação
Nenhum código ainda — spec em `draft`, precisa virar `approved` antes de qualquer implementação (SDD, ver `../../../on-chain/00-constitution.md`).
