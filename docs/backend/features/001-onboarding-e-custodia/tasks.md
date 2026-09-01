---
status: draft
owner: tech-lead
last_updated: 2026-09-01
---

# Tasks — Feature Backend 001

1. [ ] Definir e contratar provedor de custódia de carteiras (HSM ou equivalente).
2. [ ] Especificar modelo de dados de PII (LGPD) — retenção, controle de acesso, criptografia em repouso.
3. [ ] Implementar endpoint de cadastro + criação automática da carteira custodial (RF-21).
4. [ ] Implementar orquestração de KYC: envio de documentos ao provedor e processamento do webhook de resultado (RF-33).
5. [ ] Publicar contrato de API (endpoints, payloads, códigos de erro estruturados) para consumo por [002](../002-investimento-primario/tasks.md), [003](../003-portfolio-e-rendimentos/tasks.md), [004](../004-mercado-secundario/tasks.md), [005](../005-painel-administrativo/tasks.md) e `../../../frontend/features/001-interface-investidor`.
6. [ ] Testes de integração e end-to-end (cadastro → KYC aprovado/reprovado).
7. [ ] Revisão de segurança da camada off-chain (ausência de PII em payload on-chain, controle de acesso ao banco de dados).
