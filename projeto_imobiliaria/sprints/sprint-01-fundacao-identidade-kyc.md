---
status: in-progress
owner: tech-lead
last_updated: 2026-08-20
---

# Sprint 1 — Fundação do Projeto + Feature 001 (Identidade e KYC)

## Objetivo
Preparar o ambiente de desenvolvimento Solidity e entregar `IdentityRegistry` + `ComplianceModule` implementados via TDD, testados e deployados em testnet — a base da qual todos os outros contratos dependem.

## Backlog

**Setup do projeto (novo, não estava em nenhum `tasks.md` de feature):**
- [x] Inicializar projeto Foundry (`forge init`), estrutura de pastas `src/`, `test/`, `script/`.
- [x] Instalar dependências: OpenZeppelin Contracts (`AccessControl`, `Pausable`, `ReentrancyGuard` — ver ADR-0003).
- [x] Configurar `foundry.toml` (versão do compilador Solidity ≥0.8, otimizador, remappings).
- [ ] Configurar RPC e conta de deploy para a testnet Polygon Amoy (ADR-0002) — obter MATIC de teste via faucet. (`.env.example` criado com `POLYGON_AMOY_RPC_URL`/`PRIVATE_KEY`; falta preencher `.env` com conta real e fazer faucet.)
- [x] Configurar CI para rodar `forge test` e `forge coverage` a cada push.

**Feature `001-identidade-kyc`** (backlog completo em [`specs/features/001-identidade-kyc/tasks.md`](../specs/features/001-identidade-kyc/tasks.md)):
- [ ] Selecionar/contratar provedor de KYC (decisão de negócio — pode ficar como placeholder/mock nesta sprint se ainda não estiver fechado; não bloqueia o código, só a integração real do item final).
- [x] Escrever testes de `IdentityRegistry` (unit + fuzz) a partir de [`contracts/identity-registry.md`](../specs/features/001-identidade-kyc/contracts/identity-registry.md). (`test/IdentityRegistry.t.sol`, 15 testes cobrindo RF-02, RF-04, RF-05 e o cenário de remoção de Trusted Issuer.)
- [x] Implementar `IdentityRegistry` até os testes passarem. (`src/IdentityRegistry.sol` — 15/15 testes verdes, 100% de cobertura de linhas/branches/funções.)
- [x] Escrever testes de `ComplianceModule` a partir de [`contracts/compliance-module.md`](../specs/features/001-identidade-kyc/contracts/compliance-module.md). (`test/ComplianceModule.t.sol`, 11 testes cobrindo KYC, limite de holders e o invariante "nunca permite sem KYC" via fuzz.)
- [x] Implementar `ComplianceModule` até os testes passarem. (`src/ComplianceModule.sol` — 11/11 testes verdes, 100% de cobertura. A spec não define como o contador de holders chega ao módulo, já que o `PropertyToken` só existe na Sprint 2; adicionado hook `registrarTransferencia` restrito a `TOKEN_ROLE` para isso.)
- [x] Testes de integração `IdentityRegistry` + `ComplianceModule` + mock de token. (`test/Integration.t.sol` + `test/mocks/MockPropertyToken.sol`, 5 testes — mint/transfer ponta a ponta, cenário de revogação de claim sem confisco de saldo, limite de holders via token.)
- [ ] Fork test em testnet Polygon (Amoy). (Bloqueado até a conta de deploy ter RPC/MATIC de teste configurados — ver item de setup acima.)
- [~] Checklist de segurança: `SEC-02`, `SEC-08`, `SEC-10`, `SEC-11` marcados como mitigados em [`specs/security-checklist.md`](../specs/security-checklist.md). `SEC-10` (PII on-chain) mitigado — nenhum dado pessoal é gravado, apenas claims e hash de assinatura. `SEC-02`/`SEC-08` ficam `pendente`: essas linhas também cobrem features 002/004 (`PropertyToken`, `Marketplace`) que ainda não existem, então só fecham quando esses contratos existirem e reforçarem `canTransfer`. `SEC-11` fica `pendente`: a contenção on-chain (`removerTrustedIssuer`) já está implementada e testada, mas o item exige hardware wallet/multisig e processo de rotação do provedor de KYC real, que ainda não foi contratado (ver próximo item).
- [ ] Deploy em testnet (integração real com o provedor de KYC pode ficar para quando o provedor estiver contratado, fora do ritmo desta sprint se necessário).

## Dependências / bloqueios
- Nenhuma — specs já `approved`, é a feature-base do projeto.
- Risco a observar: se o provedor de KYC ainda não estiver contratado, use um Trusted Issuer mock nos testes/testnet para não bloquear o desenvolvimento (a integração real é um item separado, não bloqueante para o código).

## Marco de saída
`IdentityRegistry` e `ComplianceModule` testados (unit, fuzz, integração, fork) e deployados em testnet Amoy; checklist de segurança da feature mitigado. Habilita o início da Sprint 2.
