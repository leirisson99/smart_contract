---
status: approved
owner: tech-lead
last_updated: 2026-09-02
---

# Feature Backend 005 — Painel Administrativo

Origem: pitch slide 8 (painel do gestor). Depende de [001-onboarding-e-custodia](../001-onboarding-e-custodia/spec.md) para a leitura do status de KYC dos investidores.

## Objetivo
Expor os endpoints administrativos usados pelo gestor da SPE: criação de imóvel, depósito do rendimento mensal e consulta do status de KYC dos investidores.

## Personas
- **Gestor da SPE / administrador**: opera a plataforma através destes endpoints, autenticado com papel administrativo.

## Requisitos funcionais

| ID | Requisito |
|---|---|
| RF-25 | O backend deve expor endpoints administrativos para o gestor: criar imóvel (aciona `PropertyFactory.criarImovel`, `../../../on-chain/features/002-tokenizacao-imovel`), depositar rendimento mensal (aciona `DividendDistributor.depositarRendimento`, `../../../on-chain/features/003-distribuicao-rendimentos`), e consultar status de KYC dos investidores (lê os dados de [001-onboarding-e-custodia](../001-onboarding-e-custodia/spec.md)). **Nota de dependência**: esta feature depende apenas dos **contratos on-chain** `002-tokenizacao-imovel` e `003-distribuicao-rendimentos` (já implementados e testados), não das features de **backend** 002/003 (que cobrem os fluxos do investidor, não do gestor) — não há bloqueio de sequenciamento entre elas. |

### Contrato de API (endpoints expostos por esta feature)
- `GET /admin/investidores` — lista de investidores com status de KYC.
- `POST /admin/imoveis` — aciona `PropertyFactory.criarImovel`.
- `POST /admin/imoveis/:id/depositar-rendimento` — aciona `DividendDistributor.depositarRendimento`.

Payloads, formato de erro e o vocabulário completo de códigos ficam em [`../../api-contract.md`](../../api-contract.md).

## Requisitos não funcionais
- Mesmo princípio de RNF-16 (última linha de defesa, ver [002](../002-investimento-primario/spec.md)): todo endpoint administrativo revalida o papel do chamador no momento da chamada, e o próprio contrato revalida o papel (`PLATFORM_ADMIN_ROLE`/role de gestor) independentemente da autenticação do backend.
- **Autenticação/RBAC**: nenhuma rota do backend hoje (feature 001, já implementada) tem qualquer mecanismo de autenticação — `backend/src/server.ts` apenas registra as rotas, sem middleware. Esta feature é a primeira a exigir diferenciar um "gestor" autenticado de um investidor comum; o mecanismo concreto (JWT, API key, sessão) é uma decisão de `plan.md`, não deste `spec.md`, mas o requisito de existir alguma autenticação/RBAC antes de expor estes endpoints é obrigatório.

## Cenários de aceite

| Cenário | Dado | Quando | Então |
|---|---|---|---|
| Criar imóvel | Gestor autenticado chama o endpoint de criação de imóvel | Backend recebe a chamada com role validada | Backend aciona `PropertyFactory.criarImovel`; retorna o endereço do `PropertyToken` criado |
| Depósito de rendimento | Gestor autenticado chama o endpoint de depósito de rendimento | Backend recebe a chamada com role validada | Backend aciona `DividendDistributor.depositarRendimento`; retorna confirmação estruturada |
| Consulta de status de KYC | Gestor autenticado consulta a lista de investidores | Backend recebe a chamada | Backend retorna o status de KYC de cada investidor, armazenado em [001](../001-onboarding-e-custodia/spec.md) |
| Rejeição por role inválida | Usuário autenticado sem papel de gestor (ou não autenticado) | Chama qualquer endpoint administrativo | Backend rejeita a chamada antes de acionar qualquer contrato; se por falha de sincronismo o backend não rejeitar, o próprio contrato revalida `PLATFORM_ADMIN_ROLE`/role de gestor e reverte a transação |

## Fora de escopo desta feature
- Processo operacional de depósito mensal pelo gestor da SPE, fora do contrato (ver [`PENDENCIAS.md`](../../../PENDENCIAS.md)).
- Definição de quem é "gestor" e como o papel é concedido (decisão de negócio, ver [`../../../on-chain/roadmap.md`](../../../on-chain/roadmap.md)).
- Execução de compra/claim/mercado secundário em nome do investidor — cobertas por [002](../002-investimento-primario/spec.md), [003](../003-portfolio-e-rendimentos/spec.md) e [004](../004-mercado-secundario/spec.md).
- Telas do painel do gestor — cobertas por [`../../../frontend/features/001-interface-investidor`](../../../frontend/features/001-interface-investidor/spec.md).
