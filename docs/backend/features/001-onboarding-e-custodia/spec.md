---
status: approved
owner: tech-lead
approved_by: tech-lead (acumulando também os papéis de Product/Founder e Compliance/Jurídico nesta fase da POC)
last_updated: 2026-09-02
---

# Feature Backend 001 — Onboarding e Custódia

Origem: pitch slide 4, passo 2 ("Carteira criada automaticamente — sem conhecimento técnico") e o fluxo de KYC do mesmo slide. Base de identidade e custódia consumida por todas as demais features do backend ([002](../002-investimento-primario/spec.md), [003](../003-portfolio-e-rendimentos/spec.md), [004](../004-mercado-secundario/spec.md), [005](../005-painel-administrativo/spec.md)) e pela interface ([`../../../frontend/features/001-interface-investidor`](../../../frontend/features/001-interface-investidor/spec.md)).

## Objetivo
Fornecer a base de identidade e custódia da plataforma: cadastro do investidor, criação automática de uma carteira digital custodial (sem exigir que ele gerencie chaves privadas), orquestração do fluxo de KYC com o provedor externo (Trusted Issuer, [`../../../on-chain/features/001-identidade-kyc`](../../../on-chain/features/001-identidade-kyc/spec.md)), e armazenamento dos dados pessoais associados, sujeito à LGPD (ADR-0006).

## Personas
- **Investidor**: completa cadastro e KYC nesta feature antes de poder investir (via [002](../002-investimento-primario/spec.md)) ou negociar no mercado secundário (via [004](../004-mercado-secundario/spec.md)).
- **Gestor da SPE / administrador**: não interage diretamente com esta feature, mas o painel administrativo ([005](../005-painel-administrativo/spec.md)) lê o status de KYC armazenado aqui.

## Requisitos funcionais

| ID | Requisito |
|---|---|
| RF-21 | O backend deve criar automaticamente uma carteira digital custodial para o investidor no momento do cadastro, sem exigir que ele gerencie chaves privadas (slide 4, passo 2). |
| RF-33 | O backend deve orquestrar o fluxo de KYC ponta a ponta: receber os documentos do investidor, submetê-los ao provedor externo de KYC (ou a um provedor mock, enquanto nenhum provedor real estiver contratado — ver [`PENDENCIAS.md`](../../../PENDENCIAS.md)), processar o retorno (webhook/callback) atualizando o status interno de verificação, e **emitir a claim `KYC_APPROVED` on-chain (`IdentityRegistry.emitirClaim`) atuando ele mesmo como Trusted Issuer** — ver [`../../../on-chain/features/001-identidade-kyc`](../../../on-chain/features/001-identidade-kyc/spec.md). Isso é um desvio deliberado do desenho original (no qual o provedor assinaria a claim): nenhum dos candidatos a provedor de KYC avaliados assina claims on-chain nativamente (`PENDENCIAS.md`), então a plataforma assume esse papel. Ver [ADR-0006](../../../on-chain/decisions/ADR-0006-fronteira-onchain-offchain-kyc.md), seção "Atualização". Implementação de referência: `backend/src/services/trustedIssuerSigner.ts` (assinatura/envio da claim) e `backend/scripts/grant-trusted-issuer.ts` (provisionamento do backend como Trusted Issuer no `IdentityRegistry`). |
| RF-26 | O backend deve armazenar dados pessoais de KYC (CPF, documentos) em banco de dados próprio, sujeito à LGPD, nunca on-chain (ADR-0006). |

### Contrato de API (endpoints expostos por esta feature)
- `POST /investors` — cadastro do investidor; cria o registro e a carteira custodial (RF-21).
- `GET /investors/:id/kyc` — consulta o status de KYC do investidor.
- `POST /investors/:id/kyc` — submete (ou resubmete, após reprovação) os documentos ao provedor de KYC.
- `POST /webhooks/kyc/mock` — recebe o resultado assíncrono do provedor de KYC (idempotente).

