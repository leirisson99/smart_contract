# Tokenização Imobiliária — Índice do Pacote de Especificações

> Documento-índice. Conteúdo técnico substantivo vive em `on-chain/` (smart contracts / on-chain) e `frontend/` (interface), neste repositório, e em [`backend/features`](backend/features) (API e serviços off-chain), no repositório irmão `backend/` — este arquivo só navega e reporta status.

## Sumário executivo

Projeto de tokenização de imóveis via smart contracts (ver `tokenizacao-imobiliaria-poc.pptx`): um imóvel de R$10M é dividido em 1.000 cotas digitais de R$10.000 cada, negociáveis livremente, com rendimento de aluguel distribuído automaticamente aos holders. Objetivo desta POC de 16 semanas: validar o modelo com 1 imóvel e 20 investidores reais.

Este pacote de especificações segue **Spec-Driven Development (SDD)** — toda implementação futura é derivada de specs aprovadas — e **Test-Driven Development (TDD)** — todo contrato nasce de um teste que falha antes de existir. Ver princípios completos em [`on-chain/00-constitution.md`](on-chain/00-constitution.md).

## Como navegar

| Documento | Conteúdo | Status |
|---|---|---|
| [`on-chain/00-constitution.md`](on-chain/00-constitution.md) | Missão, princípios de engenharia e compliance, papéis, Definition of Done | approved |
| [`on-chain/glossary.md`](on-chain/glossary.md) | Termos técnicos e regulatórios | approved |
| [`on-chain/roadmap.md`](on-chain/roadmap.md) | Specs × 16 semanas da POC + tracker de perguntas em aberto (pitch, slide 8) | approved |
| [`on-chain/security-checklist.md`](on-chain/security-checklist.md) | Checklist consolidado pré-auditoria (SEC-01 a SEC-12) | draft |
| [`on-chain/guia-conhecimentos-tecnicos.md`](on-chain/guia-conhecimentos-tecnicos.md) | O que você precisa saber (técnico: blockchain, tokens, segurança, metodologia) para acompanhar o projeto | approved |
| [`on-chain/guia-conhecimentos-nao-tecnicos.md`](on-chain/guia-conhecimentos-nao-tecnicos.md) | O que você precisa saber (não técnico: regulação, compliance, negócio) para acompanhar o projeto | approved |
| [`on-chain/guia-conhecimentos-solidity.md`](on-chain/guia-conhecimentos-solidity.md) | O que você precisa saber (linguagem Solidity, EVM, OpenZeppelin, Foundry) para implementar os contratos | approved |
| [`sprints/00-visao-geral.md`](sprints/00-visao-geral.md) | Sprints de execução — atualmente só a trilha de Smart Contract | approved |
| [`PROGRESS.md`](PROGRESS.md) | Log cronológico do que já foi implementado, testado e verificado (código, não specs) | living-document |
| [`PENDENCIAS.md`](PENDENCIAS.md) | Bloqueios e itens técnicos em aberto (setup, segurança, sprints) | living-document |

### Decisões arquiteturais (ADRs)

| ADR | Decisão | Status |
|---|---|---|
| [ADR-0001](on-chain/decisions/ADR-0001-padrao-token-erc-3643.md) | Padrão de token: ERC-3643 (não ERC-1400 como no pitch original) | approved |
| [ADR-0002](on-chain/decisions/ADR-0002-rede-polygon.md) | Rede: Polygon PoS | approved |
| [ADR-0003](on-chain/decisions/ADR-0003-toolchain-foundry.md) | Toolchain: Foundry | approved |
| [ADR-0004](on-chain/decisions/ADR-0004-modelo-distribuicao-rendimentos.md) | Distribuição de rendimentos: pull-payment | approved |
| [ADR-0005](on-chain/decisions/ADR-0005-estrategia-upgradability.md) | Upgradability: contratos imutáveis por imóvel | approved |
| [ADR-0006](on-chain/decisions/ADR-0006-fronteira-onchain-offchain-kyc.md) | Fronteira on-chain/off-chain do KYC | approved |

### Features — Smart Contract (`on-chain/features`)

| Feature | Descrição | Contratos | Status |
|---|---|---|---|
| [001-identidade-kyc](on-chain/features/001-identidade-kyc/spec.md) | Identidade verificada e compliance | `IdentityRegistry`, `ComplianceModule` | draft |
| [002-tokenizacao-imovel](on-chain/features/002-tokenizacao-imovel/spec.md) | Emissão de cotas do imóvel | `PropertyToken`, `PropertyFactory` | draft |
| [003-distribuicao-rendimentos](on-chain/features/003-distribuicao-rendimentos/spec.md) | Distribuição mensal de aluguel | `DividendDistributor` | draft |
| [004-mercado-secundario](on-chain/features/004-mercado-secundario/spec.md) | Negociação de cotas entre investidores | `Marketplace` | draft |

Cada feature contém: `spec.md` (requisitos + cenários de aceite), `plan.md` (arquitetura), `contracts/*.md` (specs de contrato), `test-strategy.md` (estratégia TDD com Foundry — ADR-0003), `risks.md` (riscos específicos) e `tasks.md` (checklist de execução).

