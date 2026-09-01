---
status: approved
last_updated: 2026-08-17
---

# ADR-0005: Estratégia de upgradability — contratos imutáveis por imóvel

## Status
approved

## Contexto
Contratos upgradeable (proxy patterns como UUPS ou Transparent Proxy) permitem corrigir bugs pós-deploy, mas introduzem superfície de ataque adicional (storage collision, quem controla a chave de upgrade, risco de centralização) e complexidade extra de auditoria. É preciso decidir a estratégia para os contratos de cada imóvel tokenizado.

## Decisão
Para a POC, os contratos `PropertyToken`, `DividendDistributor` e `Marketplace` de cada imóvel são **imutáveis** (sem proxy). A `PropertyFactory` (feature 002) é o único ponto de "evolução": uma nova versão de imóvel tokenizado usa uma nova versão dos contratos, deployada pela Factory, sem afetar imóveis já existentes.

O `IdentityRegistry` e o `ComplianceModule` (feature 001), por serem compartilhados entre todos os imóveis da plataforma, podem justificar upgradability no futuro (fora do escopo da POC) — mas na POC também nascem imutáveis, dado o volume baixo (1 imóvel, 20 investidores) e o prazo curto até a próxima auditoria.

## Alternativas consideradas
| Alternativa | Prós | Contras | Motivo da rejeição |
|---|---|---|---|
| Proxy upgradeable (UUPS/Transparent) | Permite corrigir bugs sem redeploy; menos fricção para investidores em caso de bug | Superfície de ataque adicional (storage collision, controle de upgrade centralizado), exige timelock/multisig bem desenhado, mais complexo de auditar | Complexidade desnecessária para o volume e prazo da POC |
| Imutável por imóvel via Factory (escolhido) | Superfície de ataque menor, auditoria mais simples, cada imóvel é isolado (bug em um não afeta outros) | Bug encontrado pós-deploy exige nova versão via Factory e migração manual dos holders | Aceitável na POC (1 imóvel); mitigado por auditoria completa antes do deploy |

## Consequências
- Positivas: menor superfície de ataque, auditoria mais simples e rápida, isolamento de risco entre imóveis diferentes.
- Negativas / trade-offs aceitos: qualquer bug crítico pós-deploy exige nova versão de contrato e processo manual de migração — deve ser coberto pelo `risks.md` da feature 002.
- Impacto em specs de feature relacionadas: `002-tokenizacao-imovel` (`property-factory.md` deve documentar o versionamento de templates de contrato).
