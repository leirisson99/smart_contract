---
status: approved
owner: tech-lead
last_updated: 2026-09-02
---

# Tasks — Feature Backend 004

1. [x] Implementar endpoint de listagem de cotas para venda, assinando `Marketplace.listar` (RF-34). `POST /listagens` (`backend/src/routes/marketplace.ts` + `backend/src/services/marketplaceChain.ts`) — aprova o escrow do `Marketplace` no `PropertyToken` e assina `listar`; `idListagem` extraído do evento `ListagemCriada` no recibo.
2. [x] Implementar endpoint de compra no mercado secundário, assinando `Marketplace.comprar` (RF-35), com checagem otimista de KYC antes do envio. `POST /listagens/:id/comprar` — revalida `isVerified` on-chain (RNF-16) antes de assinar; compra é sempre pela quantidade total disponível da listagem (sem compra parcial, como no mock do frontend). Registra a compra no mesmo ledger `Investment` de 002, para que o portfólio (003) e o job de claim enxerguem cotas adquiridas via mercado secundário, não só via compra primária.
3. [x] Testes de integração (`backend/test/marketplace.routes.test.ts`, mockando `marketplaceChain`/`propertyChain`/`trustedIssuerSigner`/`gasSponsor`) cobrindo os cenários de `spec.md` (listagem, compra, `SEM_KYC`, `LISTAGEM_JA_VENDIDA`, `LISTAGEM_NAO_ENCONTRADA`, `SALDO_INSUFICIENTE`, cancelamento e checagem de dono). Verificado também ponta a ponta contra Anvil local via `chromium`/Playwright (listar → comprar por outro investidor → saldo e valor investido refletidos no portfólio de ambos) — não automatizado como teste e2e no repositório (mesmo padrão do `RUN_E2E=1` de 002/003 ficou fora do escopo desta sessão).
4. [x] Revisão de segurança (RNF-16, ver [002](../002-investimento-primario/tasks.md) — o backend nunca é a última linha de defesa). Checagem de KYC do comprador é só otimista (`isVerifiedOnChain` antes de assinar); o `ComplianceModule` on-chain segue sendo quem de fato barra a transferência (SEC-08). Endereço do próprio `Marketplace` precisa de claim `KYC_APPROVED` para manter cotas em escrow — automatizado em `backend/scripts/grant-marketplace-kyc.ts`, rodado uma vez por deploy local.
