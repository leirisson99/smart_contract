---
status: approved
last_updated: 2026-08-17
---

# ADR-0002: Rede — Polygon PoS

## Status
approved

## Contexto
O pitch (slide 7) já indica Polygon como rede de deploy. É preciso confirmar tecnicamente essa escolha frente às alternativas, considerando custo de gas (relevante para distribuição mensal de rendimentos a até 20 investidores no POC, e potencialmente milhares depois) e maturidade do ecossistema de RWA/security tokens.

## Decisão
Confirmar **Polygon PoS** como rede de deploy para a POC.

Motivos:
- Custo de gas ordens de magnitude menor que Ethereum mainnet — crítico para a operação recorrente de `claim` de dividendos mensais (feature 003), que se torna inviável economicamente em L1 para tickets de R$10.000/cota.
- Compatibilidade total com EVM/Solidity — nenhuma adaptação de linguagem ou tooling (Foundry funciona nativamente).
- Ecossistema já usado por projetos de tokenização de RWA reais, com liquidez de stablecoins e pontes estabelecidas.
- Existência de testnet (Amoy) estável para ambiente de homologação antes de mainnet.

## Alternativas consideradas
| Alternativa | Prós | Contras | Motivo da rejeição |
|---|---|---|---|
| Ethereum mainnet | Máxima segurança/descentralização, maior reputação | Custo de gas inviabiliza operações recorrentes de baixo valor por transação | Custo incompatível com o ticket médio da POC |
| Polygon zkEVM | Segurança herdada de Ethereum via prova de validade | Ecossistema de RWA/stablecoins ainda menos maduro que Polygon PoS | Maturidade insuficiente para a janela de 16 semanas da POC |
| Polygon PoS (escolhido) | Custo baixo, EVM-compatível, ecossistema RWA maduro | Segurança depende de um conjunto de validadores próprio (não herda diretamente de Ethereum) | — |

## Consequências
- Positivas: viabiliza economicamente a distribuição mensal de rendimentos; time-to-market menor por reuso total de tooling EVM.
- Negativas / trade-offs aceitos: modelo de segurança da Polygon PoS é aceito como adequado para o valor em risco da POC (1 imóvel, 20 investidores); reavaliar para operação em escala maior.
- Impacto em specs de feature relacionadas: todas as features on-chain (`001` a `004`); `test-strategy.md` de cada feature deve incluir fork test contra Polygon (testnet Amoy).
