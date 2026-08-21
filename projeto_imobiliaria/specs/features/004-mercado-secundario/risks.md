---
status: reviewed
owner: tech-lead
last_updated: 2026-08-21
---

# Riscos — Feature 004

| ID | Risco | Impacto | Probabilidade | Mitigação | Item de checklist |
|---|---|---|---|---|---|
| RISK-13 | Front-running/MEV em compras concorrentes | Médio | Baixa (preço fixo reduz incentivo) | SEC-04; comportamento determinístico especificado em teste de concorrência | SEC-04 |
| RISK-14 | Reentrancy em `comprar`/`cancelar` | Alto | Baixa (mitigado por design) | CEI + `ReentrancyGuard` | SEC-01 |
| RISK-15 | Baixa liquidez real (poucos compradores/vendedores na POC) | Médio — não é risco técnico, mas de produto | Alta (esperado com 20 investidores) | Documentado como limitação conhecida da POC; métrica a validar na Fase 4 | — |
| RISK-16 | Bypass de compliance via chamada direta ao `PropertyToken` ignorando o Marketplace | Alto | Baixa (mitigado por design) | `ComplianceModule.canTransfer` é verificado pelo próprio `PropertyToken` em toda transferência, não apenas as originadas do Marketplace | SEC-08 |

## Revisão Sprint 4 (2026-08-21)

`RISK-13`/`SEC-04`, `RISK-14`/`SEC-01` e `RISK-16`/`SEC-08` mitigados e testados
(`test/Marketplace.t.sol`, incluindo o cenário de duas compras sequenciais na mesma listagem). Slither
também confirmou, via `unchecked-transfer`, um ponto de hardening adicional em `listar`/`cancelar`/`comprar`
(retorno de `transfer`/`transferFrom` agora é checado — ver `specs/slither-triage.md`). `RISK-15` é risco de
produto sem item de checklist técnico — aceito como está, a validar na Fase 4.
