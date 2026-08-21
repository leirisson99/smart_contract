---
status: in-progress
owner: tech-lead
last_updated: 2026-08-20
---

# Sprint 2 — Feature 002 (Tokenização do Imóvel)

## Objetivo
Entregar `PropertyToken` e `PropertyFactory` implementados via TDD, integrados ao `IdentityRegistry`/`ComplianceModule` da Sprint 1, testados e deployados em testnet.

## Backlog

Backlog completo em [`specs/features/002-tokenizacao-imovel/tasks.md`](../specs/features/002-tokenizacao-imovel/tasks.md):

- [~] **Bloqueante — decidir antes de codar:** moeda de liquidação (stablecoin vs. BRL), ver [`risks.md`](../specs/features/002-tokenizacao-imovel/risks.md) `RISK-08` e [`plan.md`](../specs/features/002-tokenizacao-imovel/plan.md). Não travou a sprint: seguido o workaround já previsto aqui — `comprarCotas` desacoplado da moeda via endereço ERC-20 configurável (`moedaPagamento`). RISK-08 continua aberto como decisão de negócio (qual moeda de fato usar em produção).
- [x] Escrever testes de `PropertyToken` a partir de [`contracts/property-token.md`](../specs/features/002-tokenizacao-imovel/contracts/property-token.md). (`test/PropertyToken.t.sol`, 17 testes cobrindo RF-07/08/09, pausar/retomar, reentrancy, allowance.)
- [x] Implementar `PropertyToken` até os testes passarem. (`src/PropertyToken.sol` — 17/17 testes verdes, 100% de cobertura. Deployado como minimal proxy EIP-1167; ERC-20 mínimo escrito à mão para suportar o padrão de clone sem depender de `openzeppelin-contracts-upgradeable`.)
- [x] Escrever testes de `PropertyFactory` a partir de [`contracts/property-factory.md`](../specs/features/002-tokenizacao-imovel/contracts/property-factory.md). (`test/PropertyFactory.t.sol`, 7 testes cobrindo RF-06 e o compartilhamento de Identity/Compliance entre imóveis.)
- [x] Implementar `PropertyFactory` até os testes passarem. (`src/PropertyFactory.sol` — 7/7 testes verdes, 100% de cobertura, deploy via `Clones` EIP-1167.)
- [x] Testes de integração Factory + Token + Identity/Compliance (Sprint 1). (`test/IntegrationPropertyFactory.t.sol`, 5 testes — criação + compra, bloqueio sem KYC, overselling, transferência secundária, dois imóveis compartilhando compliance.)
- [ ] Fork test em testnet Polygon (Amoy) com medição de custo de gas (relevante para RNF-05 — custo de emissão previsível). (Mesmo bloqueio da Sprint 1: falta RPC + MATIC de teste no `.env`.)
- [~] Checklist de segurança: `SEC-01`, `SEC-02`, `SEC-03`, `SEC-05`, `SEC-12` mitigados em [`specs/security-checklist.md`](../specs/security-checklist.md). `SEC-02`, `SEC-03`, `SEC-05`, `SEC-12` mitigados. `SEC-01` (reentrancy) segue `pendente`: `PropertyToken` já está protegido e testado (CEI + `ReentrancyGuard`, com mock de moeda maliciosa tentando reentrar), mas a linha do checklist também cobre a feature `003` (`DividendDistributor`), que ainda não existe.

## Dependências / bloqueios
- Depende da Sprint 1 concluída (`IdentityRegistry`/`ComplianceModule`).
- **Bloqueio de decisão de negócio**: moeda de liquidação — se não for decidida a tempo, considere implementar `comprarCotas` de forma desacoplada da moeda (interface que aceita um endereço de token de pagamento configurável) para não travar a sprint enquanto a decisão de negócio não chega. Resolvido via workaround (ver backlog acima).
- **Passo de deploy necessário** (não documentado na spec original): a `PropertyFactory` precisa de `DEFAULT_ADMIN_ROLE` no `ComplianceModule` (feature 001) para poder conceder `TOKEN_ROLE` a cada `PropertyToken` que criar — sem isso, `criarImovel` reverte na chamada a `grantRole`. Ver [`PENDENCIAS.md`](../PENDENCIAS.md).

## Marco de saída
`PropertyToken` e `PropertyFactory` testados e deployados em testnet; um imóvel de teste pode ser criado e cotas compradas por uma carteira verificada, respeitando compliance. Habilita o início da Sprint 3.
