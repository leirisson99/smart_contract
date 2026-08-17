---
status: draft
owner: tech-lead
last_updated: 2026-08-17
---

# Plano Técnico — Feature 002

## Componentes
| Componente | Camada | Responsabilidade |
|---|---|---|
| `PropertyFactory` | On-chain | Deploy padronizado de um `PropertyToken` por imóvel; registro de imóveis da plataforma |
| `PropertyToken` | On-chain | Representa as cotas de UM imóvel (ERC-3643); emissão primária |
| `IdentityRegistry` / `ComplianceModule` | On-chain (feature 001) | Checagem de elegibilidade em toda transferência |
| Gateway de pagamento | Off-chain | Converte pagamento fiat (PIX) em liquidação on-chain — ver nota abaixo |

## Decisão em aberto: moeda de liquidação
A compra de cotas precisa de uma moeda de liquidação on-chain. Duas opções levantadas para validação com stakeholders (rastrear em `specs/roadmap.md`, tracker de perguntas):
- Stablecoin (ex. BRZ ou USDC) — liquidação on-chain nativa, requer on/off-ramp PIX↔stablecoin.
- Registro do valor em BRL off-chain com liquidação on-chain apenas simbólica (cota emitida após confirmação de pagamento fiat pela plataforma).
Recomendação técnica preliminar: stablecoin, por manter a liquidação auditável on-chain de ponta a ponta — a decisão final depende de parceria de on/off-ramp (pergunta em aberto do slide 8).

## Fluxo ponta a ponta
1. Gestor define imóvel e aciona `PropertyFactory.criarImovel` → RF-06.
2. Investidor com KYC aprovado (feature 001) compra cotas via plataforma, que chama `PropertyToken` → RF-07.
3. Cota é creditada instantaneamente (mesma transação) → RF-08.
4. Toda transferência (primária ou secundária) passa por `ComplianceModule.canTransfer` (feature 001) → RF-10.

## Dependências
- `001-identidade-kyc` (obrigatória — toda transferência depende de compliance).
- Consumida por `003-distribuicao-rendimentos` (saldo de `PropertyToken` define proporção de dividendos) e `004-mercado-secundario` (negocia o mesmo token).
