---
status: in-progress
owner: tech-lead
last_updated: 2026-08-19
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
- [ ] Escrever testes de `IdentityRegistry` (unit + fuzz) a partir de [`contracts/identity-registry.md`](../specs/features/001-identidade-kyc/contracts/identity-registry.md).
- [ ] Implementar `IdentityRegistry` até os testes passarem.
- [ ] Escrever testes de `ComplianceModule` a partir de [`contracts/compliance-module.md`](../specs/features/001-identidade-kyc/contracts/compliance-module.md).
- [ ] Implementar `ComplianceModule` até os testes passarem.
- [ ] Testes de integração `IdentityRegistry` + `ComplianceModule` + mock de token.
- [ ] Fork test em testnet Polygon (Amoy).
- [ ] Checklist de segurança: `SEC-02`, `SEC-08`, `SEC-10`, `SEC-11` marcados como mitigados em [`specs/security-checklist.md`](../specs/security-checklist.md).
- [ ] Deploy em testnet (integração real com o provedor de KYC pode ficar para quando o provedor estiver contratado, fora do ritmo desta sprint se necessário).

## Dependências / bloqueios
- Nenhuma — specs já `approved`, é a feature-base do projeto.
- Risco a observar: se o provedor de KYC ainda não estiver contratado, use um Trusted Issuer mock nos testes/testnet para não bloquear o desenvolvimento (a integração real é um item separado, não bloqueante para o código).

## Marco de saída
`IdentityRegistry` e `ComplianceModule` testados (unit, fuzz, integração, fork) e deployados em testnet Amoy; checklist de segurança da feature mitigado. Habilita o início da Sprint 2.