### Features — Backend (`backend/features`, repositório irmão)

Pacote separado (fora deste repositório) para specs de API e serviços off-chain (custódia, onboarding de KYC, assinatura de transações em nome do investidor, jobs, armazenamento de PII). Não segue TDD com Foundry — o `implement.md` de cada feature cobre a estratégia de testes de integração/end-to-end da camada off-chain. É a única camada off-chain que fala diretamente com os contratos.

| Feature | Descrição | Depende de (on-chain) | Status |
|---|---|---|---|
| [001-onboarding-e-custodia](backend/features/001-onboarding-e-custodia/spec.md) | Cadastro, carteira custodial automática, orquestração de KYC, armazenamento de PII (LGPD) | 001 | draft |
| [002-investimento-primario](backend/features/002-investimento-primario/spec.md) | Consulta do imóvel disponível e compra de cotas em nome do investidor | 002 | draft |
| [003-portfolio-e-rendimentos](backend/features/003-portfolio-e-rendimentos/spec.md) | Leitura de portfólio e claim automático de rendimentos | 003 | draft |
| [004-mercado-secundario](backend/features/004-mercado-secundario/spec.md) | Listagem e compra de cotas entre investidores | 004 | draft |
| [005-painel-administrativo](backend/features/005-painel-administrativo/spec.md) | Endpoints do gestor: criar imóvel, depositar rendimento, consultar status de KYC | 002, 003 | draft |

### Features — Frontend (`frontend/features`)

Pacote separado para specs de interface (telas, estados, interações). Nunca acessa contratos diretamente — consome exclusivamente a API descrita em `backend/features`.

| Feature | Descrição | Depende de | Status |
|---|---|---|---|
| [001-interface-investidor](frontend/features/001-interface-investidor/spec.md) | Telas de cadastro/KYC, imóvel, portfólio, painel do gestor, mercado secundário | `backend/features` (5 features) | draft |

Backend (`backend/features`): cada feature contém `spec.md`, `plan.md`, `tasks.md` e `implement.md` (mapa de integração on-chain + estratégia de testes + status de implementação, consolidados). Frontend (`frontend/features`): cada feature contém `spec.md`, `plan.md`, `integration.md` (mapa de dependências com o backend), `test-strategy.md` e `tasks.md`.

## Roadmap resumido

| Semanas | Fase | Detalhe |
|---|---|---|
| 1-4 | Fundação Jurídica | SPE, enquadramento CVM 588, advogado cripto |
| 3-6 | Smart Contract | Todas as features de `on-chain/features` (001-004), TDD completo, auditoria |
| 5-10 | Plataforma Digital | `backend/features` (5 features) + `frontend/features/001-interface-investidor` |
| 9-16 | Operação Piloto | 1 imóvel, 20 investidores, 2 ciclos de aluguel |

Detalhe completo e tracker de perguntas em aberto: [`on-chain/roadmap.md`](on-chain/roadmap.md). Quebra em sprints (hoje só a trilha de Smart Contract): [`sprints/00-visao-geral.md`](sprints/00-visao-geral.md).

## Changelog

| Data | Mudança |
|---|---|
| 2026-08-17 | Criação do pacote inicial de especificações (constituição, ADRs, 5 features, roadmap, checklist de segurança) a partir do pitch `tokenizacao-imobiliaria-poc.pptx`. |
| 2026-08-17 | Adição do guia de conhecimentos necessários para acompanhar o projeto. |
| 2026-08-17 | Separação das specs de backend/plataforma em `specs-backend/` (antiga feature `005-plataforma-investidor` de `specs/` virou `specs-backend/features/001-plataforma-investidor`). |
| 2026-08-17 | Separação das specs de frontend em `specs-frontend/` — requisitos de UI (RF-27 a RF-32) extraídos de `specs-backend/features/001-plataforma-investidor` para `frontend/features/001-interface-investidor`; backend mantém RF-21 a RF-26 reescritos como API/serviço. |
| 2026-08-19 | Criação de `sprints/` com a quebra em sprints da trilha de Smart Contract (features `001` a `004` de `on-chain/features`) — foco definido para ser o primeiro a entrar em execução, antes de backend/frontend/jurídico. |
| 2026-09-01 | Specs de backend movidas para fora deste repositório, para `backend/features` (repositório irmão) — a antiga feature única `specs-backend/features/001-plataforma-investidor` (RF-21 a RF-26) foi quebrada em 5 features menores (`001-onboarding-e-custodia`, `002-investimento-primario`, `003-portfolio-e-rendimentos`, `004-mercado-secundario`, `005-painel-administrativo`; RF-33 a RF-35 adicionados para orquestração de KYC e mercado secundário, antes só mapeados em `integration.md` sem RF próprio). Cada feature backend passa a usar `spec.md`/`plan.md`/`tasks.md`/`implement.md` (este último substitui `integration.md` + `test-strategy.md`). |
