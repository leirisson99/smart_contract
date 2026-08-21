---
status: living-document
owner: tech-lead
last_updated: 2026-08-20
---

# Pendências do Projeto

> Lista viva de bloqueios e itens em aberto que travam (ou vão travar) o progresso técnico. Diferente do tracker de perguntas de negócio do pitch em [`specs/roadmap.md`](specs/roadmap.md#tracker-das-perguntas-em-aberto-pitch-slide-8) — aqui ficam pendências de execução (setup, segurança, sprints). Atualizar o status conforme cada item for resolvido; mover para "Resolvidas" com a data.

## Bloqueios ativos (impedem avançar hoje)

| Item | Bloqueia | O que falta | Dono |
|---|---|---|---|
| Conta de deploy + RPC da testnet Polygon Amoy | Fork test e deploy real das features `001` e `002` (Sprints 1 e 2) | Preencher `.env` com `POLYGON_AMOY_RPC_URL` real e financiar a conta via [faucet Amoy](https://faucet.polygon.technology/) | — |
| Contratação do provedor de KYC (Trusted Issuer) | Integração real de KYC; `SEC-11` completo; Fase 1 do roadmap | Decisão de negócio — enquanto isso, testes e deploy local usam um Trusted Issuer mock, o que **não** bloqueia o código | — |

## Pendências técnicas (não travam hoje, mas precisam fechar antes da auditoria)

- [ ] `SEC-01` ([security-checklist.md](specs/security-checklist.md)) — reentrancy em mint/transfer/claim: `PropertyToken` (feature `002`) já mitigado e testado (CEI + `ReentrancyGuard`); falta a parte da feature `003` (`DividendDistributor`, ainda não existe).
- [ ] `SEC-08` — nenhum caminho de transferência deve pular `canTransfer`: padrão validado nos testes de integração de `PropertyToken`/`PropertyFactory` (feature `002`); falta confirmar com o `Marketplace` real (feature `004`, ainda não existe).
- [ ] `SEC-11` — chave do Trusted Issuer comprometida: contenção on-chain já pronta e testada (`removerTrustedIssuer`); falta hardware wallet/multisig e processo de rotação do provedor real (depende da contratação acima).
- [ ] Decisão de negócio sobre a moeda de liquidação real (`RISK-08`, stablecoin vs. BRL) — `PropertyToken`/`PropertyFactory` já são desacoplados da moeda (endereço ERC-20 configurável), então isso não bloqueia mais o código, só a integração final com a moeda escolhida.
- [ ] Análise estática (Slither) e, opcionalmente, Mythril — exigido pelo `security-checklist.md` antes da auditoria externa; ainda não rodado em nenhum contrato.
- [ ] Auditoria externa — pré-requisito da Fase 4 do roadmap; ainda não contratada.

## Sprints/features ainda não iniciadas

- [ ] Sprint 3 — features `003-distribuicao-rendimentos` e `004-mercado-secundario`.
- [ ] Sprint 4 — consolidação de segurança e preparação para auditoria externa.

## Decisões de negócio em aberto

Não duplicadas aqui — tracker completo (imóvel piloto, SPE, orçamento, equipe, investidores mapeados etc.) em [`specs/roadmap.md`](specs/roadmap.md#tracker-das-perguntas-em-aberto-pitch-slide-8).

## Resolvidas

- **2026-08-20** — `SEC-10` (PII on-chain) mitigado: `IdentityRegistry` só grava claims/hash de assinatura, nunca CPF/documento.
- **2026-08-20** — `SEC-02`, `SEC-03`, `SEC-05`, `SEC-12` mitigados após `PropertyToken`/`PropertyFactory` (Sprint 2): access control testado em ambos os contratos, sem blocos `unchecked`, imutabilidade via clone EIP-1167 com inicialização travada, `criarImovel` restrito a `PLATFORM_ADMIN_ROLE`.
- **2026-08-20** — Bloqueio de decisão de negócio da moeda de liquidação (`RISK-08`) não travou mais a Sprint 2: `comprarCotas` implementado desacoplado da moeda via endereço ERC-20 configurável, conforme workaround previsto na própria sprint. A escolha real da moeda continua pendente (ver lista acima), só não bloqueia mais o código.
