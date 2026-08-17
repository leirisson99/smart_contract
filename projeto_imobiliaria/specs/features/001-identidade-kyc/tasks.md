---
status: draft
owner: tech-lead
last_updated: 2026-08-17
---

# Tasks — Feature 001

Ordem sugerida de execução (TDD: teste antes de cada item de contrato):

1. [ ] Selecionar/contratar provedor de KYC (decisão de negócio, fora do pacote técnico).
2. [ ] Escrever testes de `IdentityRegistry` (unit + fuzz) a partir de `contracts/identity-registry.md`.
3. [ ] Implementar `IdentityRegistry` até os testes passarem.
4. [ ] Escrever testes de `ComplianceModule` a partir de `contracts/compliance-module.md`.
5. [ ] Implementar `ComplianceModule` até os testes passarem.
6. [ ] Testes de integração `IdentityRegistry` + `ComplianceModule` + mock de token.
7. [ ] Fork test em testnet Polygon (Amoy).
8. [ ] Checklist de segurança: SEC-02, SEC-08, SEC-10, SEC-11 marcados como mitigados em `specs/security-checklist.md`.
9. [ ] Deploy em testnet e integração real com o provedor de KYC contratado (item 1).
