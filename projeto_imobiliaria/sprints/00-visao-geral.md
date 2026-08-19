---
status: approved
owner: tech-lead
last_updated: 2026-08-19
---

# Sprints — Visão Geral

## Escopo atual: só a trilha de Smart Contract

Por decisão do time, as sprints abaixo cobrem **exclusivamente a construção dos contratos** (`specs/features/001-identidade-kyc` a `004-mercado-secundario`), que corresponde à Fase 2 — Smart Contract do roadmap (`specs/roadmap.md`, semanas 3-6). As sprints de Jurídico (Fase 1), Backend (`specs-backend/`), Frontend (`specs-frontend/`) e Operação Piloto (Fase 4) ainda não foram quebradas em sprint e serão adicionadas quando essa trilha entrar em execução.

## Premissas
- **Cadência**: 1 sprint = 1 semana. É uma sugestão compatível com a janela de 4 semanas que o roadmap já reserva para "Smart Contract" (semanas 3-6), assumindo 1-2 desenvolvedores Solidity dedicados e as specs já aprovadas (não há mais desenho a fazer, só implementação TDD). Ajuste a duração se o time real for menor ou o ritmo for outro — a ordem/dependência entre sprints é o que importa, não o calendário.
- **Metodologia**: cada contrato segue TDD (teste escrito e falhando — red — antes da implementação — green — antes do refactor), conforme `specs/00-constitution.md`. Nenhuma sprint marca uma feature como concluída sem os itens de `specs/security-checklist.md` correspondentes mitigados.
- **Ordem**: segue a dependência real entre contratos (ver tabela em `plan.md`, seção "Contratos/módulos por feature" original) — `001` é base de todos os outros; `002` depende de `001`; `003` e `004` dependem de `002` (e `004` também de `001`).

## Sprints desta trilha

| Sprint | Semana sugerida | Foco | Status |
|---|---|---|---|
| [Sprint 1](sprint-01-fundacao-identidade-kyc.md) | 3 | Setup do projeto Foundry + Feature `001-identidade-kyc` | not-started |
| [Sprint 2](sprint-02-tokenizacao-imovel.md) | 4 | Feature `002-tokenizacao-imovel` | not-started |
| [Sprint 3](sprint-03-rendimentos-e-mercado-secundario.md) | 5 | Features `003-distribuicao-rendimentos` e `004-mercado-secundario` | not-started |
| [Sprint 4](sprint-04-seguranca-e-preparacao-auditoria.md) | 6 | Consolidação de segurança e preparação para auditoria externa | not-started |

## Definition of Done de uma sprint desta trilha
- Todo cenário Dado/Quando/Então da(s) feature(s) da sprint tem um teste Foundry correspondente, e todos passam.
- `forge coverage` das funções de escrita da feature está em 100%.
- Os itens de `specs/security-checklist.md` atribuídos à feature estão marcados como mitigados.
- Deploy e fork test contra a testnet Polygon (Amoy) executados com sucesso.

## Como uma sprint é lida
Cada arquivo `sprint-XX-*.md` tem: objetivo, backlog (com referência ao item original em `tasks.md` da feature, para rastreabilidade), dependências/bloqueios, e marco de saída.
