---
status: done
owner: tech-lead
last_updated: 2026-09-02
---

# Sprint 8 — Painel Administrativo e Segurança do Backend

## Objetivo
Implementar a feature de backend `005-painel-administrativo` e fechar a dívida de segurança transversal já identificada no scaffold real de `001` (nenhuma rota tem autenticação/autorização hoje). Esta sprint depende apenas dos **contratos on-chain** `002-tokenizacao-imovel` e `003-distribuicao-rendimentos` (já completos) — não do backend `002`/`003` (Sprint 6) — porque o painel do gestor opera diretamente sobre os contratos, não sobre os fluxos do investidor. Pode ser sequenciada em paralelo às Sprints 6/7 se houver capacidade; a dependência real é só a Sprint 5.

## Backlog
Referência: [`../backend/features/005-painel-administrativo/tasks.md`](../backend/features/005-painel-administrativo/tasks.md) (expandir com o mesmo nível de granularidade de [`001/tasks.md`](../backend/features/001-onboarding-e-custodia/tasks.md)).

- [x] **Mecanismo de autenticação/RBAC** (novo — não estava em nenhum `tasks.md` de feature; análogo ao "Setup do projeto" que a Sprint 1 on-chain adicionou fora das specs originais): decidido e implementado — chave estática `ADMIN_API_KEY` (header `x-admin-api-key`), decisão registrada em [`005/plan.md`](../backend/features/005-painel-administrativo/plan.md). Aplicado a **todas** as rotas administrativas (`backend/src/middleware/adminAuth.ts`). Avaliada retroativamente a exposição das rotas de `001-004`: seguem sem autenticação, aceita como dívida da POC (ver "Gap conhecido" em [`../backend/api-contract.md`](../backend/api-contract.md) e `SEC-B02` em [`../backend/security-checklist.md`](../backend/security-checklist.md)) — risco mitigado por RNF-16 (o contrato é sempre a última linha de defesa).
- [x] Endpoint de criação de imóvel (`POST /admin/imoveis`) — aciona `PropertyFactory.criarImovel` (RF-25).
- [x] Endpoint de depósito de rendimento (`POST /admin/imoveis/:id/depositar-rendimento`) — aciona `DividendDistributor.depositarRendimento` (RF-25). Substitui o `scripts/deposit-yield.ts` manual (removido).
- [x] Endpoint de consulta de investidores (`GET /admin/investidores`) — lê status de KYC armazenado em `001`.
- [x] Cenário de rejeição por role inválida em todos os 3 endpoints (revalidado também pelo próprio contrato via `PLATFORM_ADMIN_ROLE`/`GESTOR_ROLE`, RNF-16).
- [x] **Revisão de segurança off-chain** (task 7 de [`001/tasks.md`](../backend/features/001-onboarding-e-custodia/tasks.md), pendente desde a Sprint 5): checklist de segurança do backend publicado em [`../backend/security-checklist.md`](../backend/security-checklist.md), espelhando [`../on-chain/security-checklist.md`](../on-chain/security-checklist.md) — cobre ausência de PII em payload on-chain, custódia de chaves/CPF em repouso, controle de acesso ao banco (não avaliado — infraestrutura, fora do escopo de código) e a autenticação/RBAC introduzida nesta sprint.
- [x] Alinhar respostas de erro ao vocabulário de [`../backend/api-contract.md`](../backend/api-contract.md) — novo código `ROLE_INVALIDA` adicionado.
- [x] Testes de integração (unit + e2e gated) cobrindo os 3 endpoints e o cenário de role inválida — `backend/test/admin.routes.test.ts` (8 cenários) + `backend/test/property-flow.e2e.test.ts` atualizado para usar o endpoint real. Verificado também manualmente ponta a ponta contra Anvil local.

## Dependências / bloqueios
- Depende dos contratos on-chain `../on-chain/features/002-tokenizacao-imovel` (`PropertyFactory.criarImovel`) e `../on-chain/features/003-distribuicao-rendimentos` (`DividendDistributor.depositarRendimento`) — já completos e testados. **Não depende do backend `002`/`003` (Sprint 6).**
- Depende da Sprint 5 (spec `005` aprovada).

## Marco de saída
Painel administrativo funcionando ponta a ponta (criar imóvel, depositar rendimento, consultar KYC), com autenticação/RBAC cobrindo toda superfície administrativa do backend (todas as rotas `/admin/*`, não só os 3 endpoints desta feature), e o checklist de segurança off-chain publicado sem itens críticos em aberto. As rotas de negócio do investidor (`001-004`) permanecem sem autenticação — avaliado nesta sprint (era um requisito explícito do backlog) e aceito como dívida da POC em vez de resolvido, por não ter mecanismo de sessão/login em nenhuma feature de frontend prevista e por já serem sempre revalidadas on-chain (RNF-16); ver `SEC-B02` em [`../backend/security-checklist.md`](../backend/security-checklist.md). Fecha o backlog inicial das 5 features de backend planejadas em 2026-09-01.
