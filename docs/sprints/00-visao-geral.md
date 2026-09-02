---
status: approved
owner: tech-lead
last_updated: 2026-09-02
---

# Sprints — Visão Geral

## Escopo: trilha de Smart Contract (1-4) + trilha de Backend (5-8)

As sprints 1-4 cobrem **a construção dos contratos** (`../on-chain/features/001-identidade-kyc` a `004-mercado-secundario`), que corresponde à Fase 2 — Smart Contract do roadmap (`../on-chain/roadmap.md`, semanas 3-6). A partir de 2026-09-02, a trilha de **Backend** (`../backend/features`) também foi quebrada em sprints (5-8, ver tabela abaixo) — antes disso, o texto original desta seção dizia que o backend "ainda não tinha sido quebrado em sprint"; isso deixou de valer com a Sprint 5. Jurídico (Fase 1), Frontend (`frontend/`) e Operação Piloto (Fase 4) seguem sem quebra em sprint, a ser adicionada quando essas trilhas entrarem em execução.

## Premissas
- **Cadência**: 1 sprint = 1 semana. É uma sugestão compatível com a janela de 4 semanas que o roadmap já reserva para "Smart Contract" (semanas 3-6), assumindo 1-2 desenvolvedores Solidity dedicados e as specs já aprovadas (não há mais desenho a fazer, só implementação TDD). Ajuste a duração se o time real for menor ou o ritmo for outro — a ordem/dependência entre sprints é o que importa, não o calendário.
- **Metodologia**: cada contrato segue TDD (teste escrito e falhando — red — antes da implementação — green — antes do refactor), conforme `../on-chain/00-constitution.md`. Nenhuma sprint marca uma feature como concluída sem os itens de `../on-chain/security-checklist.md` correspondentes mitigados.
- **Ordem**: segue a dependência real entre contratos (ver tabela em `plan.md`, seção "Contratos/módulos por feature" original) — `001` é base de todos os outros; `002` depende de `001`; `003` e `004` dependem de `002` (e `004` também de `001`).

## Sprints — trilha Smart Contract

| Sprint | Semana sugerida | Foco | Status |
|---|---|---|---|
| [Sprint 1](sprint-01-fundacao-identidade-kyc.md) | 3 | Setup do projeto Foundry + Feature `001-identidade-kyc` | in-progress |
| [Sprint 2](sprint-02-tokenizacao-imovel.md) | 4 | Feature `002-tokenizacao-imovel` | in-progress |
| [Sprint 3](sprint-03-rendimentos-e-mercado-secundario.md) | 5 | Features `003-distribuicao-rendimentos` e `004-mercado-secundario` | in-progress |
| [Sprint 4](sprint-04-seguranca-e-preparacao-auditoria.md) | 6 | Consolidação de segurança e preparação para auditoria externa | in-progress |

### Definition of Done — trilha Smart Contract
- Todo cenário Dado/Quando/Então da(s) feature(s) da sprint tem um teste Foundry correspondente, e todos passam.
- `forge coverage` das funções de escrita da feature está em 100%.
- Os itens de `../on-chain/security-checklist.md` atribuídos à feature estão marcados como mitigados.
- Deploy e fork test contra a testnet Polygon (Amoy) executados com sucesso.

## Sprints — trilha Backend

| Sprint | Foco | Status |
|---|---|---|
| [Sprint 5](05-reconciliacao-e-aprovacao-especificacoes-backend.md) | Reconciliar specs de `001` com o código real, formalizar backend-como-Trusted-Issuer (ADR-0006), aprovar specs `002-005`, publicar `../backend/api-contract.md` | done |
| [Sprint 6](06-investimento-e-portfolio.md) | Features `002-investimento-primario` e `003-portfolio-e-rendimentos` (paralelizáveis entre si) | in-progress |
| [Sprint 7](07-mercado-secundario.md) | Feature `004-mercado-secundario` (paralelizável à Sprint 6) | not-started |
| [Sprint 8](08-painel-administrativo-e-seguranca-backend.md) | Feature `005-painel-administrativo` + autenticação/RBAC transversal + revisão de segurança off-chain | not-started |

### Definition of Done — trilha Backend
- Todo cenário Dado/Quando/Então da(s) feature(s) da sprint tem teste correspondente (unit + integração; e2e gated contra Anvil local onde há integração on-chain), e todos passam.
- Respostas de erro dos endpoints novos seguem [`../backend/api-contract.md`](../backend/api-contract.md).
- RNF-16 (última linha de defesa) verificado para todo endpoint que executa ação de negócio.

## Como uma sprint é lida
Cada arquivo `sprint-XX-*.md` (trilha Smart Contract) ou `0X-*.md` (trilha Backend) tem: objetivo, backlog (com referência ao item original em `tasks.md` da feature, para rastreabilidade), dependências/bloqueios, e marco de saída.
