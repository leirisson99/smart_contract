---
status: draft
owner: tech-lead
last_updated: 2026-09-01
---

# Plano Técnico — Feature Backend 003

## Componentes
| Componente | Camada | Responsabilidade |
|---|---|---|
| API de portfólio | Off-chain | Expõe o endpoint de leitura de cotas, valor investido e histórico de rendimentos |
| Job de claim automático | Off-chain | Roda periodicamente, identifica rendimentos pendentes e executa `claim` em nome de cada investidor |

## Toolchain (fora do escopo de Foundry — ADR-0003 cobre só os contratos)
Integração com os contratos via biblioteca de cliente EVM (ex.: viem/ethers.js).

## Fluxo ponta a ponta
Job periódico consulta `DividendDistributor.valorReivindicavel` para cada investidor com saldo em cotas → executa `claim`/`claimTodos` em nome de quem tem valor pendente, usando a carteira custodial de [001](../../../plan.md) → endpoint de portfólio reflete o saldo recebido. Ver tabela de cenários em `spec.md`.

## Dependências
- Depende de [001-onboarding-e-custodia](../../../plan.md) (carteira custodial).
- Depende de `../../../on-chain/features/003-distribuicao-rendimentos` (`DividendDistributor`) — o depósito do rendimento que torna `valorReivindicavel > 0` é acionado por [005-painel-administrativo](../../../plan.md).
- É consumida por `../../../frontend/features/001-interface-investidor`.
