---
status: draft
owner: tech-lead
last_updated: 2026-09-01
---

# Feature Backend 004 — Mercado Secundário

Origem: negociação livre de cotas entre investidores, contraparte de serviço de [`../../../on-chain/features/004-mercado-secundario`](../../../on-chain/features/004-mercado-secundario/spec.md) (`Marketplace`). Depende de [001-onboarding-e-custodia](../001-onboarding-e-custodia/spec.md) para a carteira custodial e o status de KYC do investidor.

## Objetivo
Expor os endpoints que permitem ao investidor listar cotas para venda e comprar cotas de outros investidores no mercado secundário, assinando as transações em nome da sua carteira custodial.

## Personas
- **Investidor**: lista cotas próprias para venda e compra cotas de outros investidores.

## Requisitos funcionais

| ID | Requisito |
|---|---|
| RF-34 | O backend deve expor um endpoint que assina e envia a transação `Marketplace.listar` (`../../../on-chain/features/004-mercado-secundario`) em nome da carteira custodial do investidor, listando suas cotas para venda. |
| RF-35 | O backend deve expor um endpoint que assina e envia a transação `Marketplace.comprar` (`../../../on-chain/features/004-mercado-secundario`) em nome da carteira custodial do investidor, validando o KYC do comprador antes do envio (checagem otimista de UX — RNF-16, ver [002](../002-investimento-primario/spec.md)). |

## Cenários de aceite

| Cenário | Dado | Quando | Então |
|---|---|---|---|
| Listagem no mercado secundário | Investidor com cotas na carteira custodial chama o endpoint de listagem | Backend recebe a chamada | Backend assina e envia `Marketplace.listar`; a listagem passa a aparecer para outros investidores |
| Compra no mercado secundário | Investidor com KYC aprovado ([001](../001-onboarding-e-custodia/spec.md)) chama o endpoint de compra sobre uma listagem ativa | Backend recebe a chamada | Backend assina e envia `Marketplace.comprar`; saldo é atualizado no portfólio ([003](../003-portfolio-e-rendimentos/spec.md)) de ambos os investidores |

## Fora de escopo desta feature
- Definição de preço, taxa de transação e regras de escrow — definidas on-chain em [`../../../on-chain/features/004-mercado-secundario`](../../../on-chain/features/004-mercado-secundario/spec.md).
- Criação de carteira custodial e verificação de KYC — cobertas por [001](../001-onboarding-e-custodia/spec.md).
- Telas de mercado secundário — cobertas por [`../../../frontend/features/001-interface-investidor`](../../../frontend/features/001-interface-investidor/spec.md).
