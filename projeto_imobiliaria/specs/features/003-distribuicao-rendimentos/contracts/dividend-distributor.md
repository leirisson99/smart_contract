---
status: draft
owner: tech-lead
last_updated: 2026-08-17
---

# Contrato: DividendDistributor

Implementa o modelo pull-payment definido em ADR-0004.

## Responsabilidades
- Receber depósitos de rendimento (aluguel) do gestor da SPE para um `PropertyToken` específico.
- Registrar um snapshot dos saldos no momento de cada depósito, criando um novo "ciclo".
- Permitir que cada holder reivindique sua parte proporcional de um ciclo, uma única vez por ciclo.

## Interface esperada (sem código)

**Funções de escrita:**
- `depositarRendimento(uint256 valor)` — apenas `PLATFORM_ADMIN_ROLE` ou role específica de gestor; recebe o valor (em stablecoin, mesma moeda de liquidação definida em `002-tokenizacao-imovel/plan.md`), tira snapshot do `PropertyToken` associado, abre novo ciclo.
- `claim(uint256 idCiclo)` — qualquer holder pode reivindicar sua parte de um ciclo específico ainda não reivindicado por ele.
- `claimTodos()` — conveniência: reivindica todos os ciclos pendentes do chamador de uma vez.

**Funções de leitura:**
- `valorReivindicavel(address holder, uint256 idCiclo) → uint256`.
- `cicloAtual() → uint256`.
- `jaReivindicou(address holder, uint256 idCiclo) → bool`.

**Eventos:**
- `RendimentoDepositado(uint256 idCiclo, uint256 valorTotal, uint256 totalSupplyNoSnapshot)`
- `RendimentoReivindicado(address holder, uint256 idCiclo, uint256 valor)`

## Invariantes
- `valorReivindicavel(holder, idCiclo)` é sempre proporcional ao saldo do holder no snapshot daquele ciclo, nunca ao saldo atual.
- Um holder nunca consegue reivindicar o mesmo ciclo duas vezes (RF-14).
- A soma de todos os valores reivindicados de um ciclo nunca excede o valor total depositado naquele ciclo (considerando dust documentado em RNF-07).
- `claim` nunca falha para um holder por causa do comportamento de outro holder (não-DoS, RNF-06) — cada claim é uma transação independente.

## Cenários de aceite (Dado/Quando/Então)
Ver tabela completa em `../spec.md`. Cenário adicional específico do contrato:

| Cenário | Dado | Quando | Então |
|---|---|---|---|
| Dust/arredondamento | Divisão de R$50.000 por 1.000 cotas não é exata (resíduo de poucos centavos) | Todos os holders reivindicam | Resíduo permanece no contrato, acumulando para o próximo ciclo (regra documentada em RNF-07) — nenhum valor é perdido |

## Riscos de segurança específicos
- **SEC-01 (reentrancy)**: `claim` segue CEI — marca `jaReivindicou` antes de transferir o valor; `ReentrancyGuard` aplicado.
- **SEC-06 (oráculo/centralização)**: valor do aluguel é lançado manualmente pelo gestor — risco de centralização documentado e aceito (`risks.md`); mitigação futura: múltiplos assinantes (multisig) para `depositarRendimento`.
- **SEC-07 (DoS)**: modelo pull elimina risco de um holder travar a distribuição dos demais.

## Referências
- OpenZeppelin `ReentrancyGuard`.
- Padrão de snapshot inspirado em `ERC20Snapshot` (OpenZeppelin) — usado para não permitir dupla contagem em transferências entre ciclos.
