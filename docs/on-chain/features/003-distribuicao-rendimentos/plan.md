---
status: draft
owner: tech-lead
last_updated: 2026-08-17
---

# Plano Técnico — Feature 003

## Componentes
| Componente | Camada | Responsabilidade |
|---|---|---|
| Gestor da SPE | Off-chain | Recebe aluguel do inquilino (contrato jurídico off-chain), decide valor a depositar |
| `DividendDistributor` | On-chain | Recebe depósito, registra snapshot, processa claims (pull-payment, ADR-0004) |
| `PropertyToken` | On-chain (feature 002) | Fonte do saldo/snapshot de cada holder |
| Backend da plataforma | Off-chain (`../../../backend/features/003-portfolio-e-rendimentos`, repositório irmão `backend/`) | Notifica investidor e pode executar `claim` em seu nome |

## Fluxo ponta a ponta
1. Gestor recebe aluguel do inquilino (off-chain, contrato de locação da SPE).
2. Gestor deposita o valor no `DividendDistributor` para o imóvel correspondente → RF-11.
3. Contrato registra snapshot dos saldos de `PropertyToken` no momento do depósito → RF-12.
4. Investidor (ou a plataforma em seu nome) chama `claim()` → RF-13.
5. Plataforma notifica o investidor e reflete o saldo recebido no portfólio (`../../../backend/features/003-portfolio-e-rendimentos`).

## Dependências
- `002-tokenizacao-imovel` (saldo/snapshot de cotas).
- `001-identidade-kyc` (indiretamente — só holders verificados existem, mas o claim em si não exige nova checagem de compliance, pois é recebimento de valor, não transferência de cota).
- É consumida por `../../../backend/features/003-portfolio-e-rendimentos` (job de claim automático).
