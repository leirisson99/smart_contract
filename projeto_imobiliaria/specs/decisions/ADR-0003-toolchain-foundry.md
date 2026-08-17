---
status: approved
last_updated: 2026-08-17
---

# ADR-0003: Toolchain de desenvolvimento — Foundry

## Status
approved

## Contexto
O projeto adota TDD como prática central (`specs/00-constitution.md`): todo contrato precisa de um teste que falhe antes de ser implementado. É preciso escolher o toolchain de desenvolvimento Solidity que melhor suporta esse fluxo.

## Decisão
Adotar **Foundry** (`forge`, `cast`, `anvil`) como toolchain de referência para as futuras fases de implementação e teste.

Motivos:
- Testes escritos em Solidity (não JavaScript/TypeScript), eliminando contexto-switch entre linguagem do contrato e linguagem do teste — reduz fricção do ciclo red-green-refactor do TDD.
- **Fuzz testing** e **invariant testing (stateful fuzzing)** nativos, sem plugins adicionais — usados extensivamente na estratégia de testes de cada feature (ver `test-strategy.md`).
- `forge coverage` embutido, usado como critério de saída do `security-checklist.md`.
- Suporte nativo a fork tests (`--fork-url`) contra Polygon, necessário para validar integração com estado real antes de mainnet.
- Execução de testes significativamente mais rápida que toolchains baseados em Hardhat/JS, o que importa quando o ciclo TDD é executado centenas de vezes por feature.

## Alternativas consideradas
| Alternativa | Prós | Contras | Motivo da rejeição |
|---|---|---|---|
| Hardhat | Ecossistema JS/TS maduro, curva de aprendizado menor para devs de front-end, muitos plugins | Testes em JS/TS afastam da lógica Solidity; fuzzing/invariant testing exigem plugins de terceiros | Menor aderência ao fluxo TDD nativo que o projeto exige |
| Foundry (escolhido) | Testes em Solidity, fuzzing/invariant nativos, rápido, fork testing nativo | Comunidade de plugins menor que Hardhat para integrações de front-end | — |

## Consequências
- Positivas: ciclo TDD mais curto e natural; cobertura de segurança maior via fuzz/invariant testing desde o primeiro contrato.
- Negativas / trade-offs aceitos: scripts de deploy/integração com a plataforma (off-chain) podem ainda precisar de ferramentas JS/TS (ex.: ethers.js/viem) em `specs-backend/features/001-plataforma-investidor` — Foundry cobre o lado dos contratos, não substitui o backend da plataforma.
- Impacto em specs de feature relacionadas: todo `test-strategy.md` de feature on-chain (`001` a `004`) referencia comandos e convenções Foundry.
