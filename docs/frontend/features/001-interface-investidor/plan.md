---
status: draft
owner: tech-lead
last_updated: 2026-08-17
---

# Plano Técnico — Feature Frontend 001

## Componentes
| Componente | Camada | Responsabilidade |
|---|---|---|
| Aplicação web (SPA/SSR) | Frontend | Telas de cadastro/KYC, imóvel, portfólio, painel do gestor, mercado secundário |
| Cliente de API | Frontend | Consome exclusivamente a API do backend (`../../../backend/features`, repositório irmão `backend/`, 5 features) — nunca chama contratos diretamente |
| Camada de estado/cache | Frontend | Mantém dados de portfólio, listagens e status de KYC sincronizados com o backend (polling ou eventos) |

## Regra de fronteira (importante)
O frontend **não** tem acesso a chaves privadas, não assina transações e não chama contratos diretamente. Toda ação de negócio (comprar cotas, fazer claim, listar no mercado secundário, criar imóvel, depositar rendimento) é uma chamada de API ao backend, que por sua vez interage com os contratos (ver os `implement.md` de cada feature em `../../../backend/features`). Essa separação existe porque:
- Mantém a promessa de "sem conhecimento técnico" do pitch (slide 4) — o investidor nunca lida com carteira, gas ou assinatura.
- Centraliza a custódia e a validação de segurança em um único ponto (backend), reduzindo superfície de ataque no cliente.

## Fluxo ponta a ponta
Ver tabela de cenários em `spec.md` — cobre RF-27 a RF-32, cada um consumindo um endpoint do backend mapeado em `integration.md` desta feature.

## Dependências
- Depende de `../../../backend/features` (5 features) para toda ação de negócio e para dados de estado (portfólio, KYC, listagens).
- Depende indiretamente das features on-chain de `../../../on-chain/features` (`001` a `004`), mas nunca as acessa diretamente.
