---
status: approved
owner: tech-lead
last_updated: 2026-09-02
---

# Tasks — Feature Backend 001

1. [ ] Custódia real das chaves privadas — dividido em duas frentes de risco distinto:
   - 1a. Contratar solução de custódia (HSM/KMS) para as chaves privadas das **carteiras custodiais dos investidores**.
   - 1b. Migrar a chave do **Trusted Issuer** (`TRUSTED_ISSUER_PRIVATE_KEY`, hoje em `.env` em texto puro) para HSM/KMS — risco maior que 1a, pois seu comprometimento permite emitir claims `KYC_APPROVED` falsas para qualquer carteira, não apenas afeta um investidor (ver `SEC-11` em [`security-checklist.md`](../../../on-chain/security-checklist.md) e [ADR-0006](../../../on-chain/decisions/ADR-0006-fronteira-onchain-offchain-kyc.md)).
   - Ambas sem prazo definido; não bloqueiam a POC.
2. [ ] Especificar modelo de dados de PII (LGPD) — retenção, controle de acesso, criptografia em repouso.
3. [x] Implementar endpoint de cadastro + criação automática da carteira custodial (RF-21). Implementado em `backend/src/routes/investors.ts` + `backend/src/services/walletCustody.ts` + `prisma/schema.prisma` (model `Investor`); testado em `backend/test/routes.test.ts`.
4. [x] Implementar orquestração de KYC: envio de documentos ao provedor e processamento do webhook de resultado (RF-33). Implementado em `backend/src/routes/{kyc,webhooks}.ts` + `backend/src/services/{kycWebhookService,trustedIssuerSigner,kycProvider/mockProvider}.ts`; testado em `backend/test/{routes,kycWebhookService,kyc-flow.e2e}.test.ts`.
5. [ ] Publicar contrato de API (endpoints, payloads, códigos de erro estruturados) para consumo por [002](../002-investimento-primario/tasks.md), [003](../003-portfolio-e-rendimentos/tasks.md), [004](../004-mercado-secundario/tasks.md), [005](../005-painel-administrativo/tasks.md) e `../../../frontend/features/001-interface-investidor`. **Gap conhecido**: os erros HTTP hoje são strings livres (`{ error: string }`), não seguem o vocabulário `CodigoErro` já consumido por `frontend/lib/errors.ts` (`SEM_KYC`, `KYC_REPROVADO`, `COTAS_INSUFICIENTES`, `VALOR_MINIMO_NAO_ATINGIDO`, `LISTAGEM_JA_VENDIDA`, `LISTAGEM_NAO_ENCONTRADA`, `SALDO_INSUFICIENTE`, `ERRO_DESCONHECIDO`). Esta task produz [`../../api-contract.md`](../../api-contract.md), documentando esse vocabulário por endpoint; alinhar os handlers atuais a ele é trabalho de código futuro, fora deste planejamento.
6. [x] Testes de integração e end-to-end (cadastro → KYC aprovado/reprovado). 8 testes vitest: `backend/test/routes.test.ts` (3), `backend/test/kycWebhookService.test.ts` (4), `backend/test/kyc-flow.e2e.test.ts` (1, gated por `RUN_E2E=1`, exige Anvil local + `IdentityRegistry` deployado + backend já registrado como Trusted Issuer).
7. [ ] Revisão de segurança da camada off-chain (ausência de PII em payload on-chain, controle de acesso ao banco de dados). Gaps já identificados a cobrir: (a) nenhuma rota tem autenticação/autorização hoje (`backend/src/server.ts` só registra as rotas, sem middleware) — crítico antes de expor a API além de ambiente local/dev; (b) `GET /investors/:id/kyc` lê o status gravado no banco, não `isVerifiedOnChain` — pode divergir do estado real da chain se uma claim for revogada via o runbook de rotação.
