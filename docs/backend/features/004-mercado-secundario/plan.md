---
status: approved
owner: tech-lead
last_updated: 2026-09-02
---

# Plano Técnico — Feature Backend 004

## Componentes
| Componente | Camada | Responsabilidade |
|---|---|---|
| API de mercado secundário | Off-chain | Expõe os endpoints de listagem e compra de cotas entre investidores |
| Assinador de transações | Off-chain | Assina e envia `Marketplace.listar`/`Marketplace.comprar` usando a carteira custodial do investidor |

## Toolchain (fora do escopo de Foundry — ADR-0003 cobre só os contratos)
Integração com os contratos via biblioteca de cliente EVM (ex.: viem/ethers.js).

## Fluxo ponta a ponta
Investidor lista cotas → backend assina e envia `Marketplace.listar` → listagem visível para outros investidores → outro investidor compra → backend revalida KYC (checagem otimista, RNF-16 em [002](../../../plan.md)) → assina e envia `Marketplace.comprar` → saldo atualizado em ambos os portfólios ([003](../../../plan.md)). Ver tabela de cenários em `spec.md`.

## Dependências
- Depende de [001-onboarding-e-custodia](../../../plan.md) (carteira custodial, status de KYC).
- Depende de `../../../on-chain/features/004-mercado-secundario` (`Marketplace`).
- É consumida por `../../../frontend/features/001-interface-investidor`.
