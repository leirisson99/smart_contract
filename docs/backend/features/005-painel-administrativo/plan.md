---
status: draft
owner: tech-lead
last_updated: 2026-09-01
---

# Plano Técnico — Feature Backend 005

## Componentes
| Componente | Camada | Responsabilidade |
|---|---|---|
| API administrativa | Off-chain | Expõe os endpoints usados pelo painel do gestor, restritos a papel administrativo |

## Toolchain (fora do escopo de Foundry — ADR-0003 cobre só os contratos)
Integração com os contratos via biblioteca de cliente EVM (ex.: viem/ethers.js).

## Fluxo ponta a ponta
Gestor autenticado (papel administrativo revalidado a cada chamada) → `POST` criar imóvel aciona `PropertyFactory.criarImovel` → `POST` depositar rendimento aciona `DividendDistributor.depositarRendimento` → `GET` status de KYC lê os dados armazenados em [001-onboarding-e-custodia](../../../plan.md). Ver tabela de cenários em `spec.md`.

## Dependências
- Depende de [001-onboarding-e-custodia](../../../plan.md) (leitura de status de KYC).
- Depende de `../../../on-chain/features/002-tokenizacao-imovel` (`PropertyFactory.criarImovel`) e `../../../on-chain/features/003-distribuicao-rendimentos` (`DividendDistributor.depositarRendimento`).
- É consumida por `../../../frontend/features/001-interface-investidor` (painel do gestor).
