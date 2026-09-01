---
status: reviewed
owner: tech-lead
last_updated: 2026-08-21
---

# Riscos — Feature 002

| ID | Risco | Impacto | Probabilidade | Mitigação | Item de checklist |
|---|---|---|---|---|---|
| RISK-05 | Reentrancy em `comprarCotas`/`transfer` | Alto — duplicação de cotas ou saldo inconsistente | Baixa (mitigado por design) | CEI + `ReentrancyGuard` | SEC-01 |
| RISK-06 | Criação fraudulenta de imóvel falso via Factory | Alto — dano reputacional e financeiro direto | Baixa | `PLATFORM_ADMIN_ROLE` restrito, idealmente multisig | SEC-12 |
| RISK-07 | Bug pós-deploy em `PropertyToken` de um imóvel já com investidores | Alto — impossível corrigir sem migração (ADR-0005) | Baixa (mitigado por auditoria) | Auditoria completa antes de mainnet; contratos isolados por imóvel limitam blast radius | SEC-05 |
| RISK-08 | Indefinição da moeda de liquidação (stablecoin vs BRL) atrasa implementação | Médio — bloqueia início da Fase 2 | Média | Rastreado em `../../roadmap.md` como pergunta em aberto; decisão necessária antes da semana 3 | — |

## Revisão Sprint 4 (2026-08-21)

`RISK-05`/`SEC-01` e `RISK-06`/`SEC-12` mitigados e testados (`test/PropertyToken.t.sol`,
`test/PropertyFactory.t.sol`). `RISK-07`/`SEC-05` mitigado por design (clone imutável por imóvel,
ADR-0005) — a auditoria externa em si (Fase 2 do roadmap) é a mitigação final, ainda não contratada
(`PENDENCIAS.md`). `RISK-08` não bloqueia mais o código (`moedaPagamento` desacoplado via endereço ERC-20
configurável) — só a decisão de negócio sobre a moeda real, rastreada em `PENDENCIAS.md`.
