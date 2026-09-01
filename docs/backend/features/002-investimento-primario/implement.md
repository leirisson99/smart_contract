---
status: draft
owner: tech-lead
last_updated: 2026-09-01
---

# Implementação — Feature Backend 002

> Consolida mapa de integração on-chain, estratégia de testes e status de implementação desta feature.

## Integração com contratos

| Ação na plataforma | Contrato acionado | Feature on-chain | Observação |
|---|---|---|---|
| Investidor compra cotas | `PropertyToken.comprarCotas` | `../../../on-chain/features/002-tokenizacao-imovel` | Backend assina em nome da carteira custodial do investidor (custódia gerida por [001](../001-onboarding-e-custodia/implement.md)) |

### Consulta de estado (view functions, sem transação)
- Views de `PropertyToken`/`PropertyFactory` usadas para popular o endpoint de dados do imóvel (valor, cotas restantes) — ver `../../../on-chain/features/002-tokenizacao-imovel/contracts/property-token.md` para a assinatura exata.

## Estratégia de testes

Depende dos contratos de `../../../on-chain/features/002-tokenizacao-imovel` já testados. A estratégia aqui cobre a camada de integração backend ↔ contrato.

- Backend consegue assinar e enviar `comprarCotas` em nome de uma carteira custodial e refletir o resultado no portfólio ([003](../003-portfolio-e-rendimentos/implement.md)).
- Falha de uma transação on-chain (ex.: revert de compliance) é tratada e exibida de forma compreensível ao investidor, sem quebrar o fluxo para outros usuários.
- Teste end-to-end (testnet): cadastro → KYC aprovado ([001](../001-onboarding-e-custodia/implement.md)) → compra de cota → saldo refletido no portfólio.

### Critério de saída
Todos os cenários de `spec.md` cobertos por teste de integração ou end-to-end.

## Nota de segurança (RNF-16)
Toda ação que envolve movimentação de valor/token é sempre revalidada pelo contrato (compliance, saldo, KYC), independentemente do que o backend já validou na UX — o backend nunca é a última linha de defesa. Mesmo princípio aplicado por [004](../004-mercado-secundario/implement.md) e [005](../005-painel-administrativo/implement.md).

## Status de implementação
Nenhum código ainda — spec em `draft`, precisa virar `approved` antes de qualquer implementação (SDD, ver `../../../on-chain/00-constitution.md`).
