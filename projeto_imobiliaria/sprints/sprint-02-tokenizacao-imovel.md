---
status: not-started
owner: tech-lead
last_updated: 2026-08-19
---

# Sprint 2 — Feature 002 (Tokenização do Imóvel)

## Objetivo
Entregar `PropertyToken` e `PropertyFactory` implementados via TDD, integrados ao `IdentityRegistry`/`ComplianceModule` da Sprint 1, testados e deployados em testnet.

## Backlog

Backlog completo em [`specs/features/002-tokenizacao-imovel/tasks.md`](../specs/features/002-tokenizacao-imovel/tasks.md):

- [ ] **Bloqueante — decidir antes de codar:** moeda de liquidação (stablecoin vs. BRL), ver [`risks.md`](../specs/features/002-tokenizacao-imovel/risks.md) `RISK-08` e [`plan.md`](../specs/features/002-tokenizacao-imovel/plan.md). Sem essa decisão, `comprarCotas` não pode ser implementado de forma definitiva.
- [ ] Escrever testes de `PropertyToken` a partir de [`contracts/property-token.md`](../specs/features/002-tokenizacao-imovel/contracts/property-token.md).
- [ ] Implementar `PropertyToken` até os testes passarem.
- [ ] Escrever testes de `PropertyFactory` a partir de [`contracts/property-factory.md`](../specs/features/002-tokenizacao-imovel/contracts/property-factory.md).
- [ ] Implementar `PropertyFactory` até os testes passarem.
- [ ] Testes de integração Factory + Token + Identity/Compliance (Sprint 1).
- [ ] Fork test em testnet Polygon (Amoy) com medição de custo de gas (relevante para RNF-05 — custo de emissão previsível).
- [ ] Checklist de segurança: `SEC-01`, `SEC-02`, `SEC-03`, `SEC-05`, `SEC-12` mitigados em [`specs/security-checklist.md`](../specs/security-checklist.md).

## Dependências / bloqueios
- Depende da Sprint 1 concluída (`IdentityRegistry`/`ComplianceModule`).
- **Bloqueio de decisão de negócio**: moeda de liquidação — se não for decidida a tempo, considere implementar `comprarCotas` de forma desacoplada da moeda (interface que aceita um endereço de token de pagamento configurável) para não travar a sprint enquanto a decisão de negócio não chega.

## Marco de saída
`PropertyToken` e `PropertyFactory` testados e deployados em testnet; um imóvel de teste pode ser criado e cotas compradas por uma carteira verificada, respeitando compliance. Habilita o início da Sprint 3.
