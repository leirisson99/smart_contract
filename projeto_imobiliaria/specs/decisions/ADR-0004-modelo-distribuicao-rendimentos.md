---
status: approved
last_updated: 2026-08-17
---

# ADR-0004: Modelo de distribuição de rendimentos — pull-payment

## Status
approved

## Contexto
O pitch promete "rendimentos automáticos via smart contract" (slides 3 e 6) — o aluguel do imóvel é distribuído mensalmente aos holders de cotas proporcionalmente à sua participação. É preciso decidir o padrão de implementação: o contrato **envia** (push) o valor para cada holder automaticamente, ou cada holder **retira** (pull/claim) o valor que lhe é devido.

## Decisão
Adotar **pull-payment com claim**: o gestor deposita o valor do aluguel do mês no `DividendDistributor` (feature 003), que registra um snapshot dos saldos; cada holder chama `claim()` para receber sua parte proporcional. A "automação" prometida no pitch é entregue na UX da plataforma (feature 005), que notifica o investidor e pode executar o `claim` em seu nome via carteira custodial — sem exigir do investidor entender o mecanismo on-chain.

Motivos:
- Push automático para N holders em um único `for loop` cria risco de **negação de serviço (DoS)**: se qualquer endereço de holder reverter o recebimento (ex.: contrato malicioso, carteira com lógica de fallback quebrada), toda a distribuição para os demais holders trava.
- Push também tem custo de gas proporcional ao número de holders, pago integralmente pelo gestor/emissor a cada ciclo — pull distribui esse custo entre os próprios holders no momento do claim.
- Pull-payment é o padrão consolidado de segurança em contratos que distribuem valor a múltiplos beneficiários (ver OpenZeppelin `PaymentSplitter` como referência de padrão, não de implementação direta).

## Alternativas consideradas
| Alternativa | Prós | Contras | Motivo da rejeição |
|---|---|---|---|
| Push automático (loop) | Experiência "mágica" mais próxima da linguagem do pitch | Risco de DoS por um único holder; custo de gas concentrado no emissor; não escala | Risco de segurança inaceitável para uma feature financeira central |
| Pull-payment (escolhido) | Seguro contra DoS, custo de gas distribuído, padrão consolidado | Exige que o holder (ou a plataforma em seu nome) execute uma ação de claim | Mitigado via automação na camada de plataforma (feature 005), mantendo a promessa de "automático" do ponto de vista do investidor |

## Consequências
- Positivas: elimina classe inteira de vulnerabilidades de DoS; custo de gas previsível e distribuído.
- Negativas / trade-offs aceitos: a automação percebida pelo investidor passa a depender da feature `005-plataforma-investidor` (que deve executar claims em nome do investidor via carteira custodial) — isso vira um requisito explícito dessa feature, não apenas "nice to have".
- Impacto em specs de feature relacionadas: `003-distribuicao-rendimentos` (contrato `dividend-distributor.md`), `005-plataforma-investidor` (integração que executa claim automaticamente em nome do investidor).
