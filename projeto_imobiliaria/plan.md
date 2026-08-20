# Tokenização Imobiliária — Índice do Pacote de Especificações

> Documento-índice. Conteúdo técnico substantivo vive em `specs/` (smart contracts / on-chain), `specs-backend/` (API e serviços off-chain) e `specs-frontend/` (interface) — este arquivo só navega e reporta status.

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
| [`specs/guia-conhecimentos-tecnicos.md`](specs/guia-conhecimentos-tecnicos.md) | O que você precisa saber (técnico: blockchain, tokens, segurança, metodologia) para acompanhar o projeto | approved |
| [`specs/guia-conhecimentos-nao-tecnicos.md`](specs/guia-conhecimentos-nao-tecnicos.md) | O que você precisa saber (não técnico: regulação, compliance, negócio) para acompanhar o projeto | approved |
| [`specs/guia-conhecimentos-solidity.md`](specs/guia-conhecimentos-solidity.md) | O que você precisa saber (linguagem Solidity, EVM, OpenZeppelin, Foundry) para implementar os contratos | approved |
| [`sprints/00-visao-geral.md`](sprints/00-visao-geral.md) | Sprints de execução — atualmente só a trilha de Smart Contract | approved |
| [`PROGRESS.md`](PROGRESS.md) | Log cronológico do que já foi implementado, testado e verificado (código, não specs) | living-document |

### Decisões arquiteturais (ADRs)

| ADR | Decisão | Status |
|---|---|---|
| [ADR-0001](specs/decisions/ADR-0001-padrao-token-erc-3643.md) | Padrão de token: ERC-3643 (não ERC-1400 como no pitch original) | approved |
| [ADR-0002](specs/decisions/ADR-0002-rede-polygon.md) | Rede: Polygon PoS | approved |
| [ADR-0003](specs/decisions/ADR-0003-toolchain-foundry.md) | Toolchain: Foundry | approved |
| [ADR-0004](specs/decisions/ADR-0004-modelo-distribuicao-rendimentos.md) | Distribuição de rendimentos: pull-payment | approved |
| [ADR-0005](specs/decisions/ADR-0005-estrategia-upgradability.md) | Upgradability: contratos imutáveis por imóvel | approved |
| [ADR-0006](specs/decisions/ADR-0006-fronteira-onchain-offchain-kyc.md) | Fronteira on-chain/off-chain do KYC | approved |

### Features — Smart Contract (`specs/features/`)

| Feature | Descrição | Contratos | Status |
|---|---|---|---|
| [001-identidade-kyc](specs/features/001-identidade-kyc/spec.md) | Identidade verificada e compliance | `IdentityRegistry`, `ComplianceModule` | draft |
| [002-tokenizacao-imovel](specs/features/002-tokenizacao-imovel/spec.md) | Emissão de cotas do imóvel | `PropertyToken`, `PropertyFactory` | draft |
| [003-distribuicao-rendimentos](specs/features/003-distribuicao-rendimentos/spec.md) | Distribuição mensal de aluguel | `DividendDistributor` | draft |
| [004-mercado-secundario](specs/features/004-mercado-secundario/spec.md) | Negociação de cotas entre investidores | `Marketplace` | draft |

Cada feature contém: `spec.md` (requisitos + cenários de aceite), `plan.md` (arquitetura), `contracts/*.md` (specs de contrato), `test-strategy.md` (estratégia TDD com Foundry — ADR-0003), `risks.md` (riscos específicos) e `tasks.md` (checklist de execução).

### Features — Backend (`specs-backend/features/`)

Pacote separado para specs de API e serviços off-chain (custódia, onboarding de KYC, assinatura de transações em nome do investidor, jobs, armazenamento de PII). Não segue TDD com Foundry — sua própria `test-strategy.md` cobre testes de integração/end-to-end da camada off-chain. É a única camada off-chain que fala diretamente com os contratos.

| Feature | Descrição | Depende de (on-chain) | Status |
|---|---|---|---|
| [001-plataforma-investidor](specs-backend/features/001-plataforma-investidor/spec.md) | API e serviços (onboarding, custódia, execução de transações, painel administrativo) | 001, 002, 003, 004 | draft |

### Features — Frontend (`specs-frontend/features/`)

Pacote separado para specs de interface (telas, estados, interações). Nunca acessa contratos diretamente — consome exclusivamente a API descrita em `specs-backend/`.

| Feature | Descrição | Depende de | Status |
|---|---|---|---|
| [001-interface-investidor](specs-frontend/features/001-interface-investidor/spec.md) | Telas de cadastro/KYC, imóvel, portfólio, painel do gestor, mercado secundário | `specs-backend/features/001-plataforma-investidor` | draft |

Cada feature (backend ou frontend) contém: `spec.md`, `plan.md`, `integration.md` (mapa de dependências com a camada anterior), `test-strategy.md` e `tasks.md`.

## Roadmap resumido

| Semanas | Fase | Detalhe |
|---|---|---|
| 1-4 | Fundação Jurídica | SPE, enquadramento CVM 588, advogado cripto |
| 3-6 | Smart Contract | Todas as features de `specs/features/` (001-004), TDD completo, auditoria |
| 5-10 | Plataforma Digital | `specs-backend/features/001-plataforma-investidor` + `specs-frontend/features/001-interface-investidor` |
| 9-16 | Operação Piloto | 1 imóvel, 20 investidores, 2 ciclos de aluguel |

Detalhe completo e tracker de perguntas em aberto: [`specs/roadmap.md`](specs/roadmap.md). Quebra em sprints (hoje só a trilha de Smart Contract): [`sprints/00-visao-geral.md`](sprints/00-visao-geral.md).

## Changelog

| Data | Mudança |
|---|---|
| 2026-08-17 | Criação do pacote inicial de especificações (constituição, ADRs, 5 features, roadmap, checklist de segurança) a partir do pitch `tokenizacao-imobiliaria-poc.pptx`. |
| 2026-08-17 | Adição do guia de conhecimentos necessários para acompanhar o projeto. |
| 2026-08-17 | Separação das specs de backend/plataforma em `specs-backend/` (antiga feature `005-plataforma-investidor` de `specs/` virou `specs-backend/features/001-plataforma-investidor`). |
| 2026-08-17 | Separação das specs de frontend em `specs-frontend/` — requisitos de UI (RF-27 a RF-32) extraídos de `specs-backend/features/001-plataforma-investidor` para `specs-frontend/features/001-interface-investidor`; backend mantém RF-21 a RF-26 reescritos como API/serviço. |
| 2026-08-19 | Criação de `sprints/` com a quebra em sprints da trilha de Smart Contract (features `001` a `004` de `specs/features/`) — foco definido para ser o primeiro a entrar em execução, antes de backend/frontend/jurídico. |
