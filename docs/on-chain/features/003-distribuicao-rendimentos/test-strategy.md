---
status: draft
owner: tech-lead
last_updated: 2026-08-17
---

# Estratégia de Testes — Feature 003

## Unit tests
- `test_RF11_depositarRendimento_criaNovoCiclo`
- `test_RF12_snapshotRefleteSaldoNoDeposito`
- `test_RF13_claim_transfereValorProporcional`
- `test_RF14_claim_revertSeJaReivindicado`
- `test_RF15_multiplosCiclos_claimIndependente`
- `test_dust_acumulaParaProximoCiclo`

## Fuzz tests
- `testFuzz_claim_comDistribuicoesDeSaldoAleatorias` — soma dos valores reivindicados nunca excede o total depositado.
- `testFuzz_depositarRendimento_valoresAleatorios`.

## Invariant tests
- Invariante: `soma(valorReivindicavel(*, idCiclo))` inicial (antes de qualquer claim) é sempre igual ao valor depositado naquele ciclo (± dust).
- Invariante: nenhum holder consegue reivindicar mais do que sua parte proporcional, para qualquer sequência de transferências de cota entre ciclos.

## Integration tests
- `DividendDistributor` + `PropertyToken` (feature 002): ciclo completo — depósito, transferência de cota de um holder para outro, claim do ciclo anterior por quem já vendeu (deve funcionar, baseado no snapshot).

## Fork tests
- Fork da testnet Polygon: dois ciclos completos de depósito e claim por múltiplos holders, medindo gas de `claim` individual.

## Critério de saída
100% dos cenários de `spec.md` e `contracts/dividend-distributor.md` cobertos; `forge coverage` ≥ 100% em `depositarRendimento` e `claim`.
