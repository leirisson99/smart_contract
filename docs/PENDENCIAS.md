---
status: living-document
owner: tech-lead
last_updated: 2026-08-22
---

# Pendências do Projeto

> Lista viva de bloqueios e itens em aberto que travam (ou vão travar) o progresso técnico. Diferente do tracker de perguntas de negócio do pitch em [`on-chain/roadmap.md`](on-chain/roadmap.md#tracker-das-perguntas-em-aberto-pitch-slide-8) — aqui ficam pendências de execução (setup, segurança, sprints). Atualizar o status conforme cada item for resolvido; mover para "Resolvidas" com a data.

## Bloqueios ativos (impedem avançar hoje)

| Item | Bloqueia | O que falta | Dono |
|---|---|---|---|
| Conta de deploy + RPC da testnet Polygon Amoy | Fork test e deploy real de todas as sprints (1-3) | Preencher `.env` com `POLYGON_AMOY_RPC_URL` real e financiar a conta via [faucet Amoy](https://faucet.polygon.technology/) | — |
| Contratação do provedor de KYC (Trusted Issuer) | Integração real de KYC; `SEC-11` completo; Fase 1 do roadmap | Decisão de negócio — **em avaliação (2026-08-22)**: Didit (API + webhook, testando com chave de avaliação/plano free — não decidido) cotra Sumsub/idwall, ver `on-chain/roadmap.md` (tracker de perguntas). Nenhuma decisão travada ainda; enquanto isso, testes e deploy local usam um Trusted Issuer mock, o que **não** bloqueia o código. Nota de arquitetura: nenhum dos 3 candidatos assina claims on-chain nativamente — a chave do Trusted Issuer ficaria sob custódia da própria plataforma (backend), não do provedor (ver `ADR-0006`) | — |

## Pendências técnicas (não travam hoje, mas precisam fechar antes da auditoria)

- [ ] `SEC-11` ([security-checklist.md](on-chain/security-checklist.md)) — chave do Trusted Issuer comprometida: contenção on-chain pronta e testada (`removerTrustedIssuer`), processo de rotação documentado ([runbook](on-chain/runbooks/rotacao-trusted-issuer.md)); falta só a custódia real (hardware wallet/multisig do provedor), que depende da contratação acima. **Único item do checklist ainda não `mitigado` (11/12 mitigados, `SEC-11` `parcialmente mitigado`).**
- [ ] Decisão de negócio sobre a moeda de liquidação real (`RISK-08`, stablecoin vs. BRL) — `PropertyToken`/`PropertyFactory`/`DividendDistributor`/`Marketplace` já são desacoplados da moeda (endereço ERC-20 configurável), então isso não bloqueia mais o código, só a integração final com a moeda escolhida.
- [ ] Auditoria externa — pré-requisito da Fase 4 do roadmap; ainda não contratada.
- [ ] Processo operacional de decisão do valor do rendimento mensal pelo gestor da SPE (de onde vem o número, quem aprova) — o acionamento em si deixou de ser manual (Sprint 8: `POST /admin/imoveis/:id/depositar-rendimento`, ver `docs/backend/features/005-painel-administrativo/`), mas a decisão de negócio de quanto depositar continua fora do sistema. Necessário para a Fase 4 do roadmap, não documentado ainda.
- [ ] Ausência de autenticação/sessão nas rotas do investidor (`001`-`004`) — aceita como dívida da POC na Sprint 8 (junto com a introdução de RBAC administrativo), não bloqueia hoje porque toda checagem de negócio é revalidada on-chain (RNF-16). Ver `SEC-B02` em `docs/backend/security-checklist.md`.

## Sprints/features ainda não iniciadas

Nenhuma — Sprint 4 está em andamento (ver `sprints/sprint-04-seguranca-e-preparacao-auditoria.md`).

## Decisões de negócio em aberto

Não duplicadas aqui — tracker completo (imóvel piloto, SPE, orçamento, equipe, investidores mapeados etc.) em [`on-chain/roadmap.md`](on-chain/roadmap.md#tracker-das-perguntas-em-aberto-pitch-slide-8).

## Resolvidas

- **2026-09-02** — Ausência total de autenticação no backend (nenhuma rota, de nenhuma feature, tinha qualquer mecanismo de auth) resolvida para a superfície administrativa: Sprint 8 (`005-painel-administrativo`) introduziu RBAC via chave estática (`ADMIN_API_KEY`, header `x-admin-api-key`) cobrindo todas as rotas `/admin/*`. Checklist de segurança off-chain publicado pela primeira vez (`docs/backend/security-checklist.md`, item pendente desde a Sprint 5/feature 001). O `scripts/deposit-yield.ts` manual foi removido — depósito de rendimento agora é `POST /admin/imoveis/:id/depositar-rendimento`.

- **2026-08-20** — `SEC-10` (PII on-chain) mitigado: `IdentityRegistry` só grava claims/hash de assinatura, nunca CPF/documento.
- **2026-08-20** — `SEC-02`, `SEC-03`, `SEC-05`, `SEC-12` mitigados após `PropertyToken`/`PropertyFactory` (Sprint 2): access control testado em ambos os contratos, sem blocos `unchecked`, imutabilidade via clone EIP-1167 com inicialização travada, `criarImovel` restrito a `PLATFORM_ADMIN_ROLE`.
- **2026-08-20** — Bloqueio de decisão de negócio da moeda de liquidação (`RISK-08`) não travou mais a Sprint 2: `comprarCotas` implementado desacoplado da moeda via endereço ERC-20 configurável, conforme workaround previsto na própria sprint. A escolha real da moeda continua pendente (ver lista acima), só não bloqueia mais o código.
- **2026-08-21** — `SEC-01`, `SEC-04`, `SEC-06`, `SEC-07`, `SEC-08`, `SEC-09` mitigados após `DividendDistributor`/`Marketplace` (Sprint 3): reentrancy coberta em todos os contratos que movem valor, preço fixo reduz MEV, ausência de oráculo testada como escolha de design, `claim` nunca itera sobre holders, `Marketplace` provado contra o `ComplianceModule`/`PropertyToken` reais, todo contrato emite evento para toda mudança de estado. Checklist de segurança: 11/12 itens mitigados.
- **2026-08-21** — Falta de mecanismo de snapshot em `PropertyToken` (pré-requisito não previsto pela feature 002 para o cálculo de RF-12 da feature 003) resolvida: `snapshot()`/`balanceOfAt()` adicionados via `Checkpoints` da OZ, sem quebrar os 17 testes já existentes.
- **2026-08-21** — Análise estática (Slither) rodada pela primeira vez (Sprint 4): 22 findings (3 High, 5 Medium, 9 Low, 4 Informational, 1 Optimization); 13 corrigidos no código com teste novo para cada um (`unchecked-transfer` no `Marketplace`, `missing-zero-check` em três construtores/`inicializar`, CEI estrito em `PropertyFactory.criarImovel`, `Marketplace.taxaTesouraria` imutável), 9 restantes triados como falso positivo/risco aceito. Detalhe em [`on-chain/slither-triage.md`](on-chain/slither-triage.md).
- **2026-08-21** — Processo de rotação de chave do Trusted Issuer documentado ([`on-chain/runbooks/rotacao-trusted-issuer.md`](on-chain/runbooks/rotacao-trusted-issuer.md)) — `SEC-11` passa de `pendente` para `parcialmente mitigado`; só falta a custódia real, que segue bloqueada pela contratação do provedor de KYC (ver bloqueios ativos acima).
- **2026-08-22** — Mythril rodado pela primeira vez nesta máquina (antes bloqueado por falta de Docker/suporte nativo no Windows): Docker Desktop ficou disponível, análise rodada nos 6 contratos via `mythril/myth`, **0 findings em todos**. Detalhe (incluindo o workaround necessário para o download do `solc` dentro do container, já que a imagem tem hardcoded o domínio legado `solc-bin.ethereum.org`) em [`on-chain/mythril-triage.md`](on-chain/mythril-triage.md) e [`PROGRESS.md`](PROGRESS.md). Com isso, as duas ferramentas obrigatórias do `security-checklist.md` (Slither + Mythril) estão concluídas e sem findings em aberto.
