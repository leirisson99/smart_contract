---
status: draft
owner: tech-lead
last_updated: 2026-09-01
---

# Tasks — Feature Backend 003

1. [ ] Implementar endpoint de leitura de portfólio (cotas, valor investido, histórico de rendimentos recebidos e pendentes).
2. [ ] Implementar job periódico de claim automático (RF-24), identificando todos os investidores com `valorReivindicavel > 0` (depende de `../../../on-chain/features/003-distribuicao-rendimentos` concluída).
3. [ ] Tratar falha de claim de um investidor sem interromper o job para os demais.
4. [ ] Testes de integração e end-to-end em testnet Polygon (depósito → claim automático → portfólio refletido, cruzando com [005](../005-painel-administrativo/tasks.md)).
5. [ ] Revisão de segurança da camada off-chain.
