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
| Conta de deploy + RPC da testnet Polygon Amoy | Fork test e deploy real da feature `001-identidade-kyc` (Sprint 1) | Preencher `.env` com `POLYGON_AMOY_RPC_URL` real e financiar a conta via [faucet Amoy](https://faucet.polygon.technology/) | — |
| Contratação do provedor de KYC (Trusted Issuer) | Integração real de KYC; `SEC-11` completo; Fase 1 do roadmap | Decisão de negócio — enquanto isso, testes e deploy local usam um Trusted Issuer mock, o que **não** bloqueia o código | — |

## Pendências técnicas (não travam hoje, mas precisam fechar antes da auditoria)

- [ ] `SEC-02` ([security-checklist.md](specs/security-checklist.md)) — controle de acesso a mint/freeze/pause/forced transfer: parte da feature `001` já mitigada (`AccessControl`); falta a parte da feature `002` (`PropertyToken` ainda não existe).
- [ ] `SEC-08` — nenhum caminho de transferência deve pular `canTransfer`: padrão validado com mock nos testes de integração; falta confirmar com o `PropertyToken`/`Marketplace` reais (features `002`, `004`).
- [ ] `SEC-11` — chave do Trusted Issuer comprometida: contenção on-chain já pronta e testada (`removerTrustedIssuer`); falta hardware wallet/multisig e processo de rotação do provedor real (depende da contratação acima).
- [ ] Análise estática (Slither) e, opcionalmente, Mythril — exigido pelo `security-checklist.md` antes da auditoria externa; ainda não rodado em nenhum contrato.
- [ ] Auditoria externa — pré-requisito da Fase 4 do roadmap; ainda não contratada.

## Sprints/features ainda não iniciadas

- [ ] Sprint 2 — feature `002-tokenizacao-imovel` (`PropertyToken`, `PropertyFactory`).
- [ ] Sprint 3 — features `003-distribuicao-rendimentos` e `004-mercado-secundario`.
- [ ] Sprint 4 — consolidação de segurança e preparação para auditoria externa.

## Decisões de negócio em aberto

Não duplicadas aqui — tracker completo (imóvel piloto, SPE, orçamento, equipe, investidores mapeados etc.) em [`specs/roadmap.md`](specs/roadmap.md#tracker-das-perguntas-em-aberto-pitch-slide-8).

## Resolvidas

_(nenhuma ainda — itens migram para cá, com data, conforme forem fechados)_
