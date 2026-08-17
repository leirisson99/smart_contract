---
status: draft
owner: tech-lead
last_updated: 2026-08-17
---

# Riscos — Feature 004

| ID | Risco | Impacto | Probabilidade | Mitigação | Item de checklist |
|---|---|---|---|---|---|
| RISK-13 | Front-running/MEV em compras concorrentes | Médio | Baixa (preço fixo reduz incentivo) | SEC-04; comportamento determinístico especificado em teste de concorrência | SEC-04 |
| RISK-14 | Reentrancy em `comprar`/`cancelar` | Alto | Baixa (mitigado por design) | CEI + `ReentrancyGuard` | SEC-01 |
| RISK-15 | Baixa liquidez real (poucos compradores/vendedores na POC) | Médio — não é risco técnico, mas de produto | Alta (esperado com 20 investidores) | Documentado como limitação conhecida da POC; métrica a validar na Fase 4 | — |
| RISK-16 | Bypass de compliance via chamada direta ao `PropertyToken` ignorando o Marketplace | Alto | Baixa (mitigado por design) | `ComplianceModule.canTransfer` é verificado pelo próprio `PropertyToken` em toda transferência, não apenas as originadas do Marketplace | SEC-08 |
