---
status: living-document
owner: tech-lead
last_updated: 2026-08-21
---

# Pendências do Projeto

> Lista viva de bloqueios e itens em aberto que travam (ou vão travar) o progresso técnico. Diferente do tracker de perguntas de negócio do pitch em [`specs/roadmap.md`](specs/roadmap.md#tracker-das-perguntas-em-aberto-pitch-slide-8) — aqui ficam pendências de execução (setup, segurança, sprints). Atualizar o status conforme cada item for resolvido; mover para "Resolvidas" com a data.

## Bloqueios ativos (impedem avançar hoje)

| Item | Bloqueia | O que falta | Dono |
|---|---|---|---|
| Conta de deploy + RPC da testnet Polygon Amoy | Fork test e deploy real de todas as sprints (1-3) | Preencher `.env` com `POLYGON_AMOY_RPC_URL` real e financiar a conta via [faucet Amoy](https://faucet.polygon.technology/) | — |
| Contratação do provedor de KYC (Trusted Issuer) | Integração real de KYC; `SEC-11` completo; Fase 1 do roadmap | Decisão de negócio — enquanto isso, testes e deploy local usam um Trusted Issuer mock, o que **não** bloqueia o código | — |

## Pendências técnicas (não travam hoje, mas precisam fechar antes da auditoria)

- [ ] `SEC-11` ([security-checklist.md](specs/security-checklist.md)) — chave do Trusted Issuer comprometida: contenção on-chain pronta e testada (`removerTrustedIssuer`), processo de rotação documentado ([runbook](specs/runbooks/rotacao-trusted-issuer.md)); falta só a custódia real (hardware wallet/multisig do provedor), que depende da contratação acima. **Único item do checklist ainda não `mitigado` (11/12 mitigados, `SEC-11` `parcialmente mitigado`).**
- [ ] Decisão de negócio sobre a moeda de liquidação real (`RISK-08`, stablecoin vs. BRL) — `PropertyToken`/`PropertyFactory`/`DividendDistributor`/`Marketplace` já são desacoplados da moeda (endereço ERC-20 configurável), então isso não bloqueia mais o código, só a integração final com a moeda escolhida.
- [ ] Mythril — não pôde ser executado neste ambiente (Windows sem suporte nativo, Docker Desktop local não estava em execução). Recomendado rodar em CI/Linux ou WSL2 antes do envio à auditoria (Slither já rodado e triado, ver [slither-triage.md](specs/slither-triage.md)).
- [ ] Auditoria externa — pré-requisito da Fase 4 do roadmap; ainda não contratada.
- [ ] Processo operacional de depósito mensal pelo gestor da SPE (feature 003, fora do contrato) — necessário para a Fase 4 do roadmap, não documentado ainda.

## Sprints/features ainda não iniciadas

Nenhuma — Sprint 4 está em andamento (ver `sprints/sprint-04-seguranca-e-preparacao-auditoria.md`).

## Decisões de negócio em aberto

Não duplicadas aqui — tracker completo (imóvel piloto, SPE, orçamento, equipe, investidores mapeados etc.) em [`specs/roadmap.md`](specs/roadmap.md#tracker-das-perguntas-em-aberto-pitch-slide-8).

## Resolvidas

- **2026-08-20** — `SEC-10` (PII on-chain) mitigado: `IdentityRegistry` só grava claims/hash de assinatura, nunca CPF/documento.
- **2026-08-20** — `SEC-02`, `SEC-03`, `SEC-05`, `SEC-12` mitigados após `PropertyToken`/`PropertyFactory` (Sprint 2): access control testado em ambos os contratos, sem blocos `unchecked`, imutabilidade via clone EIP-1167 com inicialização travada, `criarImovel` restrito a `PLATFORM_ADMIN_ROLE`.
- **2026-08-20** — Bloqueio de decisão de negócio da moeda de liquidação (`RISK-08`) não travou mais a Sprint 2: `comprarCotas` implementado desacoplado da moeda via endereço ERC-20 configurável, conforme workaround previsto na própria sprint. A escolha real da moeda continua pendente (ver lista acima), só não bloqueia mais o código.
- **2026-08-21** — `SEC-01`, `SEC-04`, `SEC-06`, `SEC-07`, `SEC-08`, `SEC-09` mitigados após `DividendDistributor`/`Marketplace` (Sprint 3): reentrancy coberta em todos os contratos que movem valor, preço fixo reduz MEV, ausência de oráculo testada como escolha de design, `claim` nunca itera sobre holders, `Marketplace` provado contra o `ComplianceModule`/`PropertyToken` reais, todo contrato emite evento para toda mudança de estado. Checklist de segurança: 11/12 itens mitigados.
- **2026-08-21** — Falta de mecanismo de snapshot em `PropertyToken` (pré-requisito não previsto pela feature 002 para o cálculo de RF-12 da feature 003) resolvida: `snapshot()`/`balanceOfAt()` adicionados via `Checkpoints` da OZ, sem quebrar os 17 testes já existentes.
- **2026-08-21** — Análise estática (Slither) rodada pela primeira vez (Sprint 4): 22 findings (3 High, 5 Medium, 9 Low, 4 Informational, 1 Optimization); 13 corrigidos no código com teste novo para cada um (`unchecked-transfer` no `Marketplace`, `missing-zero-check` em três construtores/`inicializar`, CEI estrito em `PropertyFactory.criarImovel`, `Marketplace.taxaTesouraria` imutável), 9 restantes triados como falso positivo/risco aceito. Detalhe em [`specs/slither-triage.md`](specs/slither-triage.md).
- **2026-08-21** — Processo de rotação de chave do Trusted Issuer documentado ([`specs/runbooks/rotacao-trusted-issuer.md`](specs/runbooks/rotacao-trusted-issuer.md)) — `SEC-11` passa de `pendente` para `parcialmente mitigado`; só falta a custódia real, que segue bloqueada pela contratação do provedor de KYC (ver bloqueios ativos acima).
