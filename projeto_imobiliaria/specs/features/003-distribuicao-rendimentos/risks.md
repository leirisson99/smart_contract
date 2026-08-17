---
status: draft
owner: tech-lead
last_updated: 2026-08-17
---

# Riscos — Feature 003

| ID | Risco | Impacto | Probabilidade | Mitigação | Item de checklist |
|---|---|---|---|---|---|
| RISK-09 | Gestor lança valor de aluguel incorreto ou não deposita (centralização) | Alto — quebra a promessa de "rendimento automático" ao investidor | Média | Valor manual é risco aceito na POC; documentar processo operacional e auditoria periódica; SEC-06 | SEC-06 |
| RISK-10 | Reentrancy em `claim` | Alto — drenagem de fundos do contrato | Baixa (mitigado por design) | CEI + `ReentrancyGuard` | SEC-01 |
| RISK-11 | Dust acumulado nunca resgatado | Baixo — pequenas quantias presas no contrato | Alta (esperado) | Documentar regra de acúmulo para próximo ciclo; resgate manual pelo gestor acima de limite mínimo | — |
| RISK-12 | Investidor nunca reivindica (esquecimento) | Médio — percepção de "não recebi o rendimento" | Média | Plataforma (feature 005) executa `claim` automaticamente em nome do investidor via carteira custodial | — |
