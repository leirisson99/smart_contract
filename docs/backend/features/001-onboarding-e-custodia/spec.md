---
status: draft
owner: tech-lead
last_updated: 2026-09-01
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
| RF-33 | O backend deve orquestrar o fluxo de KYC: receber os documentos do investidor, submetê-los ao provedor externo (Trusted Issuer), e processar o retorno (webhook/callback) atualizando o status interno de verificação. A emissão da claim on-chain (`IdentityRegistry.emitirClaim`) é feita pelo provedor, não pelo backend — ver [`../../../on-chain/features/001-identidade-kyc`](../../../on-chain/features/001-identidade-kyc/spec.md). |
| RF-26 | O backend deve armazenar dados pessoais de KYC (CPF, documentos) em banco de dados próprio, sujeito à LGPD, nunca on-chain (ADR-0006). |

## Requisitos não funcionais
- **RNF-10 (LGPD)**: dados pessoais armazenados com controles de acesso e retenção conforme legislação brasileira.
- **RNF-11 (custódia de chaves)**: chaves privadas das carteiras custodiais geridas com práticas de segurança adequadas (HSM ou equivalente) — fora do escopo de contratos on-chain, mas crítico para a segurança geral do sistema.

## Cenários de aceite

| Cenário | Dado | Quando | Então |
|---|---|---|---|
| Cadastro cria carteira | Novo investidor completa cadastro | Backend processa o cadastro | Uma carteira custodial é criada e associada ao investidor, sem exigir nenhuma ação técnica dele |
| KYC submetido e aprovado | Investidor com carteira custodial já criada envia documentos | Provedor de KYC aprova e notifica o backend via webhook | Status interno do investidor muda para verificado; o provedor emite a claim `KYC_APPROVED` on-chain para a carteira custodial |
| KYC reprovado | Investidor envia documentos | Provedor de KYC reprova e notifica o backend via webhook | Status interno permanece não verificado; investidor é informado do motivo e pode reenviar documentos |

## Fora de escopo desta feature
- Contratação do provedor de KYC específico (decisão de negócio — ver [`PENDENCIAS.md`](../../../PENDENCIAS.md)).
- Execução de transações de investimento, claim de rendimentos ou mercado secundário — cobertas por [002](../002-investimento-primario/spec.md), [003](../003-portfolio-e-rendimentos/spec.md) e [004](../004-mercado-secundario/spec.md).
- Telas de cadastro/upload de documentos — cobertas por [`../../../frontend/features/001-interface-investidor`](../../../frontend/features/001-interface-investidor/spec.md).
