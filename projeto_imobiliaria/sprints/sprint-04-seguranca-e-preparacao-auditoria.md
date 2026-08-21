---
status: in-progress
owner: tech-lead
last_updated: 2026-08-21
---

# Sprint 4 — Consolidação de Segurança e Preparação para Auditoria

## Objetivo
Fechar 100% do [`specs/security-checklist.md`](../specs/security-checklist.md), rodar ferramentas de análise de segurança em todos os contratos, e deixar o código pronto para ser enviado a uma auditoria externa — pré-requisito da Fase 4 do roadmap (`specs/roadmap.md`).

## Backlog

- [x] Rodar `forge coverage` em todos os 6 contratos; garantir 100% nas funções de escrita e de decisão de compliance (meta definida em cada `test-strategy.md` de feature). 100% linhas/branches/funções mantido (110 testes).
- [x] Rodar análise estática (Slither) em todos os contratos; triar e resolver findings. 22 → 9 findings; 13 corrigidos no código (ver `PROGRESS.md`, `specs/slither-triage.md`), 9 restantes justificados.
- [~] Rodar análise dinâmica (Mythril) nos contratos de maior risco: `PropertyToken` e `DividendDistributor`. Não executável neste ambiente Windows (instalação nativa falha, Docker local indisponível) — pendente rodar em CI/Linux ou WSL2 (ver `specs/audit-package.md`).
- [~] Revisar e marcar como mitigados os itens restantes de `specs/security-checklist.md` (`SEC-01` a `SEC-12`) que ainda não tiverem sido fechados nas sprints anteriores. `SEC-11` passou de `pendente` para `parcialmente mitigado` — processo de rotação documentado (`specs/runbooks/rotacao-trusted-issuer.md`); custódia real ainda depende da contratação do provedor de KYC (`PENDENCIAS.md`).
- [x] Revisar `risks.md` de cada feature (`001` a `004`) — confirmar que todo `RISK-XX` está mitigado ou formalmente aceito.
- [ ] Congelar uma versão do código (tag de release) para envio à auditoria externa.
- [x] Documentar escopo e materiais de apoio para o auditor (`specs/audit-package.md`, além de `specs/features/*/contracts/*.md`).
- [ ] Ação de negócio (fora do código): contratar e agendar a auditoria externa.

## Dependências / bloqueios
- Depende das Sprints 1-3 concluídas (todos os 6 contratos implementados e testados).

## Marco de saída
Pacote de contratos auditável: 100% do checklist de segurança mitigado, cobertura de testes completa, findings de ferramentas estáticas/dinâmicas tratados. Corresponde ao marco de saída da Fase 2 do roadmap ("contratos auditados, deployados em testnet Polygon, prontos para integração com a plataforma") — a auditoria em si roda em paralelo às sprints seguintes (backend/frontend), que ainda serão planejadas.
