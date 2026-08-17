---
status: draft
owner: tech-lead
last_updated: 2026-08-17
---

# Feature 002 — Tokenização do Imóvel

Origem: pitch slide 3 ("A Solução" — prédio de R$10M dividido em 1.000 cotas de R$10.000) e slide 4, passos 3-4 (escolha do imóvel, compra de cotas, token na carteira).

## Objetivo
Representar a propriedade fracionada de um imóvel como tokens (`PropertyToken`, padrão ERC-3643 — ADR-0001), emitidos na abertura da oferta e comprados por investidores verificados (feature 001).

## Personas
- **Investidor**: compra cotas na emissão primária.
- **Gestor da SPE**: define o imóvel, valor total, número de cotas, e aciona a emissão via `PropertyFactory`.

## Requisitos funcionais

| ID | Requisito |
|---|---|
| RF-06 | O sistema deve permitir ao gestor criar um novo imóvel tokenizado, definindo valor total e número de cotas (ex.: R$10M ÷ 1.000 = R$10.000/cota). |
| RF-07 | O sistema deve permitir que um investidor com KYC aprovado (feature 001) compre cotas na emissão primária, até o limite disponível. |
| RF-08 | O sistema deve creditar o token na carteira do investidor de forma instantânea após a compra confirmada, servindo como prova digital de propriedade. |
| RF-09 | O sistema deve impedir a compra de mais cotas do que as disponíveis (sem overselling). |
| RF-10 | O sistema deve impedir qualquer transferência (primária ou secundária) para carteira sem `isVerified == true` (dependência da feature 001). |

## Requisitos não funcionais
- **RNF-04**: `balanceOf(carteira)` do `PropertyToken` deve refletir de forma auditável e imediata (mesmo bloco da transação) a quantidade de cotas possuídas.
- **RNF-05**: custo de gas de emissão de um novo imóvel deve ser previsível e documentado (uso de minimal proxy — EIP-1167 — a avaliar em `contracts/property-factory.md`).

## Cenários de aceite

| Cenário | Dado | Quando | Então |
|---|---|---|---|
| Emissão de imóvel | Gestor define valor total R$10M e 1.000 cotas | `PropertyFactory.criarImovel` é chamado | Um novo `PropertyToken` é deployado com `totalSupply` de 1.000 e preço por cota de R$10.000 (em stablecoin/BRL-equivalente definido em `plan.md`) |
| Compra primária com KYC | Investidor tem `isVerified == true` e cotas disponíveis | Investidor compra 5 cotas | `balanceOf(investidor)` aumenta em 5; evento de compra emitido; token visível na carteira instantaneamente |
| Compra primária sem KYC | Investidor tem `isVerified == false` | Investidor tenta comprar cotas | Transação reverte com motivo de compliance (dependência: `ComplianceModule.canTransfer`) |
| Overselling bloqueado | Restam 2 cotas disponíveis | Investidor tenta comprar 5 cotas | Transação reverte — compra parcial não é permitida na POC (tudo ou nada) |
| Transferência secundária respeitando compliance | Duas carteiras verificadas | Transferência direta (fora do Marketplace) entre elas | Transferência é permitida, pois passa pela mesma checagem de compliance que a compra primária |

## Fora de escopo desta feature
- Precificação dinâmica ou variação de preço por cota (preço é fixo na emissão, definido pelo gestor).
- Múltiplos imóveis simultâneos ativos ao mesmo tempo na POC (suportado pela `PropertyFactory`, mas a operação piloto roda com 1).
