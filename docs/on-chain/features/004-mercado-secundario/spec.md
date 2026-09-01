---
status: draft
owner: tech-lead
last_updated: 2026-08-17
---

# Feature 004 — Mercado Secundário

Origem: pitch slide 3 ("negociação livre") e slide 6 (Força: "Liquidez: cotas negociáveis a qualquer hora"; Ameaça: "hacks em smart contracts mal auditados").

## Objetivo
Permitir que investidores comprem e vendam cotas entre si após a emissão primária, resolvendo a baixa liquidez apontada como problema no pitch (slide 2), com um modelo simplificado (preço fixo) adequado ao volume da POC.

## Personas
- **Investidor vendedor**: lista cotas para venda a um preço fixo.
- **Investidor comprador**: compra cotas listadas.

## Requisitos funcionais

| ID | Requisito |
|---|---|
| RF-16 | O sistema deve permitir que um holder liste uma quantidade de cotas para venda a um preço fixo por ele definido. |
| RF-17 | O sistema deve permitir que outro investidor verificado compre uma listagem, total ou parcialmente. |
| RF-18 | O sistema deve permitir que o vendedor cancele sua listagem antes de ser comprada. |
| RF-19 | Toda transferência decorrente de uma compra no mercado secundário deve respeitar a mesma checagem de compliance da emissão primária (RF-10, feature 001). |
| RF-20 | O sistema deve impedir que um comprador sem KYC aprovado conclua uma compra. |

## Requisitos não funcionais
- **RNF-08**: listagens e compras devem emitir eventos suficientes para reconstrução completa do histórico de negociação (auditabilidade — slide 6, Força: "transparência total pelo blockchain").
- **RNF-09**: a POC não implementa order book nem leilão — apenas listagem a preço fixo (non-goal em `../../00-constitution.md`), reduzindo superfície de MEV/front-running (SEC-04).

## Cenários de aceite

| Cenário | Dado | Quando | Então |
|---|---|---|---|
| Listagem criada | Holder possui 10 cotas | Holder chama `listar(10, precoPorCota)` | Listagem ativa criada; cotas ficam bloqueadas (escrow) até venda ou cancelamento |
| Compra total | Listagem de 10 cotas ativa | Comprador verificado compra as 10 cotas | Cotas transferidas ao comprador; pagamento transferido ao vendedor; listagem encerrada |
| Compra parcial | Listagem de 10 cotas ativa | Comprador verificado compra 4 cotas | 4 cotas transferidas; listagem permanece ativa com 6 cotas restantes |
| Compra sem KYC | Comprador sem `isVerified` | Tenta comprar uma listagem | Transação reverte (RF-20) |
| Cancelamento | Vendedor tem listagem ativa | Vendedor chama `cancelar(idListagem)` | Cotas em escrow retornam ao saldo do vendedor; listagem encerrada |
| Listagem por não-dono | Carteira diferente do dono da listagem | Tenta cancelar ou alterar a listagem | Transação reverte |

## Fora de escopo desta feature
- Order book com múltiplos preços concorrentes, leilão, ou AMM (non-goal explícito da POC).
- Negociação entre imóveis diferentes (cada `Marketplace` opera sobre um `PropertyToken` específico, ou um `Marketplace` único parametrizado por imóvel — decisão em `plan.md`).
