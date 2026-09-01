---
status: approved
owner: time-fundador
last_updated: 2026-08-17
---

# Roadmap — Specs × POC de 16 Semanas

Mapeamento entre o pacote de especificações e as 4 fases do roadmap apresentado no pitch (`tokenizacao-imobiliaria-poc.pptx`, slide 7).

## Fase 1 — Fundação Jurídica (Semanas 1-4)

**Specs que precisam estar `approved` antes de iniciar:**
- `00-constitution.md`
- `features/001-identidade-kyc/spec.md`
- `decisions/ADR-0006-fronteira-onchain-offchain-kyc.md`

**Entregas da fase:** constituição da SPE, enquadramento junto à CVM 588, contratação de advogado especializado em cripto, definição do provedor de KYC (Trusted Issuer).

**Marco de saída:** SPE constituída e enquadramento regulatório definido; specs de contrato (`002` a `004`) em rascunho paralelo, prontas para revisão técnica na Fase 2.

## Fase 2 — Smart Contract (Semanas 3-6)

**Specs que precisam estar `approved` antes de iniciar implementação:**
- `decisions/ADR-0001` a `ADR-0005`
- Todos os `on-chain/features/00{1,2,3,4}-*/spec.md`, `plan.md` e `contracts/*.md`
- Todos os `on-chain/features/00{1,2,3,4}-*/test-strategy.md`

**Regra de execução (TDD):** para cada contrato, os cenários Dado/Quando/Então do respectivo `spec.md`/`contracts/*.md` viram testes Foundry que devem falhar (red) antes de qualquer linha de Solidity ser escrita (green), seguida de refactor.

**Entregas da fase:** contratos `IdentityRegistry`, `ComplianceModule`, `PropertyToken`, `PropertyFactory`, `DividendDistributor`, `Marketplace` implementados e testados; `security-checklist.md` 100% verificado; auditoria de segurança externa contratada e concluída.

**Marco de saída:** contratos auditados, deployados em testnet Polygon (Amoy), prontos para integração com a plataforma.

**Quebra em sprints:** esta fase é a primeira a entrar em execução e está detalhada em [`../sprints/00-visao-geral.md`](../sprints/00-visao-geral.md) (Sprints 1-4).

## Fase 3 — Plataforma Digital (Semanas 5-10)

**Specs que precisam estar `approved` antes de iniciar:**
- `../backend/features/*/spec.md`, `plan.md`, `implement.md` (repositório irmão `backend/`, 5 features: `001-onboarding-e-custodia`, `002-investimento-primario`, `003-portfolio-e-rendimentos`, `004-mercado-secundario`, `005-painel-administrativo`)
- `../frontend/features/001-interface-investidor/spec.md`, `plan.md`, `integration.md`

**Entregas da fase:** onboarding + KYC integrado ao `IdentityRegistry` on-chain, tela do imóvel (rendimento estimado, cotas disponíveis), portfólio do investidor, painel do gestor/administrador da SPE.

**Marco de saída:** fluxo ponta a ponta funcional em testnet — cadastro, KYC, compra de cota, visualização do token na carteira.

## Fase 4 — Operação Piloto (Semanas 9-16)

**Pré-requisitos:**
- `security-checklist.md` 100% concluído + relatório de auditoria externa sem findings críticos em aberto
- `on-chain/features/*/risks.md` revisados com mitigação aplicada ou risco formalmente aceito

**Entregas da fase:** deploy em mainnet Polygon, operação com 1 imóvel e 20 investidores reais, 2 ciclos completos de distribuição de aluguel (feature 003), validação completa do modelo.

**Marco de saída:** POC validada; dados reais de operação (custo de gas, tempo de onboarding, taxa de claim de dividendos) disponíveis para a decisão de escala.

---

## Tracker das perguntas em aberto (pitch, slide 8)

Estas perguntas foram levantadas no pitch como pontos a validar com investidores/stakeholders antes de travar o cronograma exato. Bloqueiam fases específicas se não respondidas a tempo.

| Pergunta | Bloqueia | Status | Dono |
|---|---|---|---|
| O imóvel piloto já está disponível? | Fase 4 (semana 9) | pendente | — |
| Já tem inquilino ou contrato de aluguel? | Fase 4 (distribuição de rendimentos real) | pendente | — |
| Existe apetite para constituir a SPE agora? | Fase 1 (semana 1) | pendente | — |
| Qual o orçamento disponível para os 4 meses? | Todas as fases (dimensionamento de equipe) | pendente | — |
| Já há 20 investidores qualificados mapeados? | Fase 4 (semana 9) | pendente | — |
| Existe equipe técnica interna ou precisamos contratar? | Fase 2 (semana 3) | pendente | — |
| O objetivo é plataforma própria ou licenciar? | Escopo de `../backend/features` pós-POC | pendente | — |
| Há interesse em outros imóveis após a POC? | Dimensionamento da `PropertyFactory` pós-POC | pendente | — |
| Qual o tamanho de carteira imaginado em 3 anos? | Planejamento de capacidade pós-POC | pendente | — |

Atualizar `Status` para `respondido` e preencher `Dono` conforme as reuniões com investidores avançarem.
