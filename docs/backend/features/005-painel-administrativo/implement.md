---
status: draft
owner: tech-lead
last_updated: 2026-09-01
---

# Implementação — Feature Backend 005

> Consolida mapa de integração on-chain, estratégia de testes e status de implementação desta feature.

## Integração com contratos

| Ação na plataforma | Contrato acionado | Feature on-chain | Observação |
|---|---|---|---|
| Gestor cria novo imóvel | `PropertyFactory.criarImovel` | `../../../on-chain/features/002-tokenizacao-imovel` | Requer `PLATFORM_ADMIN_ROLE` |
| Gestor deposita aluguel do mês | `DividendDistributor.depositarRendimento` | `../../../on-chain/features/003-distribuicao-rendimentos` | Requer role de gestor; abre o ciclo de claim consumido por [003-portfolio-e-rendimentos](../003-portfolio-e-rendimentos/implement.md) |

### Consulta de estado (view functions, sem transação)
- `IdentityRegistry.isVerified` — cruzada com os dados de [001-onboarding-e-custodia](../001-onboarding-e-custodia/implement.md) para exibir o status de KYC dos investidores ao gestor.

## Estratégia de testes

Depende dos contratos de `../../../on-chain/features/002-tokenizacao-imovel` e `../../../on-chain/features/003-distribuicao-rendimentos` já testados. A estratégia aqui cobre a camada de integração backend ↔ contrato e o controle de acesso administrativo.

- Controle de acesso dos endpoints administrativos — apenas usuários com papel de admin acessam funções que acionam `PropertyFactory`/`DividendDistributor`.
- Teste end-to-end (testnet): criação de imóvel → depósito de rendimento → job de claim automático de [003](../003-portfolio-e-rendimentos/implement.md) → saldo refletido no portfólio.

### Critério de saída
Todos os cenários de `spec.md` cobertos por teste de integração ou end-to-end.

## Status de implementação
Nenhum código ainda — spec em `draft`, precisa virar `approved` antes de qualquer implementação (SDD, ver `../../../on-chain/00-constitution.md`).
