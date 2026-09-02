---
status: done
owner: tech-lead
last_updated: 2026-09-02
---

# Sprint 5 — Reconciliação e Aprovação das Especificações de Backend

## Objetivo
Fechar o gap entre o código real da feature backend `001-onboarding-e-custodia` (já implementado fora do fluxo SDD formal) e sua própria spec, formalizar a decisão arquitetural sobre a chave do Trusted Issuer, e levar as 5 specs de backend (`001` a `005`) de `draft` a `approved` — pré-requisito de SDD (`../on-chain/00-constitution.md`) para começar a codar `002-005`.

## Backlog
- [x] Reconciliar `../backend/features/001-onboarding-e-custodia/{spec,plan,tasks,implement}.md` com o código real de `backend/src/`: RF-33 passa a declarar que o backend (não o provedor) emite a claim on-chain; RNF-11 declara o estado atual (AES-256-GCM via `.env`) como aceito na POC; tasks 3/4/6 marcadas `[x]` (endpoints, orquestração de KYC, testes já implementados); tasks 1, 2, 5, 7 mantidas em aberto com escopo expandido.
- [x] Atualizar [`../on-chain/decisions/ADR-0006-fronteira-onchain-offchain-kyc.md`](../on-chain/decisions/ADR-0006-fronteira-onchain-offchain-kyc.md): nova seção "Atualização" formalizando o backend como Trusted Issuer na POC, o trade-off de risco aceito, e o plano de migração para HSM/KMS antes de captação de varejo.
- [x] Atualizar `SEC-11` em [`../on-chain/security-checklist.md`](../on-chain/security-checklist.md) para refletir que a chave é operada pelo backend, não por um provedor de KYC.
- [x] Revisar `002-investimento-primario/spec.md`, `003-portfolio-e-rendimentos/spec.md`, `004-mercado-secundario/spec.md`, `005-painel-administrativo/spec.md`: adicionar cenários Dado/Quando/Então faltantes (revalidação RNF-16 revogada on-chain, falha parcial do job de claim, rejeição por KYC ausente, rejeição por role inválida), nomear os códigos de erro esperados, explicitar que `005` depende só dos contratos on-chain de `002`/`003` (não do backend `002`/`003`).
- [x] Publicar [`../backend/api-contract.md`](../backend/api-contract.md): endpoints, payloads e o vocabulário de 8 códigos de erro (`SEM_KYC`, `KYC_REPROVADO`, `COTAS_INSUFICIENTES`, `VALOR_MINIMO_NAO_ATINGIDO`, `LISTAGEM_JA_VENDIDA`, `LISTAGEM_NAO_ENCONTRADA`, `SALDO_INSUFICIENTE`, `ERRO_DESCONHECIDO`) já consumido por `frontend/lib/errors.ts`, por endpoint de cada feature.
- [x] Marcar as 5 specs (`001-005`) como `status: approved`, com `owner: tech-lead` acumulando os papéis de Product/Founder e Compliance/Jurídico nesta fase da POC (decisão confirmada com o usuário em 2026-09-02).

## Dependências / bloqueios
Nenhuma técnica — o código de `001` já existe e está testado. Dependeu apenas de uma decisão humana (quem assina o sign-off de Compliance/Jurídico da spec `001`), resolvida com o usuário.

## Marco de saída
5 specs de backend em `status: approved`; ADR-0006 e `security-checklist.md` atualizados; `../backend/api-contract.md` publicado. Destrava as sprints seguintes ([06](06-investimento-e-portfolio.md), [07](07-mercado-secundario.md), [08](08-painel-administrativo-e-seguranca-backend.md)), que implementam o código de `002-005` via TDD.
