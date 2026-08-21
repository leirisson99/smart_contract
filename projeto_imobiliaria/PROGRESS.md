---
status: living-document
owner: tech-lead
last_updated: 2026-08-20
---

# Progresso do Projeto — Log de Execução

> Registro cronológico do que já foi **implementado, testado e verificado**. Complementa `plan.md` (índice do pacote de specs) e `sprints/` (planejamento) — aqui fica o que de fato foi feito, para qualquer pessoa (ou sessão futura) retomar o contexto rapidamente. Atualizar a cada marco relevante, não a cada commit.

## Estado atual (2026-08-20)

- **Sprint 1** ([sprints/sprint-01-fundacao-identidade-kyc.md](sprints/sprint-01-fundacao-identidade-kyc.md)): setup do projeto e feature `001-identidade-kyc` (`IdentityRegistry` + `ComplianceModule`) completos — testados (unit, fuzz, integração) com 100% de cobertura, verificados também com deploy real em node local (Anvil).
- **Sprint 2** ([sprints/sprint-02-tokenizacao-imovel.md](sprints/sprint-02-tokenizacao-imovel.md)) em andamento: feature `002-tokenizacao-imovel` (`PropertyToken` + `PropertyFactory`) implementada e testada (unit, fuzz, integração) com 100% de cobertura.
- **Pendente** (bloqueado por insumos externos, não por código): fork test/deploy na testnet Polygon Amoy (falta RPC + MATIC de teste) e contratação do provedor de KYC (decisão de negócio).
- **Sprints 3-4** (features `003`/`004`, consolidação de segurança) ainda não iniciadas.

## Linha do tempo

### 2026-08-19 — Setup inicial do projeto Foundry
- Instalado Foundry (`forge`/`cast`/`anvil` v1.7.1).
- `forge init --use-parent-git` — estrutura `src/`, `test/`, `script/` (git raiz é o diretório pai do repo).
- Dependências: `forge-std` e OpenZeppelin Contracts v5.7.0 (`AccessControl`, `Pausable`, `ReentrancyGuard` — ver [ADR-0003](specs/decisions/ADR-0003-toolchain-foundry.md)).
- `foundry.toml`: solc 0.8.28, otimizador (200 runs), fuzz/invariant runs, remappings, RPC/Etherscan da testnet Amoy ([ADR-0002](specs/decisions/ADR-0002-rede-polygon.md)).
- CI (`.github/workflows/test.yml`, gerado pelo `forge init`): `forge fmt --check`, `forge build --sizes`, `forge test`, `forge coverage`.
- `.env.example` com `POLYGON_AMOY_RPC_URL` / `PRIVATE_KEY` / `POLYGONSCAN_API_KEY`.
- Commit: `50a2542`.

### 2026-08-19/20 — `IdentityRegistry` via TDD
- `test/IdentityRegistry.t.sol` escrito primeiro (red) a partir de `spec.md` e `contracts/identity-registry.md` — 15 testes (unit + fuzz), cobrindo RF-02, RF-04, RF-05 e o cenário "remoção de Trusted Issuer não invalida claims já emitidas".
- `src/IdentityRegistry.sol` implementado até todos passarem (green): `AccessControl` com `PLATFORM_ADMIN_ROLE`; `emitirClaim`/`revogarClaim` restritos a Trusted Issuer autorizado (ou admin, na revogação); proteção contra reuso de assinatura (SEC-11).
- Resultado: 15/15 testes, 100% cobertura de linhas/branches/funções.
- Commits: `77a37f9`, `5cbcf75` (atualização da sprint).

### 2026-08-20 — `ComplianceModule` via TDD
- `test/ComplianceModule.t.sol` escrito primeiro a partir de `contracts/compliance-module.md` — 11 testes (unit + fuzz), cobrindo `canTransfer`/`motivoBloqueio` por KYC, limite de holders, e o invariante "nunca permite sem KYC".
- `src/ComplianceModule.sol` implementado: decide com base em `IdentityRegistry.isVerified` + limite de holders configurável. A spec não define como o contador de holders chega ao módulo (o `PropertyToken` só existe na Sprint 2) — adicionado hook `registrarTransferencia`, restrito a `TOKEN_ROLE`, mantendo `canTransfer` como `view` pura.
- Resultado: 11/11 testes, 100% cobertura.
- Commits: `3c15109`, `f09c519` (docs).

### 2026-08-20 — Testes de integração
- `test/Integration.t.sol` + `test/mocks/MockPropertyToken.sol` (mock mínimo do futuro `PropertyToken`, só para exercitar mint/transfer via `canTransfer`/`registrarTransferencia`).
- 5 testes ponta a ponta: mint bloqueado sem KYC, mint/transfer fluindo com KYC aprovado, revogação de claim bloqueia entrada sem confiscar saldo existente (cenário "Revogação de claim" de `spec.md`), limite de holders reforçado através do token.
- Commit: `4b49b9c`.

### 2026-08-20 — Checklist de segurança atualizado
- `SEC-10` (exposição de PII on-chain) marcado como `mitigado` em [specs/security-checklist.md](specs/security-checklist.md) — nenhum dado pessoal é gravado, só claims e hash de assinatura (ADR-0006).
- `SEC-02`/`SEC-08` seguem `pendente`: essas linhas também cobrem `PropertyToken`/`Marketplace` (features 002/004), que ainda não existem.
- `SEC-11` segue `pendente`: a contenção on-chain (`removerTrustedIssuer`) já está implementada e testada, mas o item exige hardware wallet/multisig e processo de rotação do provedor de KYC real — ainda não contratado.
- Commit: `f09c519`.

