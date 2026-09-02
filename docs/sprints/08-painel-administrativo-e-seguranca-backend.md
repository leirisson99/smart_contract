---
status: not-started
owner: tech-lead
last_updated: 2026-09-02
---

# Sprint 8 — Painel Administrativo e Segurança do Backend

## Objetivo
Implementar a feature de backend `005-painel-administrativo` e fechar a dívida de segurança transversal já identificada no scaffold real de `001` (nenhuma rota tem autenticação/autorização hoje). Esta sprint depende apenas dos **contratos on-chain** `002-tokenizacao-imovel` e `003-distribuicao-rendimentos` (já completos) — não do backend `002`/`003` (Sprint 6) — porque o painel do gestor opera diretamente sobre os contratos, não sobre os fluxos do investidor. Pode ser sequenciada em paralelo às Sprints 6/7 se houver capacidade; a dependência real é só a Sprint 5.

## Backlog
Referência: [`../backend/features/005-painel-administrativo/tasks.md`](../backend/features/005-painel-administrativo/tasks.md) (expandir com o mesmo nível de granularidade de [`001/tasks.md`](../backend/features/001-onboarding-e-custodia/tasks.md)).

- [ ] **Mecanismo de autenticação/RBAC** (novo — não estava em nenhum `tasks.md` de feature; análogo ao "Setup do projeto" que a Sprint 1 on-chain adicionou fora das specs originais): decidir e implementar como o backend autentica o gestor e diferencia seu papel do investidor comum (JWT, API key ou sessão — decisão de `005/plan.md`). Aplicar esse middleware a **todas** as rotas administrativas e, retroativamente, avaliar a exposição das rotas de `001-004` hoje sem autenticação nenhuma.
- [ ] Endpoint de criação de imóvel (`POST /admin/imoveis`) — aciona `PropertyFactory.criarImovel` (RF-25).
- [ ] Endpoint de depósito de rendimento (`POST /admin/imoveis/:id/depositar-rendimento`) — aciona `DividendDistributor.depositarRendimento` (RF-25).
- [ ] Endpoint de consulta de investidores (`GET /admin/investidores`) — lê status de KYC armazenado em `001`.
- [ ] Cenário de rejeição por role inválida em todos os 3 endpoints (revalidado também pelo próprio contrato via `PLATFORM_ADMIN_ROLE`, RNF-16).
- [ ] **Revisão de segurança off-chain** (task 7 de [`001/tasks.md`](../backend/features/001-onboarding-e-custodia/tasks.md), ainda pendente): produzir um checklist de segurança do backend espelhando [`../on-chain/security-checklist.md`](../on-chain/security-checklist.md) — cobrindo ausência de PII em payload on-chain, controle de acesso ao banco, e agora também a autenticação/RBAC introduzida nesta sprint.
- [ ] Alinhar respostas de erro ao vocabulário de [`../backend/api-contract.md`](../backend/api-contract.md).
- [ ] Testes de integração (unit + e2e gated) cobrindo os 3 endpoints e o cenário de role inválida.

## Dependências / bloqueios
- Depende dos contratos on-chain `../on-chain/features/002-tokenizacao-imovel` (`PropertyFactory.criarImovel`) e `../on-chain/features/003-distribuicao-rendimentos` (`DividendDistributor.depositarRendimento`) — já completos e testados. **Não depende do backend `002`/`003` (Sprint 6).**
- Depende da Sprint 5 (spec `005` aprovada).

## Marco de saída
Painel administrativo funcionando ponta a ponta (criar imóvel, depositar rendimento, consultar KYC), com autenticação/RBAC mínima viável cobrindo toda a API do backend (não só esta feature), e o checklist de segurança off-chain publicado sem itens críticos em aberto. Fecha o backlog inicial das 5 features de backend planejadas em 2026-09-01.
