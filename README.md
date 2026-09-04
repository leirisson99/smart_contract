# Tokenização Imobiliária

POC de tokenização de imóveis: um imóvel de R$10M é dividido em 1.000 cotas digitais de R$10.000, negociáveis entre investidores, com rendimento de aluguel distribuído automaticamente aos holders via smart contracts. Objetivo da POC (16 semanas): validar o modelo com 1 imóvel e 20 investidores reais.

Construído com **Spec-Driven Development (SDD)** + **TDD** — toda implementação é derivada de specs aprovadas em [`docs/`](docs/plan.md), o índice completo do pacote de especificações (constituição, ADRs, sprints, log de progresso e pendências).

## Arquitetura

| Camada | Diretório | Stack | Descrição |
|---|---|---|---|
| On-chain | [`projeto_imobiliaria/`](projeto_imobiliaria/README.md) | Foundry, Solidity, OpenZeppelin v5, ERC-3643 (T-REX), Polygon PoS | Contratos: `IdentityRegistry`, `ComplianceModule`, `PropertyToken`, `PropertyFactory`, `DividendDistributor`, `Marketplace` |
| Backend | [`backend/`](backend/) | Fastify, Prisma, PostgreSQL, viem, TypeScript | Onboarding, custódia de carteira, orquestração de KYC, e única camada off-chain que fala diretamente com os contratos |
| Frontend | [`frontend/`](frontend/README.md) | Next.js 16, React 19, Tailwind, Radix UI | Interface do investidor e painel do gestor; nunca acessa contratos diretamente, consome só a API do backend |

O backend é a fronteira on-chain/off-chain do KYC (ver [ADR-0006](docs/on-chain/decisions/ADR-0006-fronteira-onchain-offchain-kyc.md)); o frontend nunca fala com a blockchain diretamente.

## Setup rápido (ambiente local)

Pré-requisitos: [Foundry](https://book.getfoundry.sh/getting-started/installation) (`forge`/`cast`/`anvil`), Node.js, Docker (para o Postgres do backend).

```bash
# 1. clonar com os submódulos on-chain (forge-std, openzeppelin-contracts)
git clone --recurse-submodules <repo>

# 2. subir o Postgres do backend
cd backend && docker compose up -d

# 3. instalar dependências e configurar variáveis de ambiente
cd projeto_imobiliaria && forge install && cp .env.example .env && cd ..
cd backend && npm install && cp .env.example .env && npx prisma migrate dev && cd ..
cd frontend && npm install && cd ..

# 4. subir uma Anvil local, deployar todos os contratos e sincronizar
#    backend/.env + a tabela Property com os endereços novos
bash scripts/dev-e2e-up.sh

# 5. em terminais separados
cd backend && npm run dev     # API em http://localhost:3333
cd frontend && npm run dev    # UI em http://localhost:3000
```

`scripts/dev-e2e-up.sh` recria o ambiente do zero a cada reinício da Anvil (que não persiste estado). Detalhes de configuração de cada camada estão nos READMEs próprios ([`projeto_imobiliaria/README.md`](projeto_imobiliaria/README.md), [`backend/.env.example`](backend/.env.example)).

## Testes e verificação

```bash
cd projeto_imobiliaria && forge test -vvv && forge coverage   # contratos (unit + fuzz)
cd backend && npm test                                        # API (vitest)
cd frontend && npm run lint                                   # UI
```

CI roda em [`.github/workflows/`](.github/workflows/) (`contracts-ci.yml`, `backend-ci.yml`, `frontend-ci.yml`) a cada push.

## Documentação

- [`docs/plan.md`](docs/plan.md) — índice do pacote de specs (features, ADRs, roadmap, status)
- [`docs/on-chain/00-constitution.md`](docs/on-chain/00-constitution.md) — princípios de engenharia e compliance
- [`docs/PROGRESS.md`](docs/PROGRESS.md) — log do que já foi implementado, testado e verificado
- [`docs/PENDENCIAS.md`](docs/PENDENCIAS.md) — bloqueios e itens em aberto

## Estado atual

Contratos (Sprints 1-4): 6 contratos implementados, 110/110 testes, 100% de cobertura; análise estática (Slither) e dinâmica (Mythril) concluídas. Backend: features de onboarding/KYC, investimento primário e portfólio implementadas e testadas e2e; painel administrativo com RBAC via API key. Frontend: telas do investidor e do gestor implementadas sobre uma API mockada. Detalhe completo em [`docs/PROGRESS.md`](docs/PROGRESS.md) e [`docs/PENDENCIAS.md`](docs/PENDENCIAS.md).
