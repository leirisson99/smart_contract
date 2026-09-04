---
status: approved
owner: tech-lead
last_updated: 2026-09-02
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

### Contrato de API (endpoints expostos por esta feature)
- `GET /imoveis/:id` (ou equivalente) — dados do imóvel disponível: valor, cotas restantes, rendimento estimado.
- `POST /imoveis/:id/comprar` — assina e envia `comprarCotas` em nome da carteira custodial do investidor chamador.

Payloads, formato de erro e o vocabulário completo de códigos ficam em [`../../api-contract.md`](../../api-contract.md).

## Requisitos não funcionais
- **RNF-16 (última linha de defesa)**: todo endpoint que executa uma ação de negócio revalida compliance/saldo/KYC no momento da chamada, nunca confiando apenas na validação já feita pela interface (`frontend`) nem no status de KYC gravado no banco em [001](../001-onboarding-e-custodia/spec.md) — que pode estar desatualizado se uma claim for revogada on-chain (ver gap conhecido em `001/tasks.md`, item 7). Mesmo princípio referenciado por [004](../004-mercado-secundario/spec.md) e [005](../005-painel-administrativo/spec.md).

## Cenários de aceite

| Cenário | Dado | Quando | Então |
|---|---|---|---|
| Compra via endpoint | Investidor com KYC aprovado ([001](../001-onboarding-e-custodia/spec.md)) chama o endpoint de compra | Backend recebe a chamada | Backend assina e envia a transação `comprarCotas` (`../../../on-chain/features/002-tokenizacao-imovel`) usando a carteira custodial do investidor |
| Rejeição por saldo/KYC revalidados (RNF-16) | Investidor cujo KYC foi aprovado no backend, mas depois revogado on-chain (ou sem cotas suficientes / abaixo do valor mínimo) | Ele chama o endpoint de compra | Backend revalida contra `IdentityRegistry.isVerified`/`ComplianceModule.canTransfer` e o estado atual do imóvel no momento da chamada, e rejeita com o código correspondente (`SEM_KYC`, `COTAS_INSUFICIENTES` ou `VALOR_MINIMO_NAO_ATINGIDO`) sem enviar a transação — mesmo que o registro interno de KYC ainda diga aprovado |

## Fora de escopo desta feature
- Integração com gateway de pagamento fiat específico (decisão de parceria comercial, ver [`../../../plan.md`](../../../on-chain/features/002-tokenizacao-imovel/plan.md)).
- Criação de carteira custodial e verificação de KYC — cobertas por [001](../001-onboarding-e-custodia/spec.md).
- Leitura de portfólio após a compra — coberta por [003-portfolio-e-rendimentos](../003-portfolio-e-rendimentos/spec.md).
- Telas de compra — cobertas por [`../../../frontend/features/001-interface-investidor`](../../../frontend/features/001-interface-investidor/spec.md).
- Autenticação/sessão do investidor — coberta por [006-autenticacao-investidor](../006-autenticacao-investidor/spec.md); `POST /imoveis/:id/comprar` deriva o investidor da sessão (`preHandler exigirInvestidor`), não mais de `investorId` no payload.
