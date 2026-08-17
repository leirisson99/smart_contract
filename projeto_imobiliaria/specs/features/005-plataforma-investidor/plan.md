---
status: draft
owner: tech-lead
last_updated: 2026-08-17
---

# Plano Técnico — Feature 005

## Componentes
| Componente | Camada | Responsabilidade |
|---|---|---|
| Frontend (web) | Off-chain | Cadastro, tela do imóvel, portfólio, painel do gestor |
| Backend | Off-chain | Orquestra KYC, custódia de carteiras, assinatura de transações on-chain em nome do investidor, jobs de claim automático |
| Banco de dados | Off-chain | PII (CPF, documentos), sujeito a LGPD — nunca replicado on-chain |
| Serviço de custódia de chaves | Off-chain | Gera e protege as chaves privadas das carteiras custodiais dos investidores |

## Toolchain (fora do escopo de Foundry — ADR-0003 cobre só os contratos)
Integração com os contratos via biblioteca de cliente EVM (ex.: viem/ethers.js) no backend, não faz parte do toolchain de teste dos contratos em si.

## Fluxo ponta a ponta
Ver tabela de cenários em `spec.md` — cobre RF-21 a RF-26, cada um acionando a feature on-chain correspondente (`001`, `002`, `003`).

## Dependências
- Depende de todas as features on-chain (`001` a `004`) como backend de dados/execução.
- É a única feature sem contrato próprio — atua como camada de integração.
