---
status: draft
owner: tech-lead
last_updated: 2026-09-01
---

# Implementação — Feature Backend 001

> Consolida mapa de integração on-chain, estratégia de testes e status de implementação desta feature.

## Integração com contratos

| Ação na plataforma | Contrato acionado | Feature on-chain | Observação |
|---|---|---|---|
| Investidor completa KYC | `IdentityRegistry.emitirClaim` (via Trusted Issuer) | `../../../on-chain/features/001-identidade-kyc` | Chamada feita pelo provedor de KYC, não diretamente pelo backend da plataforma — o backend só orquestra o envio de documentos e o recebimento do webhook (RF-33) |

### Consulta de estado (view functions, sem transação)
- `IdentityRegistry.isVerified` — exibir status de KYC no perfil do investidor; consumido também por [005-painel-administrativo](../005-painel-administrativo/implement.md).

## Estratégia de testes

Esta feature é 100% off-chain; depende de `../../../on-chain/features/001-identidade-kyc` já testada. A estratégia aqui cobre a camada de integração backend ↔ provedor de KYC.

- Criação de carteira custodial ocorre de forma atômica com o cadastro (nenhum investidor fica sem carteira).
- Webhook do provedor de KYC é idempotente (reentrega não duplica o efeito).
- Falha/indisponibilidade do provedor de KYC é tratada sem travar o cadastro do investidor.
- Dados de PII nunca trafegam em payload de transação on-chain (verificação de que apenas endereços/claims categóricas chegam aos contratos).

### Critério de saída
Todos os cenários de `spec.md` cobertos por teste de integração; nenhuma PII identificada em payloads on-chain durante os testes.

## Status de implementação
Nenhum código ainda — spec em `draft`, precisa virar `approved` antes de qualquer implementação (SDD, ver `../../../on-chain/00-constitution.md`).
