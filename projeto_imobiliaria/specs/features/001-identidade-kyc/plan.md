---
status: draft
owner: tech-lead
last_updated: 2026-08-17
---

# Plano Técnico — Feature 001

## Componentes

| Componente | Camada | Responsabilidade |
|---|---|---|
| Provedor de KYC | Off-chain | Coleta CPF/documento/selfie, decide aprovação, assina claim |
| `IdentityRegistry` | On-chain | Mapeia carteira → claims válidas; fonte de verdade para `isVerified` |
| `ComplianceModule` | On-chain | Consultado pelo `PropertyToken`/`Marketplace` antes de qualquer transferência |
| Backend da plataforma | Off-chain (`specs-backend/features/001-plataforma-investidor`) | Orquestra o fluxo, guarda PII em banco próprio (LGPD), aciona o provedor |

## Fluxo ponta a ponta
1. Investidor preenche cadastro na plataforma (off-chain) → RF-01.
2. Backend envia documentos ao provedor de KYC (off-chain).
3. Provedor aprova e assina uma claim `KYC_APPROVED` para a carteira custodial do investidor (criada automaticamente, ver `specs-backend/features/001-plataforma-investidor`).
4. Claim é submetida por transação on-chain ao `IdentityRegistry` (a transação pode ser paga (gas) pela plataforma via relayer, sem custo para o investidor) → RF-02.
5. A partir daí, `ComplianceModule.canTransfer` passa a permitir transferências de/para essa carteira → RF-03.

## Fronteira on-chain/off-chain
Ver ADR-0006. Resumo: PII fica 100% off-chain no backend da plataforma; on-chain só existem claims categóricas sem dado identificável.

## Dependências
Nenhuma — esta é a feature-base da qual `002`, `003` e `004` (em `specs/`) e `specs-backend/features/001-plataforma-investidor` dependem para checagem de compliance.
