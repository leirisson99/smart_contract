---
status: approved
owner: tech-lead
last_updated: 2026-09-02
---

# Tasks — Feature Backend 003

1. [x] Implementar endpoint de leitura de portfólio (cotas, valor investido, histórico de rendimentos recebidos e pendentes). `GET /investors/:id/portfolio` (`backend/src/routes/portfolio.ts`) — cotas via `balanceOf` on-chain, valor investido via ledger `Investment`, histórico via ledger `YieldClaim`, pendente via `valorReivindicavel` on-chain.
2. [x] Implementar job periódico de claim automático (RF-24), identificando todos os investidores com `valorReivindicavel > 0` (depende de `../../../on-chain/features/003-distribuicao-rendimentos` concluída). `backend/src/services/yieldClaimJob.ts` + `backend/scripts/run-yield-claim-job.ts` — identifica investidores via o ledger `Investment` por imóvel, tenta `claimTodos` com fallback para `claim` individual por ciclo.
3. [x] Tratar falha de claim de um investidor sem interromper o job para os demais. Cada investidor e cada ciclo (no fallback) tem seu próprio try/catch; testado com falha total de um investidor não impedindo o sucesso dos demais.
4. [ ] Testes de integração e end-to-end em testnet Polygon (depósito → claim automático → portfólio refletido, cruzando com [005](../005-painel-administrativo/tasks.md)). Feito contra Anvil local (`test/portfolio.routes.test.ts`, `test/yieldClaimJob.test.ts`, `test/property-flow.e2e.test.ts` — depósito de rendimento chamado direto via viem no teste, já que o endpoint administrativo de 005 ainda não existe); testnet Amoy segue bloqueada (mesmo item de `PENDENCIAS.md`).
5. [x] Revisão de segurança da camada off-chain. Constraint única (`investorId`+`propertyId`+`cicloId`) em `YieldClaim` garante, junto com `jaReivindicou` on-chain, que nenhum ciclo é contado duas vezes mesmo se o job for reexecutado.
