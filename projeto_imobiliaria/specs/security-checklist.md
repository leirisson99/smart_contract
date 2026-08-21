---
status: draft
owner: tech-lead
last_updated: 2026-08-20
---

# Checklist de Segurança Pré-Auditoria

Consolida os itens `SEC-XX` levantados nos `risks.md` de cada feature. Critério de saída da Fase 2 (`specs/roadmap.md`): **100% dos itens marcados antes de contratar a auditoria externa**; auditoria só é considerada concluída sem findings críticos em aberto.

| ID | Item | Feature(s) | Mitigação especificada | Status |
|---|---|---|---|---|
| SEC-01 | Reentrancy em mint/transfer/claim | 002, 003 | Padrão Checks-Effects-Interactions (CEI) + `ReentrancyGuard` (OpenZeppelin) em todas as funções que movem valor ou fazem chamada externa | pendente |
| SEC-02 | Access control indevido (mint, freeze, pause, forced transfer) | 001, 002 | Roles do OpenZeppelin `AccessControl` (`MINTER_ROLE`, `COMPLIANCE_ADMIN_ROLE`, `PLATFORM_ADMIN_ROLE`), preferencialmente atrás de multisig | mitigado |
| SEC-03 | Integer overflow/underflow | todas | Solidity ≥0.8 (checagem nativa); revisar todo bloco `unchecked` explicitamente | mitigado |
| SEC-04 | Front-running / MEV no mercado secundário | 004 | POC usa preço fixo (sem leilão/order book), reduzindo superfície de MEV; limitação documentada como melhoria futura | pendente |
| SEC-05 | Riscos de upgradability (storage collision, controle de upgrade) | 002 | Contratos imutáveis por imóvel via Factory (ADR-0005); sem proxy na POC | mitigado |
| SEC-06 | Manipulação/centralização de oráculo de valor de aluguel | 003 | Não há oráculo automatizado na POC; valor lançado manualmente pelo gestor da SPE — risco de centralização aceito e documentado em `003-distribuicao-rendimentos/risks.md` | pendente |
| SEC-07 | Negação de serviço (DoS) na distribuição de rendimentos | 003 | Modelo pull-payment com claim individual (ADR-0004), não push em loop | pendente |
| SEC-08 | Bypass de compliance em transferências (inclusive no marketplace) | 001, 004 | Toda transferência, incluindo as do `Marketplace`, passa obrigatoriamente por `ComplianceModule.canTransfer` | pendente |
| SEC-09 | Auditabilidade insuficiente | todas | Evento emitido para toda mudança de estado relevante (mint, transfer, claim, listagem, compra, mudança de compliance) | pendente |
| SEC-10 | Exposição de dados pessoais (PII) on-chain | 001 | Apenas claims booleanas/categorizadas on-chain, nunca CPF/documento (ADR-0006) | mitigado |
| SEC-11 | Chave do Trusted Issuer (provedor de KYC) comprometida | 001 | Chave em hardware wallet/multisig; processo de rotação documentado | pendente |
| SEC-12 | Access control de criação de novos imóveis (Factory) | 002 | `PLATFORM_ADMIN_ROLE` restrito, idealmente multisig, para `PropertyFactory.criarImovel` | mitigado |

**Ferramentas obrigatórias antes da auditoria externa:**
- `forge coverage` — cobertura de testes por contrato (meta: funções críticas de transferência/claim/compliance em 100%)
- Análise estática (Slither) em todos os contratos
- Análise dinâmica opcional (Mythril) para contratos com maior superfície de risco (`PropertyToken`, `DividendDistributor`)

Atualizar a coluna `Status` para `mitigado` conforme os testes correspondentes (ver `test-strategy.md` de cada feature) forem implementados e passarem.
