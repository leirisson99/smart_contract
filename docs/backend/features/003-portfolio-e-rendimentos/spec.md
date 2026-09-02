---
status: approved
owner: tech-lead
last_updated: 2026-09-02
---

# Feature Backend 003 — Portfólio e Rendimentos

Origem: pitch slide 4 ("rendimento automático") e ADR-0004 (modelo pull-payment com claim). Depende de [001-onboarding-e-custodia](../001-onboarding-e-custodia/spec.md) para a carteira custodial do investidor.

## Objetivo
Expor a leitura do portfólio do investidor e executar automaticamente o `claim` de rendimentos disponíveis em seu nome, entregando na UX da plataforma a promessa de "automático" do pitch, mantida on-chain como pull-payment (ADR-0004) em [`../../../on-chain/features/003-distribuicao-rendimentos`](../../../on-chain/features/003-distribuicao-rendimentos/spec.md).

## Personas
- **Investidor**: consulta seu portfólio e recebe rendimentos automaticamente, sem precisar entender o mecanismo on-chain de claim.

## Requisitos funcionais

| ID | Requisito |
|---|---|
| RF-23 | O backend deve expor um endpoint de leitura do portfólio do investidor: cotas possuídas, valor investido, histórico de rendimentos recebidos e pendentes. |
| RF-24 | O backend deve executar automaticamente o `claim` de rendimentos disponíveis em nome do investidor (via carteira custodial, job periódico), refletindo a promessa de "automático" (ADR-0004). O job tenta `claimTodos` (batch, mais eficiente) para o conjunto de investidores com saldo reivindicável (`valorReivindicavel > 0`); se a chamada em lote falhar, cai para `claim` individual por investidor. Uma falha isolada (ex.: uma carteira específica revertendo) não pode interromper o processamento das demais — o job registra o erro e segue para o próximo investidor. |

### Contrato de API (endpoints expostos por esta feature)
- `GET /portfolio` (por investidor autenticado) — cotas possuídas, valor investido, histórico de rendimentos recebidos e pendentes.

Payloads, formato de erro e o vocabulário completo de códigos ficam em [`../../api-contract.md`](../../api-contract.md).

## Cenários de aceite

| Cenário | Dado | Quando | Então |
|---|---|---|---|
| Claim automático | Rendimento disponível para o investidor (`../../../on-chain/features/003-distribuicao-rendimentos`, depositado via [005-painel-administrativo](../005-painel-administrativo/spec.md)) | Job periódico da plataforma roda | Backend executa `claim`/`claimTodos` em nome do investidor; endpoint de portfólio passa a refletir o valor recebido |
| Falha isolada não trava o job | Um investidor entre vários com saldo reivindicável tem sua chamada de `claim` revertida (ex.: carteira em estado inesperado) | Job periódico roda para o lote | O erro é registrado e o job continua processando os demais investidores; nenhum investidor com claim bem-sucedido deixa de receber por causa da falha de outro |

## Fora de escopo desta feature
- Cálculo do valor do rendimento e mecanismo de snapshot — definidos on-chain em [`../../../on-chain/features/003-distribuicao-rendimentos`](../../../on-chain/features/003-distribuicao-rendimentos/spec.md).
- Depósito do rendimento mensal pelo gestor — coberto por [005-painel-administrativo](../005-painel-administrativo/spec.md).
- Criação de carteira custodial — coberta por [001](../001-onboarding-e-custodia/spec.md).
- Telas de portfólio — cobertas por [`../../../frontend/features/001-interface-investidor`](../../../frontend/features/001-interface-investidor/spec.md).
