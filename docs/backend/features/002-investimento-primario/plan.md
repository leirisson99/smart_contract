---
status: draft
owner: tech-lead
last_updated: 2026-09-01
---

# Plano Técnico — Feature Backend 002

## Componentes
| Componente | Camada | Responsabilidade |
|---|---|---|
| API de investimento primário | Off-chain | Expõe os endpoints de consulta do imóvel e compra de cotas |
| Assinador de transações | Off-chain | Assina e envia `comprarCotas` usando a chave custodial gerida por [001](../../../plan.md) |

## Toolchain (fora do escopo de Foundry — ADR-0003 cobre só os contratos)
Integração com os contratos via biblioteca de cliente EVM (ex.: viem/ethers.js).

## Fluxo ponta a ponta
Investidor consulta dados do imóvel (`GET`) → investidor chama endpoint de compra → backend valida KYC/saldo (RNF-16) → assina e envia `comprarCotas` com a carteira custodial de [001](../../../plan.md) → resultado refletido no portfólio ([003](../../../plan.md)). Ver tabela de cenários em `spec.md`.

## Dependências
- Depende de [001-onboarding-e-custodia](../../../plan.md) (carteira custodial, status de KYC).
- Depende de `../../../on-chain/features/002-tokenizacao-imovel` (`PropertyToken.comprarCotas`, `PropertyFactory`).
- É consumida por `../../../frontend/features/001-interface-investidor`.
