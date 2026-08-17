---
status: draft
owner: tech-lead
last_updated: 2026-08-17
---

# Estratégia de Testes — Feature 002

## Unit tests
- `test_RF06_criarImovel_deployaPropertyTokenCorreto`
- `test_RF06_criarImovel_revertSeNaoAdmin`
- `test_RF07_comprarCotas_creditaSaldoComKYC`
- `test_RF07_comprarCotas_revertSemKYC`
- `test_RF09_comprarCotas_revertSeExcedeDisponivel`
- `test_pausar_bloqueiaTransferencias`
- `test_transfer_respeitaComplianceModule`

## Fuzz tests
- `testFuzz_comprarCotas_quantidadesAleatorias` — nunca excede `totalSupply`, nunca credita a mais que o solicitado.
- `testFuzz_criarImovel_valoresECotasAleatorios`.

## Invariant tests
- `soma(balanceOf(*)) == totalSupply` sempre, para qualquer sequência de compras/transferências.
- `cotasDisponiveis + soma(balanceOf(*)) == totalCotasDefinidas` sempre.

## Integration tests
- `PropertyFactory` → `PropertyToken` → `IdentityRegistry`/`ComplianceModule` (feature 001): fluxo completo de criação de imóvel + compra por investidor verificado + tentativa de compra por não verificado.

## Fork tests
- Deploy completo (Factory + Token + Identity + Compliance) em fork da testnet Polygon; medir custo de gas real de `criarImovel` e `comprarCotas`.

## Critério de saída
100% dos cenários de `spec.md`, `contracts/property-token.md` e `contracts/property-factory.md` cobertos; `forge coverage` ≥ 100% em `comprarCotas`, `transfer`, `criarImovel`.
