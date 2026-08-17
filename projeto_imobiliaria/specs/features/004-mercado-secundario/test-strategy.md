---
status: draft
owner: tech-lead
last_updated: 2026-08-17
---

# Estratégia de Testes — Feature 004

## Unit tests
- `test_RF16_listar_colocaCotasEmEscrow`
- `test_RF17_comprar_transfereCotasEPagamento`
- `test_RF17_comprarParcial_mantemListagemAtiva`
- `test_RF18_cancelar_devolveCotasAoVendedor`
- `test_RF18_cancelar_revertSeNaoDono`
- `test_RF20_comprar_revertSemKYC`
- `test_taxaTransacao_cobradaCorretamente`

## Fuzz tests
- `testFuzz_comprar_quantidadesAleatorias` — nunca excede quantidade disponível na listagem.
- `testFuzz_listar_precosEQuantidadesAleatorias`.

## Invariant tests
- Soma de cotas em escrow de todas as listagens ativas + soma de `balanceOf` fora do Marketplace == `totalSupply` do `PropertyToken`.
- Nenhuma listagem cancelada ou esgotada permanece comprável (`ativa == false`).

## Integration tests
- `Marketplace` + `PropertyToken` + `ComplianceModule` (feature 001): listagem, tentativa de compra sem KYC (deve reverter), compra com KYC (deve suceder).
- Cenário de duas compras concorrentes na mesma listagem (mesmo bloco simulado).

## Fork tests
- Fork da testnet Polygon: ciclo completo de listagem + compra parcial + compra do restante, medindo gas.

## Critério de saída
100% dos cenários de `spec.md` e `contracts/marketplace.md` cobertos; `forge coverage` ≥ 100% em `listar`, `comprar`, `cancelar`.
