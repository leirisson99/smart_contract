---
status: draft
owner: tech-lead
last_updated: 2026-09-01
---

# Plano Técnico — Feature Backend 001

## Componentes
| Componente | Camada | Responsabilidade |
|---|---|---|
| API de onboarding | Off-chain | Expõe os endpoints de cadastro e status de KYC |
| Orquestrador de KYC | Off-chain | Recebe documentos, envia ao provedor externo, processa o webhook de resultado |
| Serviço de custódia de chaves | Off-chain | Gera e protege as chaves privadas das carteiras custodiais dos investidores |
| Banco de dados | Off-chain | PII (CPF, documentos), sujeito a LGPD — nunca replicado on-chain |

## Toolchain (fora do escopo de Foundry — ADR-0003 cobre só os contratos)
Integração com o provedor de KYC via API/webhook; nenhuma integração direta com contratos nesta feature (a claim on-chain é emitida pelo próprio provedor como Trusted Issuer, `../../../on-chain/features/001-identidade-kyc`).

## Fluxo ponta a ponta
Cadastro → criação automática da carteira custodial (RF-21) → envio de documentos ao provedor de KYC → webhook de resultado processado (RF-33) → status interno atualizado → provedor emite a claim `KYC_APPROVED` on-chain. Ver tabela de cenários em `spec.md`.

## Dependências
- Depende de `../../../on-chain/features/001-identidade-kyc` (contraparte on-chain — o Trusted Issuer emite a claim, o backend só orquestra o envio de documentos e recebe o resultado).
- É a feature-base da qual [002](../../../plan.md), [003](../../../plan.md), [004](../../../plan.md) e [005](../../../plan.md) dependem (carteira custodial e/ou status de KYC).
- É consumida por `../../../frontend/features/001-interface-investidor` — nenhum outro consumidor deve acionar estes endpoints diretamente sem passar pelas mesmas revalidações.
