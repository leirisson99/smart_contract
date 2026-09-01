# Tokenização Imobiliária — Smart Contracts

POC de tokenização de imóveis (ERC-3643) rodando em Polygon PoS, construída com Foundry seguindo Spec-Driven Development + TDD. A documentação do projeto (specs, ADRs, sprints, progresso) vive em [`../docs/`](../docs/plan.md), repositório irmão — ver [`../docs/on-chain/00-constitution.md`](../docs/on-chain/00-constitution.md) para os princípios de engenharia, [`../docs/sprints/00-visao-geral.md`](../docs/sprints/00-visao-geral.md) para o roadmap de execução, [`../docs/PROGRESS.md`](../docs/PROGRESS.md) para o log do que já foi implementado e testado, e [`../docs/PENDENCIAS.md`](../docs/PENDENCIAS.md) para os bloqueios e itens em aberto.

## Stack

- **Foundry** (`forge`, `cast`, `anvil`) — ver [ADR-0003](../docs/on-chain/decisions/ADR-0003-toolchain-foundry.md)
- **OpenZeppelin Contracts** v5 (`AccessControl`, `Pausable`, `ReentrancyGuard`)
- **Polygon PoS** (testnet Amoy) — ver [ADR-0002](../docs/on-chain/decisions/ADR-0002-rede-polygon.md)
- **ERC-3643 (T-REX)** como padrão do `PropertyToken` — ver [ADR-0001](../docs/on-chain/decisions/ADR-0001-padrao-token-erc-3643.md)

## Setup

```shell
# instalar dependências (forge-std, openzeppelin-contracts)
forge install

# copiar variáveis de ambiente e preencher RPC/chave de deploy da testnet Amoy
cp .env.example .env
```

## Uso

```shell
# build
forge build

# rodar testes (unit + fuzz)
forge test -vvv

# cobertura de testes (critério de saída em ../docs/on-chain/security-checklist.md)
forge coverage

# formatar
forge fmt

# node local
anvil
```

## Deploy (testnet Polygon Amoy)

```shell
forge script script/<Script>.s.sol --rpc-url amoy --private-key $PRIVATE_KEY --broadcast --verify
```

Requer MATIC de teste na conta de deploy (faucet Amoy) e `POLYGON_AMOY_RPC_URL` / `PRIVATE_KEY` configurados em `.env`.

## Estrutura

- `src/` — contratos
- `test/` — testes Foundry (unit, fuzz, integração, fork)
- `script/` — scripts de deploy
- [`../docs/on-chain/`](../docs/on-chain/00-constitution.md) — specs técnicas, ADRs e checklist de segurança (fonte da verdade), no repositório irmão `docs/`
- [`../docs/sprints/`](../docs/sprints/00-visao-geral.md) — planejamento de execução
