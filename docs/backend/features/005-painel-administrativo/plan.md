---
status: approved
owner: tech-lead
last_updated: 2026-09-02
---

# Plano Técnico — Feature Backend 005

## Componentes
| Componente | Camada | Responsabilidade |
|---|---|---|
| API administrativa | Off-chain | Expõe os endpoints usados pelo painel do gestor, restritos a papel administrativo |
| Middleware de autenticação/RBAC | Off-chain | Único mecanismo de autenticação do backend hoje — barra qualquer chamada a `/admin/*` sem credencial válida |

## Toolchain (fora do escopo de Foundry — ADR-0003 cobre só os contratos)
Integração com os contratos via biblioteca de cliente EVM (ex.: viem/ethers.js).

## Decisão: mecanismo de autenticação/RBAC

**Chave estática de API (`ADMIN_API_KEY`), enviada no header `x-admin-api-key`**, comparada em tempo constante em `backend/src/middleware/adminAuth.ts` e aplicada como `preHandler` a todas as rotas de `backend/src/routes/admin.ts` (encapsulamento nativo do Fastify — não vaza para as demais rotas).

Alternativas consideradas e descartadas para o escopo desta POC:
- **JWT com login**: exigiria uma tabela de usuários/gestores, fluxo de login e expiração/refresh de sessão — nenhum desses existe hoje (nem para investidor, que já opera sem sessão via `investorId` explícito, ver gap conhecido em [`../../api-contract.md`](../../api-contract.md)). Overkill para o único papel administrativo da POC (1 gestor da SPE, `non-goals` da [constituição](../../../on-chain/00-constitution.md)).
- **Sessão de servidor**: mesmo problema — exige estado de sessão e login, sem ganho sobre uma chave estática dado que há um único gestor.

A chave estática cobre o requisito real do RNF de RBAC (diferenciar o gestor de um investidor comum) com o menor custo de implementação, e é consistente com o padrão já usado para as outras chaves sensíveis do backend (`TRUSTED_ISSUER_PRIVATE_KEY`, `GAS_SPONSOR_PRIVATE_KEY`): valor em `.env`, nunca versionado, com nota de que produção exige rotação/HSM. RNF-16 continua a última linha de defesa real: mesmo que este middleware falhe em barrar a chamada, `PropertyFactory`/`DividendDistributor` revalidam `PLATFORM_ADMIN_ROLE`/`GESTOR_ROLE` on-chain independentemente (ver `../../../on-chain/features/002-tokenizacao-imovel` e `003-distribuicao-rendimentos`).

As rotas de `001`-`004` (investidor) permanecem sem autenticação — gap pré-existente, documentado como dívida aceita para a POC (não uma decisão desta feature) em [`../../api-contract.md`](../../api-contract.md) e no checklist de segurança off-chain (`../../security-checklist.md`).

## Integração on-chain de `POST /admin/imoveis`

`PropertyFactory.criarImovel` só deploya o `PropertyToken` (clone EIP-1167) — não existe uma Factory para `DividendDistributor` (deploy direto por imóvel, ver `projeto_imobiliaria/src/DividendDistributor.sol`). O endpoint reproduz a sequência de `DeployPropertyPipeline.s.sol` com a carteira do gestor (`GESTOR_PRIVATE_KEY`):
1. `PropertyFactory.criarImovel(nome, valorTotal, numeroCotas)` → endereço do `PropertyToken`, extraído do evento `ImovelCriado` no recibo.
2. Deploy de um `DividendDistributor` novo apontando para esse `PropertyToken` (`gestorWallet.deployContract`, bytecode do artefato Foundry).
3. `PropertyToken.grantRole(SNAPSHOT_ROLE, distributor)`, para que o distributor possa tirar snapshot a cada depósito de rendimento.

A mesma carteira do gestor cobre as três chamadas porque `PropertyToken.inicializar` concede `DEFAULT_ADMIN_ROLE`/`PLATFORM_ADMIN_ROLE` a quem chamou `criarImovel` na Factory, e o construtor de `DividendDistributor` concede `DEFAULT_ADMIN_ROLE`/`GESTOR_ROLE` a quem o deploya — a mesma chave que detém `PLATFORM_ADMIN_ROLE` na `PropertyFactory` (quem a deployou, ver `.env.example`) automaticamente vira admin/gestor de cada imóvel/distributor que cria.

## Fluxo ponta a ponta
Gestor autenticado (`x-admin-api-key` revalidado a cada chamada, papel administrativo revalidado on-chain pelo próprio contrato) → `POST` criar imóvel aciona `PropertyFactory.criarImovel` + deploy do `DividendDistributor` → `POST` depositar rendimento aciona `DividendDistributor.depositarRendimento` (a carteira do gestor é financiada com a moeda de teste via o mesmo `garantirSaldoMoedaTeste` usado para as carteiras dos investidores, já que o `MockERC20` não faz mint inicial para ninguém) → `GET` status de KYC lê os dados armazenados em [001-onboarding-e-custodia](../../../plan.md). Ver tabela de cenários em `spec.md`.

## Dependências
- Depende de [001-onboarding-e-custodia](../../../plan.md) (leitura de status de KYC).
- Depende de `../../../on-chain/features/002-tokenizacao-imovel` (`PropertyFactory.criarImovel`) e `../../../on-chain/features/003-distribuicao-rendimentos` (`DividendDistributor.depositarRendimento`).
- É consumida por `../../../frontend/features/001-interface-investidor` (painel do gestor).
