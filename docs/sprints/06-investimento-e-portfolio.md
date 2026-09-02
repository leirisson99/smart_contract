---
status: in-progress
owner: tech-lead
last_updated: 2026-09-02
---

# Sprint 6 — Investimento Primário e Portfólio

## Objetivo
Implementar, via TDD (seguindo o padrão já estabelecido pela feature `001`: rotas → serviços → Prisma, integração viem com os contratos, testes de integração e e2e gated), as features de backend `002-investimento-primario` e `003-portfolio-e-rendimentos`. Ambas dependem apenas de `001` (já implementada) e dos contratos on-chain `002-tokenizacao-imovel`/`003-distribuicao-rendimentos` (já completos e testados) — não uma da outra —, então são paralelizáveis entre si se houver mais de um desenvolvedor.

## Backlog
Referência: [`../backend/features/002-investimento-primario/tasks.md`](../backend/features/002-investimento-primario/tasks.md) e [`../backend/features/003-portfolio-e-rendimentos/tasks.md`](../backend/features/003-portfolio-e-rendimentos/tasks.md).

- [x] **002**: endpoint de leitura do imóvel disponível (`GET /imoveis`, `GET /imoveis/:id`) — dados financeiros lidos ao vivo do `PropertyToken` on-chain, nunca cacheados (`backend/src/routes/imoveis.ts`, `backend/src/services/propertyChain.ts`).
- [x] **002**: endpoint de compra (`POST /imoveis/:id/comprar`) — assina e envia `PropertyToken.comprarCotas` via a carteira custodial do investidor (RF-22), revalidando KYC on-chain (`isVerifiedOnChain`, não o status gravado no banco) e saldo/valor mínimo no momento da chamada (RNF-16).
- [x] **002**: tratamento de falha on-chain (revert de `comprarCotas`, RPC indisponível) — capturado e devolvido como `502 { codigo: "ERRO_DESCONHECIDO" }` sem gravar `Investment`, sem afetar outras requisições.
- [x] **003**: endpoint de leitura de portfólio (`GET /investors/:id/portfolio`) — cotas via `balanceOf` on-chain, valor investido via ledger `Investment`, histórico via ledger `YieldClaim`, pendente via `valorReivindicavel` on-chain (RF-23).
- [x] **003**: job periódico de claim automático (RF-24) — `backend/src/services/yieldClaimJob.ts`: tenta `DividendDistributor.claimTodos` em lote, com fallback para `claim` individual por ciclo; falha isolada (de um ciclo ou de um investidor) não trava o processamento dos demais. Entry point: `backend/scripts/run-yield-claim-job.ts` (sem scheduler próprio — invocado por um agendador externo, ver nota abaixo).
- [x] Ambas: respostas de erro alinhadas ao vocabulário de [`../backend/api-contract.md`](../backend/api-contract.md) (`SEM_KYC`, `COTAS_INSUFICIENTES`, `VALOR_MINIMO_NAO_ATINGIDO`).
- [x] Testes de integração (unit, mockando a chain — `test/imoveis.routes.test.ts`, `test/portfolio.routes.test.ts`, `test/yieldClaimJob.test.ts`) + e2e real gated (`RUN_E2E=1`, `test/property-flow.e2e.test.ts`) cobrindo cadastro → KYC → compra → portfólio → depósito de rendimento → claim automático, rodado uma vez contra Anvil local para verificação.
- [ ] Testes de integração/e2e em testnet Polygon Amoy — ainda só verificado contra Anvil local (mesmo bloqueio de RPC/MATIC de faucet já registrado em `PENDENCIAS.md` para a trilha on-chain).
- [x] Revisão de segurança RNF-16 (última linha de defesa) para os dois endpoints de escrita — KYC sempre revalidado on-chain (nunca confia no status do banco).

### Descoberta durante a implementação: patrocínio de gas para carteiras custodiais

Não previsto em nenhuma spec/plan.md anterior: carteiras custodiais (`walletCustody.createCustodialWallet`) nascem com saldo zero de ETH. Como `comprarCotas`/`claim` são assinados pela própria carteira do investidor (não pelo backend), a primeira transação de qualquer investidor falhava por falta de saldo para gas — descoberto ao rodar o e2e real contra Anvil (não coberto pelos testes unitários, que mockam a chain). Resolvido com um novo serviço `backend/src/services/gasSponsor.ts`: antes de qualquer transação assinada pelo investidor, o backend transfere um valor fixo de ETH de uma conta própria (`GAS_SPONSOR_PRIVATE_KEY`, novo env var) se o saldo da carteira estiver abaixo de um limiar. Mesmo princípio da carteira custodial (investidor nunca lida com chaves ou gas, slide 4) — documentado em [`001-onboarding-e-custodia/plan.md`](../backend/features/001-onboarding-e-custodia/plan.md).

## Dependências / bloqueios
- Depende de `001-onboarding-e-custodia` (carteira custodial, status de KYC) — já implementada e testada.
- Depende dos contratos on-chain `../on-chain/features/002-tokenizacao-imovel` (`PropertyToken.comprarCotas`) e `../on-chain/features/003-distribuicao-rendimentos` (`DividendDistributor.claim`/`claimTodos`) — já completos, testados e com Slither/Mythril sem findings.
- Depende da Sprint 5 (specs `002`/`003` aprovadas).
- Novo: `projeto_imobiliaria/script/DeployPropertyPipeline.s.sol` (criado nesta sprint) — deploy local do pipeline de imóvel (moeda de teste, `PropertyFactory`, um imóvel de exemplo, `DividendDistributor`) usado pelo e2e gated.

## Marco de saída
Endpoints de compra primária e leitura de portfólio funcionando ponta a ponta contra um Anvil local — verificado com um teste e2e real (não só mockado) rodado nesta sessão. Job de claim automático testado incluindo os casos de falha parcial (ciclo e investidor isolados) e idempotência. Respostas de erro seguindo `api-contract.md`. Pendente para fechamento total da sprint (bloqueio externo, não de código): deploy/teste em testnet Polygon Amoy, mesmo bloqueio já registrado para a trilha on-chain em `PENDENCIAS.md`.
