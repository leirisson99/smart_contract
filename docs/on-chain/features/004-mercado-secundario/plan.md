---
status: draft
owner: tech-lead
last_updated: 2026-08-17
---

# Plano Técnico — Feature 004

## Componentes
| Componente | Camada | Responsabilidade |
|---|---|---|
| `Marketplace` | On-chain | Escrow de cotas listadas, execução de compra a preço fixo, cobrança da taxa de transação (0.5-2%, slide 5) |
| `PropertyToken` | On-chain (feature 002) | Token negociado; toda transferência via Marketplace ainda passa por `ComplianceModule` |

## Decisão de design: um Marketplace por imóvel ou compartilhado?
Recomendação: **um único contrato `Marketplace` compartilhado**, parametrizado pelo endereço do `PropertyToken` em cada listagem — evita redeploy a cada novo imóvel e centraliza a lógica de taxa de transação (modelo de negócio do slide 5) em um único ponto auditado.

## Fluxo ponta a ponta
1. Vendedor lista cotas → RF-16 (cotas vão para escrow no `Marketplace`).
2. Comprador verificado compra (total ou parcial) → RF-17, RF-19, RF-20.
3. `Marketplace` transfere cotas ao comprador (via `PropertyToken.transfer`, passando por compliance), transfere pagamento ao vendedor, retém taxa de transação conforme modelo de negócio.
4. Vendedor pode cancelar a qualquer momento antes da compra → RF-18.

## Dependências
- `002-tokenizacao-imovel` (token negociado).
- `001-identidade-kyc` (compliance em toda transferência).
