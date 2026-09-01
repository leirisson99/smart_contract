---
status: draft
owner: tech-lead
last_updated: 2026-08-17
---

# Estratégia de Testes — Feature 001

Toda a implementação futura segue TDD: teste primeiro (red), depois contrato (green), depois refactor. Ferramental: Foundry (ADR-0003).

## Unit tests (`forge test`)
- `test_RF02_emitirClaim_registraCorretamente`
- `test_RF02_emitirClaim_revertSeIssuerNaoAutorizado`
- `test_isVerified_falseAntesDoKYC`
- `test_isVerified_trueAposKYCAprovado`
- `test_RF05_revogarClaim_bloqueiaFuturasTransferencias`
- `test_RF04_adicionarRemoverTrustedIssuer_apenasAdmin`
- `test_ComplianceModule_canTransfer_bloqueiaSemKYC`
- `test_ComplianceModule_canTransfer_permiteComKYC`

## Fuzz tests
- `testFuzz_emitirClaim_comEnderecosAleatorios` — garante que nenhum endereço aleatório quebra invariantes de acesso.
- `testFuzz_limiteHolders_comQuantidadesAleatorias`.

## Invariant tests
- Invariante: nenhuma carteira sem claim `KYC_APPROVED` de issuer atualmente autorizado nunca tem `isVerified() == true`.
- Invariante: `canTransfer` nunca retorna `true` quando `isVerified(para) == false`.

## Integration tests
- `IdentityRegistry` + `ComplianceModule` + mock de `PropertyToken`: transferência simulada ponta a ponta, incluindo caso de revogação de claim no meio do fluxo.

## Fork tests
- Deploy em fork da testnet Polygon (Amoy): validar custo de gas real de `emitirClaim` e `canTransfer` em condições de rede reais.

## Critério de saída
Todos os cenários Dado/Quando/Então de `spec.md`, `contracts/identity-registry.md` e `contracts/compliance-module.md` cobertos 1:1 por teste; `forge coverage` ≥ 100% nas funções de escrita e de decisão de compliance.
