---
status: living-document
owner: tech-lead
last_updated: 2026-08-20
---

# Progresso do Projeto — Log de Execução

> Registro cronológico do que já foi **implementado, testado e verificado**. Complementa `plan.md` (índice do pacote de specs) e `sprints/` (planejamento) — aqui fica o que de fato foi feito, para qualquer pessoa (ou sessão futura) retomar o contexto rapidamente. Atualizar a cada marco relevante, não a cada commit.

## Estado atual (2026-08-20)

- **Sprint 1** ([sprints/sprint-01-fundacao-identidade-kyc.md](sprints/sprint-01-fundacao-identidade-kyc.md)) em andamento: setup do projeto concluído; feature `001-identidade-kyc` implementada e testada (unit, fuzz, integração) com 100% de cobertura; verificada também com deploy real em node local (Anvil).
- **Pendente** (bloqueado por insumos externos, não por código): fork test/deploy na testnet Polygon Amoy (falta RPC + MATIC de teste) e contratação do provedor de KYC (decisão de negócio).
- **Sprints 2-4** (features `002` a `004`, consolidação de segurança) ainda não iniciadas.

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

## Estado da suíte de testes

| Contrato/suite | Testes | Cobertura |
|---|---|---|
| `IdentityRegistry` | 15 | 100% linhas/branches/funções |
| `ComplianceModule` | 11 | 100% linhas/branches/funções |
| Integração (`Integration.t.sol`) | 5 | — (exercita os dois contratos juntos) |
| **Total** | **31** | **100%** |

Rodar localmente: `forge test -vv` (suíte completa) e `forge coverage` (relatório de cobertura).

## Pendências conhecidas

- **Fork test / deploy em testnet Polygon Amoy**: precisa de `POLYGON_AMOY_RPC_URL` e uma conta financiada via faucet no `.env` (ver `.env.example`).
- **Contratação do provedor de KYC**: decisão de negócio em aberto — bloqueia a integração real de Trusted Issuer (testes/deploy local já usam um issuer mock, o que não bloqueia o código).
- **Checklist de segurança**: `SEC-02`, `SEC-08`, `SEC-11` seguem `pendente` (ver detalhes acima e em `specs/security-checklist.md`).

## Próximos passos (ainda não iniciados)

- **Sprint 2** ([sprints/sprint-02-tokenizacao-imovel.md](sprints/sprint-02-tokenizacao-imovel.md)): feature `002-tokenizacao-imovel` (`PropertyToken`, `PropertyFactory`).
- **Sprint 3**: features `003-distribuicao-rendimentos` e `004-mercado-secundario`.
- **Sprint 4**: consolidação de segurança e preparação para auditoria externa.
