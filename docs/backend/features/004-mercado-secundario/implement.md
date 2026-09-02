---
status: approved
owner: tech-lead
last_updated: 2026-09-02
---

# Implementação — Feature Backend 004

> Consolida mapa de integração on-chain, estratégia de testes e status de implementação desta feature.

## Integração com contratos

| Ação na plataforma | Contrato acionado | Feature on-chain | Observação |
|---|---|---|---|
| Investidor lista cotas para venda | `Marketplace.listar` | `../../../on-chain/features/004-mercado-secundario` | Backend assina em nome da carteira custodial ([001](../001-onboarding-e-custodia/implement.md)) |
| Investidor compra no mercado secundário | `Marketplace.comprar` | `../../../on-chain/features/004-mercado-secundario` | Backend assina em nome da carteira custodial; valida KYC antes de enviar (checagem otimista de UX, mas o contrato revalida) |

### Consulta de estado (view functions, sem transação)
- `Marketplace.listagensAtivasPorToken` — exibir mercado secundário na interface.

## Estratégia de testes

Depende dos contratos de `../../../on-chain/features/004-mercado-secundario` já testados. A estratégia aqui cobre a camada de integração backend ↔ contrato.

- Fluxo de mercado secundário: listagem → compra por outro investidor → saldo atualizado em ambos os portfólios ([003](../003-portfolio-e-rendimentos/implement.md)).

### Critério de saída
Todos os cenários de `spec.md` cobertos por teste de integração (Anvil local, via mocks) ou verificação manual ponta a ponta. Nenhum teste e2e automatizado gated por `RUN_E2E=1` foi adicionado para esta feature (diferente de 002/003) — fica como débito, mesmo padrão de teste manual ponta a ponta já documentado acima.

## Nota de segurança
Mesmo princípio de RNF-16 (ver [002](../002-investimento-primario/implement.md)) — a checagem de KYC feita pelo backend antes de enviar `Marketplace.comprar` é só uma otimização de UX; a segurança vem do próprio contrato recusar a transferência.

## Status de implementação
Implementado e testado — `backend/src/routes/marketplace.ts`, `backend/src/services/marketplaceChain.ts`, `backend/src/abi/Marketplace.ts`. Testes unitários mockando a chain (`backend/test/marketplace.routes.test.ts`) + verificação manual ponta a ponta contra Anvil local (deploy via `projeto_imobiliaria/script/DeployMarketplace.s.sol`, claim `KYC_APPROVED` via `backend/scripts/grant-marketplace-kyc.ts`) cobrindo listar → comprar por outro investidor → cancelar, com saldo e valor investido refletidos no portfólio de ambos os investidores. `frontend/lib/api/marketplace.ts` trocado do mock para chamadas reais no mesmo padrão de `kyc.ts`/`imoveis.ts`/`portfolio.ts`; corrigido também um bug de estado obsoleto em `CreateListingDialog` (`imovelId` nunca sincronizava com os holdings carregados de forma assíncrona) que impedia a criação de listagens na UI real. Reconciliado com o código em 2026-09-02 (Sprint 7).
