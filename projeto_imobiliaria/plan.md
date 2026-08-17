# Tokenização Imobiliária — Índice do Pacote de Especificações

> Documento-índice. Conteúdo técnico substantivo vive em `specs/` — este arquivo só navega e reporta status.

## Sumário executivo

Projeto de tokenização de imóveis via smart contracts (ver `tokenizacao-imobiliaria-poc.pptx`): um imóvel de R$10M é dividido em 1.000 cotas digitais de R$10.000 cada, negociáveis livremente, com rendimento de aluguel distribuído automaticamente aos holders. Objetivo desta POC de 16 semanas: validar o modelo com 1 imóvel e 20 investidores reais.

Este pacote de especificações segue **Spec-Driven Development (SDD)** — toda implementação futura é derivada de specs aprovadas — e **Test-Driven Development (TDD)** — todo contrato nasce de um teste que falha antes de existir. Ver princípios completos em [`specs/00-constitution.md`](specs/00-constitution.md).

## Como navegar

| Documento | Conteúdo | Status |
|---|---|---|
| [`specs/00-constitution.md`](specs/00-constitution.md) | Missão, princípios de engenharia e compliance, papéis, Definition of Done | approved |
| [`specs/glossary.md`](specs/glossary.md) | Termos técnicos e regulatórios | approved |
| [`specs/roadmap.md`](specs/roadmap.md) | Specs × 16 semanas da POC + tracker de perguntas em aberto (pitch, slide 8) | approved |
| [`specs/security-checklist.md`](specs/security-checklist.md) | Checklist consolidado pré-auditoria (SEC-01 a SEC-12) | draft |
| [`specs/guia-conhecimentos-necessarios.md`](specs/guia-conhecimentos-necessarios.md) | O que você precisa saber para acompanhar o projeto, e por quê | approved |

### Decisões arquiteturais (ADRs)

| ADR | Decisão | Status |
|---|---|---|
| [ADR-0001](specs/decisions/ADR-0001-padrao-token-erc-3643.md) | Padrão de token: ERC-3643 (não ERC-1400 como no pitch original) | approved |
| [ADR-0002](specs/decisions/ADR-0002-rede-polygon.md) | Rede: Polygon PoS | approved |
| [ADR-0003](specs/decisions/ADR-0003-toolchain-foundry.md) | Toolchain: Foundry | approved |
| [ADR-0004](specs/decisions/ADR-0004-modelo-distribuicao-rendimentos.md) | Distribuição de rendimentos: pull-payment | approved |
| [ADR-0005](specs/decisions/ADR-0005-estrategia-upgradability.md) | Upgradability: contratos imutáveis por imóvel | approved |
| [ADR-0006](specs/decisions/ADR-0006-fronteira-onchain-offchain-kyc.md) | Fronteira on-chain/off-chain do KYC | approved |

### Features

| Feature | Descrição | Contratos | Status |
|---|---|---|---|
| [001-identidade-kyc](specs/features/001-identidade-kyc/spec.md) | Identidade verificada e compliance | `IdentityRegistry`, `ComplianceModule` | draft |
| [002-tokenizacao-imovel](specs/features/002-tokenizacao-imovel/spec.md) | Emissão de cotas do imóvel | `PropertyToken`, `PropertyFactory` | draft |
| [003-distribuicao-rendimentos](specs/features/003-distribuicao-rendimentos/spec.md) | Distribuição mensal de aluguel | `DividendDistributor` | draft |
| [004-mercado-secundario](specs/features/004-mercado-secundario/spec.md) | Negociação de cotas entre investidores | `Marketplace` | draft |
| [005-plataforma-investidor](specs/features/005-plataforma-investidor/spec.md) | UX off-chain (onboarding, portfólio, painel do gestor) | — (off-chain) | draft |

Cada feature contém: `spec.md` (requisitos + cenários de aceite), `plan.md` (arquitetura), `contracts/*.md` (specs de contrato quando aplicável), `test-strategy.md` (estratégia TDD), `risks.md` (riscos específicos) e `tasks.md` (checklist de execução).

## Roadmap resumido

| Semanas | Fase | Detalhe |
|---|---|---|
| 1-4 | Fundação Jurídica | SPE, enquadramento CVM 588, advogado cripto |
| 3-6 | Smart Contract | Todas as features on-chain (001-004), TDD completo, auditoria |
| 5-10 | Plataforma Digital | Feature 005 |
| 9-16 | Operação Piloto | 1 imóvel, 20 investidores, 2 ciclos de aluguel |

Detalhe completo e tracker de perguntas em aberto: [`specs/roadmap.md`](specs/roadmap.md).

## Changelog

| Data | Mudança |
|---|---|
| 2026-08-17 | Criação do pacote inicial de especificações (constituição, ADRs, 5 features, roadmap, checklist de segurança) a partir do pitch `tokenizacao-imobiliaria-poc.pptx`. |
| 2026-08-17 | Adição do guia de conhecimentos necessários para acompanhar o projeto. |
