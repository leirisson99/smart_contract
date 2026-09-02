---
status: approved
owner: tech-lead
last_updated: 2026-09-02
---

# Plano Técnico — Feature Backend 001

## Componentes
| Componente | Camada | Responsabilidade |
|---|---|---|
| API de onboarding | Off-chain | Expõe os endpoints de cadastro e status de KYC (`src/routes/investors.ts`, `src/routes/kyc.ts`) |
| Orquestrador de KYC | Off-chain | Recebe documentos, envia ao provedor externo (ou mock, `src/services/kycProvider/`), processa o webhook de resultado de forma idempotente (`src/services/kycWebhookService.ts`, `src/routes/webhooks.ts`) |
| Trusted Issuer Signer | Off-chain | Assina e envia `IdentityRegistry.emitirClaim` on-chain usando a chave do backend (viem), atuando como Trusted Issuer (POC) — `src/services/trustedIssuerSigner.ts` |
| Serviço de custódia de chaves | Off-chain | Gera as carteiras custodiais (viem) e cifra a chave privada (e o CPF) com AES-256-GCM — stub explícito para a POC, não é custódia real (HSM/KMS) — `src/services/walletCustody.ts` |
| Patrocinador de gas | Off-chain | Financia com ETH as carteiras custodiais recém-criadas (nascem com saldo zero) para que o investidor consiga assinar suas próprias transações (`comprarCotas`, `claim` — features 002/003) sem nunca lidar com gas — descoberto na Sprint 6, `src/services/gasSponsor.ts` |
| Banco de dados | Off-chain | PII (CPF, documentos), sujeito a LGPD — nunca replicado on-chain (Postgres via Prisma, `prisma/schema.prisma`) |

## Stack real
Fastify 4 + Prisma 5/Postgres + viem 2 (TypeScript, ESM), testado com vitest. Postgres local via `docker-compose.yml`. Diretório: `backend/`.

## Toolchain (fora do escopo de Foundry — ADR-0003 cobre só os contratos)
Integração direta on-chain via viem com `IdentityRegistry.emitirClaim`/`isVerified` (`src/services/trustedIssuerSigner.ts`). Provisionamento do backend como Trusted Issuer via `backend/scripts/grant-trusted-issuer.ts` (requer que o deployer com `PLATFORM_ADMIN_ROLE` execute `adicionarTrustedIssuer` uma vez, como passo operacional).

## Fluxo ponta a ponta
Cadastro → criação automática da carteira custodial (RF-21) → envio de documentos ao provedor de KYC (ou mock) → webhook de resultado processado de forma idempotente (RF-33) → status interno atualizado → **backend** emite a claim `KYC_APPROVED` on-chain (Trusted Issuer, POC) e grava `claimTxHash`. Ver tabela de cenários em `spec.md`.

## Dependências
- Depende de `../../../on-chain/features/001-identidade-kyc` (contraparte on-chain) e de o backend já estar registrado como Trusted Issuer no `IdentityRegistry` (`grant-trusted-issuer.ts`) — pré-requisito operacional, não de spec.
- Se a chave do Trusted Issuer for comprometida, seguir o runbook [`../../../on-chain/runbooks/rotacao-trusted-issuer.md`](../../../on-chain/runbooks/rotacao-trusted-issuer.md).
- É a feature-base da qual [002](../../../plan.md), [003](../../../plan.md), [004](../../../plan.md) e [005](../../../plan.md) dependem (carteira custodial e/ou status de KYC).
- É consumida por `../../../frontend/features/001-interface-investidor` — nenhum outro consumidor deve acionar estes endpoints diretamente sem passar pelas mesmas revalidações.
