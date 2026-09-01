---
status: draft
owner: tech-lead
last_updated: 2026-09-01
---

# Tasks — Feature Backend 002

1. [ ] Implementar endpoint de leitura dos dados do imóvel disponível (valor, cotas restantes, rendimento estimado).
2. [ ] Implementar endpoint de compra de cotas, assinando `comprarCotas` via serviço de custódia de [001](../001-onboarding-e-custodia/tasks.md) (depende de `../../../on-chain/features/002-tokenizacao-imovel` concluída).
3. [ ] Tratar falhas de transação on-chain (ex.: revert de compliance/saldo) de forma compreensível para o investidor, sem quebrar o fluxo para outros usuários.
4. [ ] Testes de integração e end-to-end em testnet Polygon.
5. [ ] Revisão de segurança (RNF-16 — revalidação de compliance/saldo/KYC no momento da chamada).
