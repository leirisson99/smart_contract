---
status: draft
owner: tech-lead
last_updated: 2026-08-17
---

# Feature 003 — Distribuição de Rendimentos

Origem: pitch slide 4, passo 5 ("Rendimentos mensais — aluguel distribuído automaticamente pelo smart contract") e slide 3 ("rendimentos automáticos").

## Objetivo
Distribuir o valor do aluguel recebido mensalmente pela SPE entre os holders de cotas de um imóvel, de forma proporcional ao saldo de cada um, com segurança contra DoS (ADR-0004).

## Personas
- **Gestor da SPE**: deposita mensalmente o valor do aluguel recebido do inquilino.
- **Investidor**: reivindica (`claim`) sua parte proporcional.
- **Plataforma**: pode executar o `claim` em nome do investidor via carteira custodial, para preservar a promessa de "automático" da UX (ver ADR-0004).

## Requisitos funcionais

| ID | Requisito |
|---|---|
| RF-11 | O sistema deve permitir que o gestor deposite o valor do aluguel do mês para um imóvel específico. |
| RF-12 | O sistema deve calcular a parte de cada holder proporcionalmente ao seu saldo de cotas no momento do depósito (snapshot). |
| RF-13 | O sistema deve permitir que cada holder reivindique (`claim`) sua parte a qualquer momento após o depósito. |
| RF-14 | O sistema não deve permitir claim duplicado do mesmo ciclo pelo mesmo holder. |
| RF-15 | O sistema deve permitir múltiplos ciclos de distribuição ao longo do tempo (a POC valida 2 ciclos, conforme roadmap). |

## Requisitos não funcionais
- **RNF-06**: nenhum holder pode bloquear o recebimento dos demais (garantia de não-DoS, ver ADR-0004).
- **RNF-07**: arredondamento/dust (resíduo de divisão não exata) deve ser tratado de forma determinística e documentada (ex.: acumula para o próximo ciclo ou fica retido no contrato até um valor mínimo de resgate).

## Cenários de aceite

| Cenário | Dado | Quando | Então |
|---|---|---|---|
| Depósito de aluguel | Gestor recebeu R$50.000 de aluguel do imóvel do mês | Gestor chama `depositarRendimento(50_000)` | Snapshot dos saldos é registrado para este ciclo; evento de depósito emitido |
| Claim proporcional | Investidor possui 5% das cotas; ciclo com R$50.000 depositado | Investidor chama `claim()` | Investidor recebe R$2.500 (5% de R$50.000) |
| Claim duplicado bloqueado | Investidor já reivindicou o ciclo atual | Investidor chama `claim()` novamente no mesmo ciclo | Transação reverte — nada a reivindicar |
| Transferência de cota entre ciclos | Investidor vende suas cotas após o snapshot do ciclo N, antes do claim | Investidor chama `claim()` do ciclo N | Investidor ainda recebe a parte do ciclo N (baseada no snapshot), independente de já ter vendido a cota |
| Múltiplos ciclos | Ciclo 1 já distribuído e reivindicado | Ciclo 2 é depositado no mês seguinte | Investidor pode reivindicar o ciclo 2 normalmente, com base no novo snapshot |

## Fora de escopo desta feature
- Oráculo automatizado de valor de aluguel — valor é lançado manualmente pelo gestor (non-goal da `../../00-constitution.md`; risco SEC-06 aceito e documentado).
- Reinvestimento automático do rendimento em novas cotas (feature futura).
