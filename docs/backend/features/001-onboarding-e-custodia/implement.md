---
status: approved
owner: tech-lead
last_updated: 2026-09-02
---

# Implementação — Feature Backend 001

> Consolida mapa de integração on-chain, estratégia de testes e status de implementação desta feature.

## Integração com contratos

| Ação na plataforma | Contrato acionado | Feature on-chain | Observação |
|---|---|---|---|
| Investidor completa KYC | `IdentityRegistry.emitirClaim` | `../../../on-chain/features/001-identidade-kyc` | Chamada feita **diretamente pelo backend** (`backend/src/services/trustedIssuerSigner.ts`, viem 2), não pelo provedor de KYC — o backend atua como Trusted Issuer (POC), com a chave provisionada on-chain via `backend/scripts/grant-trusted-issuer.ts`. Ver [ADR-0006](../../../on-chain/decisions/ADR-0006-fronteira-onchain-offchain-kyc.md), seção "Atualização", para o desvio do desenho original em que o provedor assinaria. |

### Consulta de estado (view functions, sem transação)
- `IdentityRegistry.isVerified` — implementado em `isVerifiedOnChain` (`trustedIssuerSigner.ts`), hoje só exercitado no teste e2e; **nenhuma rota expõe essa leitura ainda** — `GET /investors/:id/kyc` responde com o status gravado no banco (`kycSubmission.status`), não com o estado real on-chain (gap conhecido, ver `tasks.md` item 7). Consumo futuro também por [005-painel-administrativo](../005-painel-administrativo/implement.md).

## Estratégia de testes

Esta feature é 100% off-chain na sua lógica de negócio, mas integra de verdade com a chain (não é só um mock) via viem; depende de `../../../on-chain/features/001-identidade-kyc` já testada. 8 testes vitest ao todo:
- `backend/test/routes.test.ts` (3) — nível HTTP, mocka `emitirClaimOnChain`.
- `backend/test/kycWebhookService.test.ts` (4) — nível de serviço, cobre a idempotência do webhook via `updateMany` condicional (`status: PENDING` como guarda) e o fluxo de aprovação/reprovação.
- `backend/test/kyc-flow.e2e.test.ts` (1) — ponta a ponta contra um Anvil local real, gated por `RUN_E2E=1` (exige `IdentityRegistry` deployado e o backend já registrado como Trusted Issuer).

Cobertura confirmada:
- Criação de carteira custodial ocorre de forma atômica com o cadastro (nenhum investidor fica sem carteira).
- Webhook do provedor de KYC é idempotente (reentrega não duplica a emissão da claim).
- Falha/indisponibilidade do provedor de KYC é tratada sem travar o cadastro do investidor.
- Dados de PII nunca trafegam em payload de transação on-chain (`emitirClaim` só recebe endereço + tópico + assinatura opaca).

### Critério de saída
Todos os cenários de `spec.md` cobertos por teste de integração; nenhuma PII identificada em payloads on-chain durante os testes. **Atingido.**

## Status de implementação
Implementado e testado — Fastify 4 + Prisma 5/Postgres + viem 2, 8 testes vitest (ver acima). Reconciliado com o código em 2026-09-02: a spec passou de `draft` para `approved` retroativamente ao código já existente, com o desvio do desenho original (backend como Trusted Issuer, em vez do provedor) formalizado em [ADR-0006](../../../on-chain/decisions/ADR-0006-fronteira-onchain-offchain-kyc.md). Dívida técnica remanescente: tasks 1, 2 e 7 de `tasks.md` (custódia real, modelo formal de PII/LGPD, revisão de segurança off-chain — incluindo ausência de autenticação nas rotas).
