---
status: reviewed
owner: tech-lead
last_updated: 2026-08-21
---

# Riscos — Feature 001

| ID | Risco | Impacto | Probabilidade | Mitigação | Item de checklist |
|---|---|---|---|---|---|
| RISK-01 | Chave privada do Trusted Issuer comprometida | Alto — claims falsas emitidas, KYC forjado | Baixa | Hardware wallet/multisig do provedor; `removerTrustedIssuer` como contenção rápida | SEC-11 |
| RISK-02 | Exposição acidental de PII em log/evento on-chain | Alto — violação LGPD | Baixa (mitigado por design) | Eventos só carregam endereço + tópico de claim, nunca dado pessoal | SEC-10 |
| RISK-03 | Provedor de KYC descontinua serviço | Médio — bloqueia novos cadastros | Média | Contrato permite múltiplos Trusted Issuers simultâneos; troca de provedor sem redeploy | — |
| RISK-04 | `canTransfer` com custo de gas alto em cenário de muitos holders | Médio — transferências caras/travadas | Baixa na POC (20 investidores) | Evitar loops não limitados no `ComplianceModule`; reavaliar ao escalar | — |

## Revisão Sprint 4 (2026-08-21)

Todos os riscos desta feature têm mitigação aplicada e testada, ou risco formalmente aceito:
- `RISK-01`/`SEC-11`: contenção on-chain pronta; processo de rotação agora documentado em
  [`../../runbooks/rotacao-trusted-issuer.md`](../../runbooks/rotacao-trusted-issuer.md). Custódia real
  (hardware wallet/multisig do provedor) depende da contratação do provedor de KYC — ver `PENDENCIAS.md`.
- `RISK-02`/`SEC-10`: mitigado por design, testado (`test/IdentityRegistry.t.sol`).
- `RISK-03`/`RISK-04`: sem item de checklist associado — aceitos como características do design (múltiplos
  issuers sem redeploy; ausência de loop sobre holders no `ComplianceModule`), sem ação pendente.
