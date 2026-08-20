---
status: draft
owner: tech-lead
last_updated: 2026-08-20
---

# Tasks — Feature 001

Ordem sugerida de execução (TDD: teste antes de cada item de contrato):

1. [ ] Selecionar/contratar provedor de KYC (decisão de negócio, fora do pacote técnico).
2. [x] Escrever testes de `IdentityRegistry` (unit + fuzz) a partir de `contracts/identity-registry.md`.
3. [x] Implementar `IdentityRegistry` até os testes passarem.
4. [x] Escrever testes de `ComplianceModule` a partir de `contracts/compliance-module.md`.
5. [x] Implementar `ComplianceModule` até os testes passarem.
6. [x] Testes de integração `IdentityRegistry` + `ComplianceModule` + mock de token.
7. [ ] Fork test em testnet Polygon (Amoy).
8. [~] Checklist de segurança: SEC-02, SEC-08, SEC-10, SEC-11 marcados como mitigados em `specs/security-checklist.md`. Só SEC-10 mitigado nesta etapa — SEC-02/08/11 dependem de itens fora do escopo desta feature (contratos 002/004 e contratação do provedor de KYC).
9. [ ] Deploy em testnet e integração real com o provedor de KYC contratado (item 1).
