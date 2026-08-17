---
status: draft
owner: tech-lead
last_updated: 2026-08-17
---

# Riscos — Feature 002

| ID | Risco | Impacto | Probabilidade | Mitigação | Item de checklist |
|---|---|---|---|---|---|
| RISK-05 | Reentrancy em `comprarCotas`/`transfer` | Alto — duplicação de cotas ou saldo inconsistente | Baixa (mitigado por design) | CEI + `ReentrancyGuard` | SEC-01 |
| RISK-06 | Criação fraudulenta de imóvel falso via Factory | Alto — dano reputacional e financeiro direto | Baixa | `PLATFORM_ADMIN_ROLE` restrito, idealmente multisig | SEC-12 |
| RISK-07 | Bug pós-deploy em `PropertyToken` de um imóvel já com investidores | Alto — impossível corrigir sem migração (ADR-0005) | Baixa (mitigado por auditoria) | Auditoria completa antes de mainnet; contratos isolados por imóvel limitam blast radius | SEC-05 |
| RISK-08 | Indefinição da moeda de liquidação (stablecoin vs BRL) atrasa implementação | Médio — bloqueia início da Fase 2 | Média | Rastreado em `specs/roadmap.md` como pergunta em aberto; decisão necessária antes da semana 3 | — |
