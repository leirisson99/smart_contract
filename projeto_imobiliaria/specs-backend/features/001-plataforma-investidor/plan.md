---
status: draft
owner: tech-lead
last_updated: 2026-08-17
---

# Plano Técnico — Feature Backend 001

## Componentes
| Componente | Camada | Responsabilidade |
|---|---|---|
| API do backend | Off-chain | Expõe os endpoints consumidos por `specs-frontend/features/001-interface-investidor` |
| Orquestrador de KYC | Off-chain | Recebe cadastro, envia documentos ao provedor, recebe resultado |
| Serviço de custódia de chaves | Off-chain | Gera e protege as chaves privadas das carteiras custodiais dos investidores |
| Assinador de transações | Off-chain | Assina e envia transações on-chain em nome do investidor/gestor |
| Job de claim automático | Off-chain | Roda periodicamente, identifica rendimentos pendentes e executa `claim` |
| Banco de dados | Off-chain | PII (CPF, documentos), sujeito a LGPD — nunca replicado on-chain |

## Toolchain (fora do escopo de Foundry — ADR-0003 cobre só os contratos)
Integração com os contratos via biblioteca de cliente EVM (ex.: viem/ethers.js) no backend, não faz parte do toolchain de teste dos contratos em si.

## Fluxo ponta a ponta
Ver tabela de cenários em `spec.md` — cobre RF-21 a RF-26. Cada endpoint é consumido por uma tela específica de `specs-frontend/features/001-interface-investidor`, mapeada em `integration.md` de ambas as features.

## Dependências
- Depende de todas as features on-chain de `specs/features/` (`001` a `004`) para execução das transações.
- Não tem contrato próprio — atua como camada de integração sobre os contratos de `specs/`.
- É consumida por `specs-frontend/features/001-interface-investidor` — nenhum outro consumidor deve acionar estes endpoints diretamente sem passar pelas mesmas revalidações (RNF-16).
