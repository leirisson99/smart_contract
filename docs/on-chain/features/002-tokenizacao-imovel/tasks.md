---
status: draft
owner: tech-lead
last_updated: 2026-08-20
---

# Tasks — Feature 002

1. [~] Decidir moeda de liquidação (stablecoin vs BRL) — bloqueante, ver `risks.md` RISK-08. Não bloqueou a implementação: `comprarCotas` desacoplado da moeda via endereço ERC-20 configurável. Decisão de negócio (qual moeda usar de fato) segue em aberto.
2. [x] Escrever testes de `PropertyToken` a partir de `contracts/property-token.md` (depende da feature 001 concluída).
3. [x] Implementar `PropertyToken` até os testes passarem.
4. [x] Escrever testes de `PropertyFactory` a partir de `contracts/property-factory.md`.
5. [x] Implementar `PropertyFactory` até os testes passarem.
6. [x] Testes de integração Factory + Token + Identity/Compliance.
7. [ ] Fork test em testnet Polygon (Amoy) com medição de custo de gas.
8. [~] Checklist de segurança: SEC-01, SEC-02, SEC-03, SEC-05, SEC-12 mitigados em `../../security-checklist.md`. SEC-02/03/05/12 mitigados; SEC-01 pendente (também cobre a feature 003, ainda não implementada).
