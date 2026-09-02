---
status: approved
owner: tech-lead
last_updated: 2026-09-02
---

# Tasks — Feature Backend 002

1. [x] Implementar endpoint de leitura dos dados do imóvel disponível (valor, cotas restantes, rendimento estimado). `GET /imoveis`, `GET /imoveis/:id` (`backend/src/routes/imoveis.ts`) — dados financeiros lidos ao vivo do `PropertyToken` (`backend/src/services/propertyChain.ts`), nunca cacheados no banco.
2. [x] Implementar endpoint de compra de cotas, assinando `comprarCotas` via serviço de custódia de [001](../001-onboarding-e-custodia/tasks.md) (depende de `../../../on-chain/features/002-tokenizacao-imovel` concluída). `POST /imoveis/:id/comprar` — revalida KYC direto on-chain (`isVerifiedOnChain`, RNF-16) e saldo/valor mínimo antes de assinar; aprova a moeda de pagamento e envia `comprarCotas` com a chave da carteira custodial do investidor.
3. [x] Tratar falhas de transação on-chain (ex.: revert de compliance/saldo) de forma compreensível para o investidor, sem quebrar o fluxo para outros usuários. Falha capturada e devolvida como `502 { codigo: "ERRO_DESCONHECIDO" }`, sem gravar `Investment`.
4. [ ] Testes de integração e end-to-end em testnet Polygon. Feito contra Anvil local (`test/imoveis.routes.test.ts` + `test/property-flow.e2e.test.ts`, gated por `RUN_E2E=1`); testnet Amoy ainda bloqueada por falta de RPC/MATIC (mesmo item de `PENDENCIAS.md` da trilha on-chain).
5. [x] Revisão de segurança (RNF-16 — revalidação de compliance/saldo/KYC no momento da chamada). KYC sempre revalidado on-chain no momento da chamada, nunca a partir do status gravado no banco pela feature 001.
