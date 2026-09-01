---
status: draft
owner: tech-lead
last_updated: 2026-09-01
---

# Tasks — Feature Backend 005

1. [ ] Implementar controle de acesso (RBAC) de papel administrativo/gestor.
2. [ ] Implementar endpoint de criação de imóvel, acionando `PropertyFactory.criarImovel` (depende de `../../../on-chain/features/002-tokenizacao-imovel` concluída).
3. [ ] Implementar endpoint de depósito de rendimento mensal, acionando `DividendDistributor.depositarRendimento` (depende de `../../../on-chain/features/003-distribuicao-rendimentos` concluída).
4. [ ] Implementar endpoint de consulta de status de KYC dos investidores, lendo os dados de [001](../001-onboarding-e-custodia/tasks.md).
5. [ ] Testes de integração e end-to-end em testnet Polygon.
6. [ ] Revisão de segurança (controle de acesso dos endpoints administrativos — apenas papel de admin aciona `PropertyFactory`/`DividendDistributor`).
