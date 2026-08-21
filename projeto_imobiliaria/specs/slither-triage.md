---
status: approved
owner: tech-lead
last_updated: 2026-08-21
---

# Triagem Slither — Sprint 4

Resultado de `slither . --foundry-out-directory out --exclude-dependencies` (Slither 0.11.6, solc 0.8.28) sobre
os 6 contratos de `src/*.sol`, rodado como item do [`security-checklist.md`](security-checklist.md) antes da
auditoria externa. Referenciado por [`PROGRESS.md`](../PROGRESS.md).

## Resumo

- **Primeira rodada**: 22 findings (3 High, 5 Medium, 9 Low, 4 Informational, 1 Optimization).
- **Após correções**: 9 findings, todos triados abaixo como falso positivo ou risco aceito por design — nenhum
  em aberto.

## Corrigidos (13 findings)

| Severidade | Detector | Onde | Correção |
|---|---|---|---|
| High ×3 | `unchecked-transfer` | `Marketplace.listar/cancelar/comprar` | Retorno de `transfer`/`transferFrom` do `PropertyToken` agora é checado (`revert TransferenciaFalhou()` se `false`). O `PropertyToken` real nunca retorna `false` (todo caminho de falha reverte), mas o require é defesa em profundidade — testado com um dublê (`test/mocks/FalsyPropertyToken.sol`) que simula um retorno `false`. |
| Medium ×2 | `uninitialized-local` | `Marketplace.listagensAtivasPorToken` | Falso positivo (Solidity zero-inicializa locals), mas `contagem`/`indice` agora têm `= 0` explícito para eliminar o ruído do detector. |
| Low ×4 | `missing-zero-check` | `PropertyFactory.constructor`, `Marketplace.constructor`, `PropertyToken.inicializar` | Adicionado `revert EnderecoInvalido()` para todo endereço de configuração imutável (moeda, tesouraria, implementação, compliance/identity/admin). Esses valores são gravados uma única vez (constructor ou `inicializar` travado por `_inicializado`) — um endereço zero corromperia o contrato permanentemente. Testado (`test_constructor_revertSe*Zero`, `test_inicializar_revertSeEnderecoZero`). |
| Low ×2 | `reentrancy-benign` / `reentrancy-events` | `PropertyFactory.criarImovel` | Reordenado para CEI estrito: `_imoveis.push`/`emit ImovelCriado` agora acontecem antes de `grantRole`/`inicializar` no clone (ambos os valores necessários — `id` e o endereço do clone — já são conhecidos nesse ponto). |
| Optimization ×1 | `immutable-states` | `Marketplace.taxaTesouraria` | Marcado `immutable` (só é escrito no constructor). |

## Aceitos — falso positivo ou risco por design (9 findings restantes)

| Severidade | Detector | Onde | Justificativa |
|---|---|---|---|
| Medium ×3 | `unused-return` | `PropertyToken._writeCheckpoint`/`balanceOfAt` | Retornos ignorados são da lib `Checkpoints` da OpenZeppelin (`latestCheckpoint()` retorna `(bool, uint256, uint256)`, só os 2 primeiros interessam; `push()` retorna valores antigo/novo, não usados). Comportamento da lib auditada da OZ, não código próprio — ignorar é intencional. |
| Low ×1 | `calls-loop` | `DividendDistributor.valorReivindicavel` chamado em loop por `claimTodos` | O loop é sobre os **ciclos do próprio caller** (bounded por `_cicloAtual`, não por holders — RNF-06 já garante que não há loop sobre holders), e a chamada externa é uma `view` no `PropertyToken` do próprio imóvel (referência imutável, confiável, fixada no `constructor`), não um contrato arbitrário/controlado por terceiros. Sem risco de DoS ou reentrancy. |
| Low ×1 | `reentrancy-benign` | `DividendDistributor.depositarRendimento` | Estado (`_cicloAtual`, `_ciclos[idCiclo]`) só pode ser escrito **depois** de `token.snapshot()` porque depende do `snapshotId` retornado — não há como reordenar. O próprio Slither classifica como "benign" (sem exploit conhecido); `token` é uma referência imutável ao `PropertyToken` do imóvel, não um contrato arbitrário. Restrito a `GESTOR_ROLE` + `nonReentrant`. |
| Informational ×1 | `pragma` | Todo o projeto | Versões de pragma diferentes entre `src/*.sol` (`^0.8.20`) e dependências da OpenZeppelin (`^0.8.20`, `>=0.8.4`, `>=0.6.2`, `>=0.4.16`) — padrão em bibliotecas para maximizar compatibilidade; o compilador efetivo é fixado em `0.8.28` via `foundry.toml` (`solc = "0.8.28"`) para todo o projeto, então não há ambiguidade real de versão. |
| Informational ×1 | `solc-version` | Todo o projeto | Alerta genérico sobre bugs conhecidos do range `^0.8.20`. O projeto compila com `0.8.28` (fixado em `foundry.toml`), que não contém os bugs listados pelo detector (específicos de versões anteriores do range). |
| Informational ×1 | `costly-loop` | `IdentityRegistry.removerTrustedIssuer` | Loop sobre `_trustedIssuersList` para localizar e remover o issuer. Lista só cresce via `adicionarTrustedIssuer`, restrito a `PLATFORM_ADMIN_ROLE` — não é controlada por usuário nem tem tamanho não-limitado (número de provedores de KYC da plataforma, esperado pequeno, dígitos únicos). Custo de gas previsível e aceito. |
| Informational ×1 | `missing-inheritance` | `PropertyToken` | Decisão de design documentada (`PROGRESS.md`, 2026-08-20): ERC-20 mínimo escrito à mão em vez de herdar `IERC20`/`ERC20` da OZ, para suportar o padrão de clone (EIP-1167) sem depender de `openzeppelin-contracts-upgradeable`. `PropertyToken` implementa a interface funcionalmente (mesmas assinaturas), só não declara o `is IERC20` formal. |

## Como reproduzir

```
pip install slither-analyzer
slither . --foundry-out-directory out --exclude-dependencies --json slither-report.json
```

Repetir a cada mudança relevante em `src/*.sol` antes de reenviar para a auditoria externa.