Payloads, formato de erro e o vocabulário completo de códigos ficam em [`../../api-contract.md`](../../api-contract.md) (task 5 de `tasks.md`).

## Requisitos não funcionais
- **RNF-10 (LGPD)**: dados pessoais armazenados com controles de acesso e retenção conforme legislação brasileira.
- **RNF-11 (custódia de chaves)**: em produção, as chaves privadas das carteiras custodiais dos investidores e a chave do Trusted Issuer devem ser geridas por HSM/KMS. **Estado atual da POC (aceito, não bloqueante)**: ambas usam criptografia simétrica AES-256-GCM com chave de `.env` (`WALLET_ENC_KEY`), implementado em `backend/src/services/walletCustody.ts` e documentado ali mesmo como stub explícito. A migração para HSM/KMS é a task 1 de `tasks.md` (sem prazo definido) e não bloqueia esta spec: o volume da POC (≈20 investidores) e a ausência de captação real de varejo tornam o risco aceitável nesta fase (ver [ADR-0006](../../../on-chain/decisions/ADR-0006-fronteira-onchain-offchain-kyc.md) e `SEC-11` em [`security-checklist.md`](../../../on-chain/security-checklist.md), `parcialmente mitigado`).

## Cenários de aceite

| Cenário | Dado | Quando | Então |
|---|---|---|---|
| Cadastro cria carteira | Novo investidor completa cadastro | Backend processa o cadastro | Uma carteira custodial é criada e associada ao investidor, sem exigir nenhuma ação técnica dele |
| KYC submetido e aprovado | Investidor com carteira custodial já criada envia documentos | Provedor de KYC (ou mock) aprova e notifica o backend via webhook | Status interno do investidor muda para verificado; o **backend**, atuando como Trusted Issuer, emite a claim `KYC_APPROVED` on-chain para a carteira custodial e registra o hash da transação (`claimTxHash`) |
| KYC reprovado | Investidor envia documentos | Provedor de KYC reprova e notifica o backend via webhook | Status interno permanece não verificado; investidor é informado do motivo e pode reenviar documentos |
| Webhook duplicado (idempotência) | Um webhook de KYC aprovado já foi processado para um investidor | O mesmo resultado (mesma `providerReference`) é reentregue pelo provedor | Nenhuma claim adicional é emitida on-chain; o estado permanece `APPROVED` com o mesmo `claimTxHash` — a atualização de status usa uma condição de guarda (`status: PENDING`) para não reprocessar |
| Reenvio após reprovação | Investidor com KYC `REJECTED` | Ele chama novamente o endpoint de submissão de KYC | Uma nova submissão é aceita e o ciclo reinicia como `PENDING`; investidores com KYC `PENDING`/`PROCESSING`/`APPROVED` não podem resubmeter (conflito) |

## Fora de escopo desta feature
- Contratação do provedor de KYC específico (decisão de negócio — ver [`PENDENCIAS.md`](../../../PENDENCIAS.md)). **Não bloqueia** a aprovação desta spec: o fluxo já opera ponta a ponta com um provedor mock e o backend como Trusted Issuer; a contratação do provedor real é uma pendência de negócio não-bloqueante, rastreada em `PENDENCIAS.md`.
- Custódia real (HSM/KMS) da chave do Trusted Issuer e das carteiras custodiais — dívida técnica rastreada na task 1 de `tasks.md` e no [ADR-0006](../../../on-chain/decisions/ADR-0006-fronteira-onchain-offchain-kyc.md); não bloqueia esta spec.
- Execução de transações de investimento, claim de rendimentos ou mercado secundário — cobertas por [002](../002-investimento-primario/spec.md), [003](../003-portfolio-e-rendimentos/spec.md) e [004](../004-mercado-secundario/spec.md).
- Telas de cadastro/upload de documentos — cobertas por [`../../../frontend/features/001-interface-investidor`](../../../frontend/features/001-interface-investidor/spec.md).
