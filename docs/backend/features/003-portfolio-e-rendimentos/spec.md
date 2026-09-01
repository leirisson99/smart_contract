---
status: draft
owner: tech-lead
last_updated: 2026-09-01
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
| RF-24 | O backend deve executar automaticamente o `claim` de rendimentos disponíveis em nome do investidor (via carteira custodial, job periódico), refletindo a promessa de "automático" (ADR-0004). |

## Cenários de aceite

| Cenário | Dado | Quando | Então |
|---|---|---|---|
| Claim automático | Rendimento disponível para o investidor (`../../../on-chain/features/003-distribuicao-rendimentos`, depositado via [005-painel-administrativo](../005-painel-administrativo/spec.md)) | Job periódico da plataforma roda | Backend executa `claim` em nome do investidor; endpoint de portfólio passa a refletir o valor recebido |

## Fora de escopo desta feature
- Cálculo do valor do rendimento e mecanismo de snapshot — definidos on-chain em [`../../../on-chain/features/003-distribuicao-rendimentos`](../../../on-chain/features/003-distribuicao-rendimentos/spec.md).
- Depósito do rendimento mensal pelo gestor — coberto por [005-painel-administrativo](../005-painel-administrativo/spec.md).
- Criação de carteira custodial — coberta por [001](../001-onboarding-e-custodia/spec.md).
- Telas de portfólio — cobertas por [`../../../frontend/features/001-interface-investidor`](../../../frontend/features/001-interface-investidor/spec.md).
