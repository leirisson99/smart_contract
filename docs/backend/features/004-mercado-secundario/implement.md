---
status: draft
owner: tech-lead
last_updated: 2026-09-01
---

# Implementação — Feature Backend 004

> Consolida mapa de integração on-chain, estratégia de testes e status de implementação desta feature.

## Integração com contratos

| Ação na plataforma | Contrato acionado | Feature on-chain | Observação |
|---|---|---|---|
| Investidor lista cotas para venda | `Marketplace.listar` | `../../../on-chain/features/004-mercado-secundario` | Backend assina em nome da carteira custodial ([001](../001-onboarding-e-custodia/implement.md)) |
| Investidor compra no mercado secundário | `Marketplace.comprar` | `../../../on-chain/features/004-mercado-secundario` | Backend assina em nome da carteira custodial; valida KYC antes de enviar (checagem otimista de UX, mas o contrato revalida) |

### Consulta de estado (view functions, sem transação)
- `Marketplace.listagensAtivasPorToken` — exibir mercado secundário na interface.

## Estratégia de testes

Depende dos contratos de `../../../on-chain/features/004-mercado-secundario` já testados. A estratégia aqui cobre a camada de integração backend ↔ contrato.

- Fluxo de mercado secundário: listagem → compra por outro investidor → saldo atualizado em ambos os portfólios ([003](../003-portfolio-e-rendimentos/implement.md)).

### Critério de saída
Todos os cenários de `spec.md` cobertos por teste de integração ou end-to-end.

## Nota de segurança
Mesmo princípio de RNF-16 (ver [002](../002-investimento-primario/implement.md)) — a checagem de KYC feita pelo backend antes de enviar `Marketplace.comprar` é só uma otimização de UX; a segurança vem do próprio contrato recusar a transferência.

## Status de implementação
Nenhum código ainda — spec em `draft`, precisa virar `approved` antes de qualquer implementação (SDD, ver `../../../on-chain/00-constitution.md`).
