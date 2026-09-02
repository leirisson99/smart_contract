---
status: approved
owner: tech-lead
last_updated: 2026-08-22
---

# Checklist de Segurança Pré-Auditoria

Consolida os itens `SEC-XX` levantados nos `risks.md` de cada feature. Critério de saída da Fase 2 (`roadmap.md`): **100% dos itens marcados antes de contratar a auditoria externa**; auditoria só é considerada concluída sem findings críticos em aberto.

| ID | Item | Feature(s) | Mitigação especificada | Status |
|---|---|---|---|---|
| SEC-01 | Reentrancy em mint/transfer/claim | 002, 003, 004 | Padrão Checks-Effects-Interactions (CEI) + `ReentrancyGuard` (OpenZeppelin) em todas as funções que movem valor ou fazem chamada externa | mitigado |
| SEC-02 | Access control indevido (mint, freeze, pause, forced transfer) | 001, 002 | Roles do OpenZeppelin `AccessControl` (`MINTER_ROLE`, `COMPLIANCE_ADMIN_ROLE`, `PLATFORM_ADMIN_ROLE`), preferencialmente atrás de multisig | mitigado |
| SEC-03 | Integer overflow/underflow | todas | Solidity ≥0.8 (checagem nativa); revisar todo bloco `unchecked` explicitamente | mitigado |
| SEC-04 | Front-running / MEV no mercado secundário | 004 | POC usa preço fixo (sem leilão/order book), reduzindo superfície de MEV; limitação documentada como melhoria futura | mitigado |
| SEC-05 | Riscos de upgradability (storage collision, controle de upgrade) | 002 | Contratos imutáveis por imóvel via Factory (ADR-0005): `PropertyToken` é deployado como clone mínimo EIP-1167 pela `PropertyFactory`, mas a implementação é fixa para sempre (sem função de upgrade) — não há proxy *upgradeable* (UUPS/Transparent) na POC | mitigado |
| SEC-06 | Manipulação/centralização de oráculo de valor de aluguel | 003 | Não há oráculo automatizado na POC; valor lançado manualmente pelo gestor da SPE — risco de centralização aceito e documentado em `003-distribuicao-rendimentos/risks.md` | mitigado |
| SEC-07 | Negação de serviço (DoS) na distribuição de rendimentos | 003 | Modelo pull-payment com claim individual (ADR-0004), não push em loop | mitigado |
| SEC-08 | Bypass de compliance em transferências (inclusive no marketplace) | 001, 004 | Toda transferência, incluindo as do `Marketplace`, passa obrigatoriamente por `ComplianceModule.canTransfer` | mitigado |
| SEC-09 | Auditabilidade insuficiente | todas | Evento emitido para toda mudança de estado relevante (mint, transfer, claim, listagem, compra, mudança de compliance) | mitigado |
| SEC-10 | Exposição de dados pessoais (PII) on-chain | 001 | Apenas claims booleanas/categorizadas on-chain, nunca CPF/documento (ADR-0006) | mitigado |
| SEC-11 | Chave do Trusted Issuer comprometida — hoje operada pelo backend da plataforma, não por um provedor de KYC (ver [ADR-0006](decisions/ADR-0006-fronteira-onchain-offchain-kyc.md), seção "Atualização") | 001 | Chave em hardware wallet/multisig; processo de rotação documentado | parcialmente mitigado |
| SEC-12 | Access control de criação de novos imóveis (Factory) | 002 | `PLATFORM_ADMIN_ROLE` restrito, idealmente multisig, para `PropertyFactory.criarImovel` | mitigado |

**Ferramentas obrigatórias antes da auditoria externa:**
- `forge coverage` — cobertura de testes por contrato (meta: funções críticas de transferência/claim/compliance em 100%). **Feito**: 100% de linhas/branches/funções em todos os 6 contratos (`IdentityRegistry`, `ComplianceModule`, `PropertyToken`, `PropertyFactory`, `DividendDistributor`, `Marketplace`).
- Análise estática (Slither) em todos os contratos — **feito** (Sprint 4, 2026-08-21). 22 findings iniciais (3 High, 5 Medium, 9 Low, 4 Informational, 1 Optimization); 13 corrigidos no código, 9 restantes triados como falso positivo ou risco aceito por design. Detalhe completo em [`slither-triage.md`](slither-triage.md).
- Análise dinâmica (Mythril) em todos os contratos — **feito** (Sprint 4, 2026-08-22): rodado via `mythril/myth` (Docker) sobre os 6 contratos, **0 findings em todos**. Detalhe em [`mythril-triage.md`](mythril-triage.md).

Atualizar a coluna `Status` para `mitigado` conforme os testes correspondentes (ver `test-strategy.md` de cada feature) forem implementados e passarem.

**Estado em 2026-08-21 (Sprint 4)**: 11/12 itens `mitigado`, `SEC-11` `parcialmente mitigado`. A contenção
on-chain de `SEC-11` (`removerTrustedIssuer`/`adicionarTrustedIssuer`, múltiplos issuers simultâneos) já
estava pronta e testada; agora o processo de rotação também está documentado
([`runbooks/rotacao-trusted-issuer.md`](runbooks/rotacao-trusted-issuer.md)). O que falta para
`mitigado` completo é só a parte de custódia real (chave do provedor de KYC contratado em hardware
wallet/multisig) — depende da contratação do provedor, decisão de negócio rastreada em
[`PENDENCIAS.md`](../PENDENCIAS.md), não um item de código em aberto. Com Slither e Mythril rodados e sem
findings em aberto em nenhum dos dois (ver [`mythril-triage.md`](mythril-triage.md)), a Sprint 4 está
tecnicamente fechada — o que resta (auditoria externa contratada, deploy em testnet Amoy, custódia real da
chave do Trusted Issuer) são todas ações de negócio, não itens de código.
