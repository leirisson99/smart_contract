# Tokenização Imobiliária — Smart Contracts

POC de tokenização de imóveis (ERC-3643) rodando em Polygon PoS, construída com Foundry seguindo Spec-Driven Development + TDD. Ver `specs/00-constitution.md` para os princípios de engenharia, `sprints/00-visao-geral.md` para o roadmap de execução, e [`PROGRESS.md`](PROGRESS.md) para o log do que já foi implementado e testado.

## Stack

- **Foundry** (`forge`, `cast`, `anvil`) — ver [ADR-0003](specs/decisions/ADR-0003-toolchain-foundry.md)
- **OpenZeppelin Contracts** v5 (`AccessControl`, `Pausable`, `ReentrancyGuard`)
- **Polygon PoS** (testnet Amoy) — ver [ADR-0002](specs/decisions/ADR-0002-rede-polygon.md)
- **ERC-3643 (T-REX)** como padrão do `PropertyToken` — ver [ADR-0001](specs/decisions/ADR-0001-padrao-token-erc-3643.md)

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

# cobertura de testes (critério de saída em specs/security-checklist.md)
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
- `specs/` — specs técnicas, ADRs e checklist de segurança (fonte da verdade — ver [`specs/00-constitution.md`](specs/00-constitution.md))
- `sprints/` — planejamento de execução