### 2026-08-20 — Script de deploy + verificação local ponta a ponta
- `script/DeployIdentityKyc.s.sol` criado (deploy de `IdentityRegistry` + `ComplianceModule`, reutilizável para Amoy trocando `--rpc-url`).
- Deploy real executado num node Anvil local; fluxo completo testado via `cast` como transações on-chain de verdade (não simulação de teste): `adicionarTrustedIssuer` → `emitirClaim` → `isVerified` → `canTransfer`/`motivoBloqueio` → `mint` via `MockPropertyToken`. Caminhos permitido e bloqueado confirmados, incluindo os reverts (`IssuerNaoAutorizado`, `ComplianceNaoVerificado`) — comportamento bateu exatamente com os testes unitários.
- Commit: `4fd4e23`.

### 2026-08-20 — `PropertyToken` via TDD (Sprint 2)
- `test/PropertyToken.t.sol` escrito primeiro a partir de `spec.md` e `contracts/property-token.md` — 17 testes (unit + fuzz), cobrindo RF-07/08/09, pausar/retomar, allowance, e reentrancy (mock de moeda maliciosa tentando reentrar `comprarCotas`).
- `src/PropertyToken.sol` implementado até todos passarem: deployado como minimal proxy EIP-1167 pela `PropertyFactory` (RNF-05) — usa `inicializar` em vez de `constructor`, com a implementação (não-clone) se auto-travando. ERC-20 mínimo escrito à mão (não herda `ERC20` da OZ) para suportar o padrão de clone sem depender de `openzeppelin-contracts-upgradeable`. CEI + `ReentrancyGuard` em `comprarCotas`/`transfer`/`transferFrom` (SEC-01).
- Moeda de liquidação (RISK-08, decisão de negócio ainda em aberto) desacoplada via `moedaPagamento`, um endereço ERC-20 configurável — seguindo o workaround já previsto em `sprints/sprint-02-tokenizacao-imovel.md`, sem travar a sprint.
- Resultado: 17/17 testes, 100% cobertura.
- Commit: `a0aea6d`.

### 2026-08-20 — `PropertyFactory` + testes de integração (Sprint 2)
- `test/PropertyFactory.t.sol` (7 testes) a partir de `contracts/property-factory.md`, cobrindo RF-06 e o compartilhamento de `IdentityRegistry`/`ComplianceModule` entre imóveis.
- `src/PropertyFactory.sol` implementado: deploya um `PropertyToken` por imóvel via `Clones` (EIP-1167) e concede `TOKEN_ROLE` a cada clone no `ComplianceModule` compartilhado. Requer, como passo de deploy, que a Factory tenha `DEFAULT_ADMIN_ROLE` no `ComplianceModule` — detalhe de integração que a spec não define, documentado em `PENDENCIAS.md`.
- `test/IntegrationPropertyFactory.t.sol` (5 testes): fluxo ponta a ponta — criação de imóvel, compra por investidor verificado, bloqueio sem KYC, overselling tudo-ou-nada, transferência secundária, e dois imóveis isolados no saldo mas compartilhando o mesmo compliance (revogar KYC bloqueia compra em qualquer imóvel).
- Resultado: 12 testes, 100% cobertura em `PropertyFactory.sol`.
- Commit: `e402f71`.

### 2026-08-20 — Checklist de segurança atualizado (Sprint 2)
- `SEC-02`, `SEC-03`, `SEC-05`, `SEC-12` marcados como `mitigado` em [specs/security-checklist.md](specs/security-checklist.md) — access control de `PropertyToken`/`PropertyFactory` testado, sem blocos `unchecked`, imutabilidade via clone EIP-1167 com padrão de inicialização travado, `criarImovel` restrito a `PLATFORM_ADMIN_ROLE`.
- `SEC-01` (reentrancy) segue `pendente`: `PropertyToken` já está protegido e testado, mas a linha também cobre a feature `003` (`DividendDistributor`), ainda não implementada.

## Estado da suíte de testes

| Contrato/suite | Testes | Cobertura |
|---|---|---|
| `IdentityRegistry` | 15 | 100% linhas/branches/funções |
| `ComplianceModule` | 11 | 100% linhas/branches/funções |
| Integração feature 001 (`Integration.t.sol`) | 5 | — |
| `PropertyToken` | 17 | 100% linhas/branches/funções |
| `PropertyFactory` | 7 | 100% linhas/branches/funções |
| Integração feature 002 (`IntegrationPropertyFactory.t.sol`) | 5 | — |
| **Total** | **60** | **100% em todos os `src/*.sol`** |

Rodar localmente: `forge test -vv` (suíte completa) e `forge coverage` (relatório de cobertura).

## Pendências conhecidas

Lista completa e atualizada em [`PENDENCIAS.md`](PENDENCIAS.md). Resumo: fork test/deploy em testnet Amoy (falta RPC + MATIC de faucet), contratação do provedor de KYC, decisão de negócio sobre a moeda de liquidação real (RISK-08), e `SEC-01`/`SEC-08`/`SEC-11` do checklist de segurança.

## Próximos passos (ainda não iniciados)

- **Sprint 3** ([sprints/sprint-03-rendimentos-e-mercado-secundario.md](sprints/sprint-03-rendimentos-e-mercado-secundario.md)): features `003-distribuicao-rendimentos` e `004-mercado-secundario`.
- **Sprint 4**: consolidação de segurança e preparação para auditoria externa.
