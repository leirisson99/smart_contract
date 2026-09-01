---
status: draft
owner: tech-lead
last_updated: 2026-09-01
---

# Feature Backend 002 — Investimento Primário

Origem: pitch slide 4 (compra de cotas do imóvel disponível). Depende de [001-onboarding-e-custodia](../001-onboarding-e-custodia/spec.md) para a carteira custodial e o status de KYC do investidor.

## Objetivo
Expor os endpoints de investimento primário: consulta dos dados do imóvel disponível para compra e execução da compra de cotas (`PropertyToken.comprarCotas`, [`../../../on-chain/features/002-tokenizacao-imovel`](../../../on-chain/features/002-tokenizacao-imovel/spec.md)) em nome da carteira custodial do investidor.

## Personas
- **Investidor**: consulta o imóvel disponível e compra cotas através destes endpoints.

## Requisitos funcionais

| ID | Requisito |
|---|---|
| RF-22 | O backend deve expor um endpoint que retorna os dados do imóvel disponível (valor, cotas restantes, rendimento estimado) e um endpoint que assina e envia a transação `comprarCotas` (`../../../on-chain/features/002-tokenizacao-imovel`) em nome da carteira custodial do investidor. |

## Requisitos não funcionais
- **RNF-16 (última linha de defesa)**: todo endpoint que executa uma ação de negócio revalida compliance/saldo/KYC no momento da chamada, nunca confiando apenas na validação já feita pela interface (`frontend`). Mesmo princípio referenciado por [004](../004-mercado-secundario/spec.md) e [005](../005-painel-administrativo/spec.md).

## Cenários de aceite

| Cenário | Dado | Quando | Então |
|---|---|---|---|
| Compra via endpoint | Investidor com KYC aprovado ([001](../001-onboarding-e-custodia/spec.md)) chama o endpoint de compra | Backend recebe a chamada | Backend assina e envia a transação `comprarCotas` (`../../../on-chain/features/002-tokenizacao-imovel`) usando a carteira custodial do investidor |

## Fora de escopo desta feature
- Integração com gateway de pagamento fiat específico (decisão de parceria comercial, ver [`../../../plan.md`](../../../on-chain/features/002-tokenizacao-imovel/plan.md)).
- Criação de carteira custodial e verificação de KYC — cobertas por [001](../001-onboarding-e-custodia/spec.md).
- Leitura de portfólio após a compra — coberta por [003-portfolio-e-rendimentos](../003-portfolio-e-rendimentos/spec.md).
- Telas de compra — cobertas por [`../../../frontend/features/001-interface-investidor`](../../../frontend/features/001-interface-investidor/spec.md).
