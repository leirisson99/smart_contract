---
status: draft
owner: tech-lead
last_updated: 2026-08-17
---

# Tasks — Feature Backend 001

1. [ ] Definir e contratar provedor de custódia de carteiras (HSM ou equivalente).
2. [ ] Especificar modelo de dados de PII (LGPD) — retenção, controle de acesso, criptografia em repouso.
3. [ ] Implementar endpoints de integração conforme `integration.md` (depende de todas as features on-chain concluídas até a Fase 2 do roadmap).
4. [ ] Implementar job periódico de claim automático (RF-24).
5. [ ] Publicar contrato de API (endpoints, payloads, códigos de erro estruturados) para consumo por `specs-frontend/features/001-interface-investidor`.
6. [ ] Testes de integração e end-to-end em testnet Polygon.
7. [ ] Revisão de segurança da camada off-chain (controle de acesso dos endpoints administrativos, ausência de PII em payload on-chain).
