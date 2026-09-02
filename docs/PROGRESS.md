---
status: living-document
owner: tech-lead
last_updated: 2026-09-02
---

# Progresso do Projeto — Log de Execução

> Registro cronológico do que já foi **implementado, testado e verificado**. Complementa `plan.md` (índice do pacote de specs) e `sprints/` (planejamento) — aqui fica o que de fato foi feito, para qualquer pessoa (ou sessão futura) retomar o contexto rapidamente. Atualizar a cada marco relevante, não a cada commit.

## Estado atual (2026-09-01)

- **Sprints 1-3**: os 6 contratos da POC (`IdentityRegistry`, `ComplianceModule`, `PropertyToken`, `PropertyFactory`, `DividendDistributor`, `Marketplace`) estão implementados e testados — 110/110 testes, 100% de cobertura de linhas/branches/funções em todo `src/*.sol`.
- **Sprint 4 — análise estática e dinâmica concluídas**: Slither rodado e triado (22 → 9 findings, os 9 restantes justificados como falso positivo/risco aceito, 13 corrigidos no código com testes novos — [`slither-triage.md`](on-chain/slither-triage.md)); Mythril rodado nos 6 contratos, **0 findings em todos** — [`mythril-triage.md`](on-chain/mythril-triage.md). `SEC-11` passou de `pendente` para `parcialmente mitigado` — processo de rotação documentado.
- **Checklist de segurança**: 11/12 itens `mitigado`, `SEC-11` `parcialmente mitigado` (só falta a custódia real da chave, que depende da contratação do provedor de KYC — decisão de negócio ainda em aberto).
- **Pendente** (bloqueado por insumos externos, não por código, confirmado com o usuário em 2026-08-21): fork test/deploy na testnet Polygon Amoy (falta RPC + MATIC de teste), contratação do provedor de KYC. Nenhum dos dois bloqueia mais o fechamento técnico da Sprint 4.
- **Backend `001-onboarding-e-custodia`**: specs reconciliadas com o código real em 2026-09-02 (Sprint 5) — ver entrada de linha do tempo abaixo. `status: approved` nas 5 specs de backend.
- **Backend `002-investimento-primario` + `003-portfolio-e-rendimentos`**: implementados e testados em 2026-09-02 (Sprint 6) — endpoints de imóvel/compra/portfólio + job de claim automático, verificados com um teste e2e real contra Anvil local. Ver entrada de linha do tempo abaixo.
- **Frontend `001-interface-investidor` (UI mockada)**: as 7 telas do inventário da spec (Cadastro/KYC, Imóveis, Detalhes do Imóvel, Sucesso na Compra, Portfólio, Mercado Secundário, Painel do Gestor) implementadas em `frontend/`, usando o design system "Patrimônio Digital" gerado no Stitch (adotado como definitivo — `docs/frontend/design-system-brief.md` passou a `approved`). Consome uma camada de API mockada (`frontend/lib/api/`), não o backend real — ver detalhe abaixo.

## Linha do tempo

### 2026-08-19 — Setup inicial do projeto Foundry
- Instalado Foundry (`forge`/`cast`/`anvil` v1.7.1).
- `forge init --use-parent-git` — estrutura `src/`, `test/`, `script/` (git raiz é o diretório pai do repo).
- Dependências: `forge-std` e OpenZeppelin Contracts v5.7.0 (`AccessControl`, `Pausable`, `ReentrancyGuard` — ver [ADR-0003](on-chain/decisions/ADR-0003-toolchain-foundry.md)).
- `foundry.toml`: solc 0.8.28, otimizador (200 runs), fuzz/invariant runs, remappings, RPC/Etherscan da testnet Amoy ([ADR-0002](on-chain/decisions/ADR-0002-rede-polygon.md)).
- CI (`.github/workflows/test.yml`, gerado pelo `forge init`): `forge fmt --check`, `forge build --sizes`, `forge test`, `forge coverage`.
- `.env.example` com `POLYGON_AMOY_RPC_URL` / `PRIVATE_KEY` / `POLYGONSCAN_API_KEY`.
- Commit: `50a2542`.

### 2026-08-19/20 — `IdentityRegistry` via TDD
- `test/IdentityRegistry.t.sol` escrito primeiro (red) a partir de `spec.md` e `contracts/identity-registry.md` — 15 testes (unit + fuzz), cobrindo RF-02, RF-04, RF-05 e o cenário "remoção de Trusted Issuer não invalida claims já emitidas".
- `src/IdentityRegistry.sol` implementado até todos passarem (green): `AccessControl` com `PLATFORM_ADMIN_ROLE`; `emitirClaim`/`revogarClaim` restritos a Trusted Issuer autorizado (ou admin, na revogação); proteção contra reuso de assinatura (SEC-11).
- Resultado: 15/15 testes, 100% cobertura de linhas/branches/funções.
- Commits: `77a37f9`, `5cbcf75` (atualização da sprint).

### 2026-08-20 — `ComplianceModule` via TDD
- `test/ComplianceModule.t.sol` escrito primeiro a partir de `contracts/compliance-module.md` — 11 testes (unit + fuzz), cobrindo `canTransfer`/`motivoBloqueio` por KYC, limite de holders, e o invariante "nunca permite sem KYC".
- `src/ComplianceModule.sol` implementado: decide com base em `IdentityRegistry.isVerified` + limite de holders configurável. A spec não define como o contador de holders chega ao módulo (o `PropertyToken` só existe na Sprint 2) — adicionado hook `registrarTransferencia`, restrito a `TOKEN_ROLE`, mantendo `canTransfer` como `view` pura.
- Resultado: 11/11 testes, 100% cobertura.
- Commits: `3c15109`, `f09c519` (docs).

### 2026-08-20 — Testes de integração
- `test/Integration.t.sol` + `test/mocks/MockPropertyToken.sol` (mock mínimo do futuro `PropertyToken`, só para exercitar mint/transfer via `canTransfer`/`registrarTransferencia`).
- 5 testes ponta a ponta: mint bloqueado sem KYC, mint/transfer fluindo com KYC aprovado, revogação de claim bloqueia entrada sem confiscar saldo existente (cenário "Revogação de claim" de `spec.md`), limite de holders reforçado através do token.
- Commit: `4b49b9c`.

### 2026-08-20 — Checklist de segurança atualizado
- `SEC-10` (exposição de PII on-chain) marcado como `mitigado` em [on-chain/security-checklist.md](on-chain/security-checklist.md) — nenhum dado pessoal é gravado, só claims e hash de assinatura (ADR-0006).
- `SEC-02`/`SEC-08` seguem `pendente`: essas linhas também cobrem `PropertyToken`/`Marketplace` (features 002/004), que ainda não existem.
- `SEC-11` segue `pendente`: a contenção on-chain (`removerTrustedIssuer`) já está implementada e testada, mas o item exige hardware wallet/multisig e processo de rotação do provedor de KYC real — ainda não contratado.
- Commit: `f09c519`.

### 2026-08-20 — Script de deploy + verificação local ponta a ponta
- `script/DeployIdentityKyc.s.sol` criado (deploy de `IdentityRegistry` + `ComplianceModule`, reutilizável para Amoy trocando `--rpc-url`).
- Deploy real executado num node Anvil local; fluxo completo testado via `cast` como transações on-chain de verdade (não simulação de teste): `adicionarTrustedIssuer` → `emitirClaim` → `isVerified` → `canTransfer`/`motivoBloqueio` → `mint` via `MockPropertyToken`. Caminhos permitido e bloqueado confirmados, incluindo os reverts (`IssuerNaoAutorizado`, `ComplianceNaoVerificado`) — comportamento bateu exatamente com os testes unitários.
- Commit: `4fd4e23`.

### 2026-08-20 — `PropertyToken` via TDD (Sprint 2)
- `test/PropertyToken.t.sol` escrito primeiro a partir de `spec.md` e `contracts/property-token.md` — 17 testes (unit + fuzz), cobrindo RF-07/08/09, pausar/retomar, allowance, e reentrancy (mock de moeda maliciosa tentando reentrar `comprarCotas`).
- `src/PropertyToken.sol` implementado até todos passarem: deployado como minimal proxy EIP-1167 pela `PropertyFactory` (RNF-05) — usa `inicializar` em vez de `constructor`, com a implementação (não-clone) se auto-travando. ERC-20 mínimo escrito à mão (não herda `ERC20` da OZ) para suportar o padrão de clone sem depender de `openzeppelin-contracts-upgradeable`. CEI + `ReentrancyGuard` em `comprarCotas`/`transfer`/`transferFrom` (SEC-01).
- Moeda de liquidação (RISK-08, decisão de negócio ainda em aberto) desacoplada via `moedaPagamento`, um endereço ERC-20 configurável — seguindo o workaround já previsto em `sprints/sprint-02-tokenizacao-imovel.md`, sem travar a sprint.
- Resultado: 17/17 testes, 100% cobertura.
- Commit: `a0aea6d`.

### 2026-08-20 — `PropertyFactory` + testes de integração (Sprint 2)
- `test/PropertyFactory.t.sol` (7 testes) a partir de `contracts/property-factory.md`, cobrindo RF-06 e o compartilhamento de `IdentityRegistry`/`ComplianceModule` entre imóveis.
- `src/PropertyFactory.sol` implementado: deploya um `PropertyToken` por imóvel via `Clones` (EIP-1167) e concede `TOKEN_ROLE` a cada clone no `ComplianceModule` compartilhado. Requer, como passo de deploy, que a Factory tenha `DEFAULT_ADMIN_ROLE` no `ComplianceModule` — detalhe de integração que a spec não define, documentado em `PENDENCIAS.md`.
- `test/IntegrationPropertyFactory.t.sol` (5 testes): fluxo ponta a ponta — criação de imóvel, compra por investidor verificado, bloqueio sem KYC, overselling tudo-ou-nada, transferência secundária, e dois imóveis isolados no saldo mas compartilhando o mesmo compliance (revogar KYC bloqueia compra em qualquer imóvel).
- Resultado: 12 testes, 100% cobertura em `PropertyFactory.sol`.
- Commit: `e402f71`.

### 2026-08-20 — Checklist de segurança atualizado (Sprint 2)
- `SEC-02`, `SEC-03`, `SEC-05`, `SEC-12` marcados como `mitigado` em [on-chain/security-checklist.md](on-chain/security-checklist.md) — access control de `PropertyToken`/`PropertyFactory` testado, sem blocos `unchecked`, imutabilidade via clone EIP-1167 com padrão de inicialização travado, `criarImovel` restrito a `PLATFORM_ADMIN_ROLE`.
- `SEC-01` (reentrancy) segue `pendente`: `PropertyToken` já está protegido e testado, mas a linha também cobre a feature `003` (`DividendDistributor`), ainda não implementada.

### 2026-08-21 — Snapshot em `PropertyToken` (pré-requisito da Sprint 3)
- `contracts/dividend-distributor.md` exige um snapshot dos saldos "inspirado em `ERC20Snapshot`" que a feature 002 não previu. Estendido `PropertyToken` via TDD, preservando os 17 testes já existentes: `snapshot()` (restrito a `SNAPSHOT_ROLE`, será concedido ao `DividendDistributor` de cada imóvel) e `balanceOfAt(conta, snapshotId)` via `Checkpoints` da OZ, gravados lazily na primeira mutação após cada snapshot — evita loop sobre holders (RNF-06).
- Resultado: +7 testes (24 no total em `PropertyToken.t.sol`), 100% cobertura mantida.
- Commit: `c0aed5a`.

### 2026-08-21 — `DividendDistributor` via TDD (Sprint 3)
- `test/DividendDistributor.t.sol` (15 testes) a partir de `spec.md`/`contracts/dividend-distributor.md`, cobrindo RF-11 a RF-15, dust/arredondamento e o cenário "transferência de cota entre ciclos" (spec.md).
- `src/DividendDistributor.sol` implementado: modelo pull-payment (ADR-0004) — `depositarRendimento` tira snapshot e abre ciclo; `claim`/`claimTodos` reivindicam a parte proporcional ao saldo no snapshot, uma vez por ciclo, sem iterar sobre holders (RNF-06). Deployado com constructor normal (não clone — frequência baixa não justifica EIP-1167); requer `SNAPSHOT_ROLE` no `PropertyToken` do imóvel como passo de deploy.
- Resultado: 15/15 testes, 100% cobertura.
- Commit: `aac3a06`.

### 2026-08-21 — `Marketplace` via TDD (Sprint 3)
- `test/Marketplace.t.sol` (19 testes) a partir de `spec.md`/`contracts/marketplace.md`, cobrindo RF-16 a RF-20, taxa de transação e duas compras sequenciais na mesma listagem (cenário de concorrência).
- `src/Marketplace.sol` implementado: mercado a preço fixo (RNF-09) compartilhado entre imóveis, escrow de cotas via `transferFrom`/`transfer` normais do `PropertyToken` — nenhum atalho de compliance (RISK-16/SEC-08); a segurança vem do próprio `PropertyToken` recusar transferências, não de checagem duplicada. Consequência: o endereço do `Marketplace` precisa de uma claim `KYC_APPROVED` no `IdentityRegistry` para poder manter cotas em escrow — passo de deploy.
- Usa o `PropertyToken` real nos testes (não mock) — já cobre a integração Marketplace + PropertyToken + ComplianceModule pedida em `test-strategy.md`.
- Resultado: 19/19 testes, 100% cobertura.
- Commit: `1dbf401`.

### 2026-08-21 — Checklist de segurança atualizado (Sprint 3)
- `SEC-01`, `SEC-04`, `SEC-06`, `SEC-07`, `SEC-08`, `SEC-09` marcados como `mitigado` em [on-chain/security-checklist.md](on-chain/security-checklist.md) — reentrancy coberta em todos os contratos que movem valor; preço fixo reduz superfície de MEV; ausência de oráculo é uma escolha de design testada; `claim` nunca itera sobre holders; `Marketplace` provado end-to-end contra o `ComplianceModule`/`PropertyToken` reais; todo contrato emite evento para toda mudança de estado relevante.
- Resultado: **11/12 itens do checklist mitigados** — só `SEC-11` (chave do Trusted Issuer) segue pendente, bloqueado pela contratação do provedor de KYC.

## Estado da suíte de testes

| Contrato/suite | Testes | Cobertura |
|---|---|---|
| `IdentityRegistry` | 15 | 100% linhas/branches/funções |
| `ComplianceModule` | 11 | 100% linhas/branches/funções |
| Integração feature 001 (`Integration.t.sol`) | 5 | — |
| `PropertyToken` (inclui snapshot) | 26 | 100% linhas/branches/funções |
| `PropertyFactory` | 10 | 100% linhas/branches/funções |
| Integração feature 002 (`IntegrationPropertyFactory.t.sol`) | 5 | — |
| `DividendDistributor` | 15 | 100% linhas/branches/funções |
| `Marketplace` | 23 | 100% linhas/branches/funções |
| **Total** | **110** | **100% em todos os `src/*.sol`** |

Rodar localmente: `forge test -vv` (suíte completa) e `forge coverage` (relatório de cobertura).

## Pendências conhecidas

Lista completa e atualizada em [`PENDENCIAS.md`](PENDENCIAS.md). Resumo: fork test/deploy em testnet Amoy (falta RPC + MATIC de faucet), contratação do provedor de KYC (bloqueia a custódia real de `SEC-11`), decisão de negócio sobre a moeda de liquidação real (RISK-08), e Mythril ainda não executado (ambiente Windows sem Docker disponível nesta sessão).

### 2026-08-21 — Sprint 4: Slither, hardening e SEC-11 (em andamento)

- Instalado Slither 0.11.6 (`pip install slither-analyzer`) e rodado sobre todo `src/*.sol`: 22 findings
  iniciais (3 High, 5 Medium, 9 Low, 4 Informational, 1 Optimization).
- 13 findings corrigidos no código: `Marketplace.listar/cancelar/comprar` agora checam o retorno de
  `transfer`/`transferFrom` (`unchecked-transfer`, High); zero-address check em `PropertyFactory.constructor`,
  `Marketplace.constructor` e `PropertyToken.inicializar` (`missing-zero-check`); `PropertyFactory.criarImovel`
  reordenado para CEI estrito (`reentrancy-benign`/`reentrancy-events`); `Marketplace.taxaTesouraria` agora
  `immutable`; locais de `listagensAtivasPorToken` inicializados explicitamente. Todos com teste novo
  cobrindo o caminho antes não testado (inclui `test/mocks/FalsyPropertyToken.sol`, um dublê que simula
  `transfer`/`transferFrom` retornando `false`, cenário impossível com o `PropertyToken` real mas necessário
  para exercitar o `require` de defesa em profundidade).
- Além disso, um gap de cobertura pré-existente em `PropertyToken._writeCheckpoint` (statement nunca avaliado:
  duas mutações no mesmo período de snapshot) foi fechado com um teste novo — 100% de statements restaurado.
- Os 9 findings restantes do Slither foram triados como falso positivo ou risco aceito por design — detalhe
  completo em [`on-chain/slither-triage.md`](on-chain/slither-triage.md).
- `on-chain/runbooks/rotacao-trusted-issuer.md` criado: processo de contenção e rotação de chave do Trusted
  Issuer (`SEC-11`) — fecha a parte de processo do item; a custódia real (hardware wallet/multisig do
  provedor) segue dependendo da contratação do provedor de KYC.
- `on-chain/audit-package.md` criado: escopo e materiais de apoio consolidados para o auditor externo.
- `on-chain/features/*/risks.md` (001-004) revisados — todo `RISK-XX` confirmado mitigado ou aceito.
- Mythril não pôde ser rodado anteriormente nesta máquina: instalação nativa falha no Windows (`coincurve`/`cffi`
  não compila) e o Docker Desktop local não estava em execução para usar a imagem oficial `mythril/myth`.
- Suíte: 101 → 110 testes (todos passando), 100% de cobertura mantida em todos os 6 contratos.

### 2026-08-21 — Mythril desbloqueado e em execução (Sprint 4, continuação)

- Docker Desktop passou a estar disponível nesta sessão (`docker ps` responde) — item que antes bloqueava o
  Mythril deixou de ser um bloqueio de ambiente.
- Imagem oficial `mythril/myth:latest` (v0.24.8) baixada via `docker pull`.
- Os 6 contratos de `src/*.sol` achatados com `forge flatten` (resolve os imports do OpenZeppelin/forge-std
  num único arquivo por contrato) para simplificar a análise dentro do container.
- **Problema encontrado**: a `py-solc-x` 1.1.1 embutida na imagem do Mythril tem hardcoded o domínio legado
  `solc-bin.ethereum.org`, que não resolve mais (a Ethereum Foundation migrou para
  `binaries.soliditylang.org`) — `myth analyze --solv 0.8.28` falhava com `NameResolutionError` ao tentar
  baixar o compilador automaticamente.
  - **Workaround**: baixado manualmente o binário Linux do `solc` 0.8.28 de `binaries.soliditylang.org` e
    posicionado no cache que a `solcx` espera (`~/.solcx/solc-v0.8.28`), montado no container via volume
    Docker (`-v .../solcx-cache:/home/mythril/.solcx`). `solc --version` confirmado rodando dentro do
    container (glibc) — a mesma checagem falha no Alpine (musl), o que é esperado e não indica problema.
  - Nota de ambiente: no Git Bash/MSYS do Windows, `docker run -v` precisa de `MSYS_NO_PATHCONV=1` no
    ambiente, senão o MSYS reescreve os caminhos do container (`/out` virou `C:/Program Files/Git/out`) e o
    mount silenciosamente aponta para o lugar errado.
- Análise rodada nos 6 contratos achatados (`myth analyze --solv 0.8.28 -o json -t 3 --execution-timeout 600`,
  em paralelo, 3 no primeiro lote e 3 no segundo) — todos concluídos com `"issues": [], "success": true`.
  **0 findings em todos os 6 contratos.** Detalhe em [`on-chain/mythril-triage.md`](on-chain/mythril-triage.md).

### 2026-08-22 — Mythril concluído (Sprint 4, fechamento técnico)

- Os 6 contratos rodaram sem nenhum finding: `IdentityRegistry`, `ComplianceModule`, `PropertyToken`,
  `PropertyFactory`, `DividendDistributor`, `Marketplace`. Nenhuma mudança de código necessária.
- Confirmado com o usuário (2026-08-21) que os dois bloqueios externos remanescentes — deploy/fork test na
  testnet Amoy (falta RPC + MATIC) e contratação do provedor de KYC (bloqueia a custódia real de `SEC-11`) —
  ficam documentados em [`PENDENCIAS.md`](PENDENCIAS.md) e não travam o fechamento técnico da Sprint 4.
- `security-checklist.md` e `audit-package.md` atualizados para refletir Slither + Mythril concluídos e
  triados, sem findings em aberto em nenhuma das duas ferramentas.
- Com isso, a Sprint 4 está tecnicamente completa: todo item de código do checklist de segurança está
  mitigado (exceto a parte de custódia de `SEC-11`, que é bloqueio de negócio, não de código) e as duas
  análises (estática e dinâmica) recomendadas antes da auditoria externa foram executadas e triadas.

### 2026-09-01 — Frontend `001-interface-investidor`: UI mockada com design system do Stitch

- Design system "Patrimônio Digital" (Deep Navy `#0a2540` + Verde Esmeralda `#00875a`, Inter) gerado no
  Stitch (projeto "Plataforma de Tokenização Imobiliária") adotado como definitivo, fechando a decisão de
  paleta/tipografia que estava em aberto em [`docs/frontend/design-system-brief.md`](frontend/design-system-brief.md)
  (`status` passou de `draft` para `approved`). Tokens implementados em `frontend/app/globals.css` via `@theme`
  do Tailwind v4.
- ~25 componentes reutilizáveis criados em `frontend/components/{ui,layout,feedback,kyc,property,portfolio,marketplace,admin}/`,
  seguindo o padrão `tailwind-variants` já usado no `Button` original do scaffold.
- Camada de dados mockada em `frontend/lib/api/` (`kyc`, `imoveis`, `portfolio`, `marketplace`, `admin`),
  espelhando os contratos descritos em `frontend/features/001-interface-investidor/integration.md` — usada
  porque só a feature backend `001-onboarding-e-custodia` tem código real; `002` a `005` seguem em `draft`.
  Troca por chamadas reais ao backend fica mecânica quando essas features avançarem. `frontend/lib/errors.ts`
  centraliza a tradução de erros técnicos em mensagens pt-BR (RF-32).
- 6 rotas via App Router (route groups `(investidor)` e `(admin)`) cobrindo as 7 telas do inventário da spec
  e RF-27 a RF-32: `/cadastro`, `/imoveis`, `/imoveis/[id]` (com estado de sucesso da compra), `/portfolio`,
  `/mercado-secundario`, `/admin`. Botão transacional com estados `idle → processando → sucesso/erro` (RNF-15)
  em `components/feedback/transactional-button.tsx`.
- **Bug encontrado e corrigido durante a verificação**: `tailwind-variants`/`tailwind-merge` descartava a
  classe de cor `text-on-primary` por confundi-la com o token de tamanho `text-body-md` (ambos com prefixo
  `text-`, ambos tokens customizados) — todo botão primário renderizava com texto quase invisível (herdava a
  cor do body em vez de branco). Corrigido registrando os tokens customizados do design system via
  `createTV`/`extendTailwindMerge` em `frontend/lib/tv.ts` e `frontend/lib/utils.ts`.
- Verificação ponta a ponta com Playwright (Chromium headless, sem `chromium-cli`/skill de projeto disponíveis
  neste ambiente Windows): jornada completa cadastro → aprovação assíncrona de KYC → compra de cota → tela de
  sucesso → portfólio → resgate de rendimento → mercado secundário → criar listagem → painel do gestor, em
  viewport desktop e mobile (bottom nav sticky confirmado), sem erros de console/hidratação.
- `npm run build` e `npm run lint` limpos (só 2 warnings esperados de parâmetros não usados no stub mock de
  `depositarRendimento`).
- Sem migração para Base UI (mencionada em `design-system-brief.md`, mas as pastas
  `frontend/.claude/skills/{shadcn,migrate-radix-to-base}/` estão vazias, sem `SKILL.md`) — decisão
  arquitetural separada, fora deste escopo.

### 2026-09-02 — Sprint 5: reconciliação e aprovação das especificações de backend

- `docs/backend/features/001-onboarding-e-custodia/{spec,plan,tasks,implement}.md` reconciliados com o código
  real de `backend/src/` (Fastify + Prisma + viem, já implementado desde 2026-09-01 fora do fluxo SDD formal):
  RF-33 passou a declarar que **o próprio backend** (não o provedor de KYC) emite a claim on-chain
  `IdentityRegistry.emitirClaim`, atuando como Trusted Issuer — desvio deliberado do desenho original, já que
  nenhum dos 3 candidatos a provedor de KYC avaliados (`PENDENCIAS.md`) assina claims on-chain nativamente;
  RNF-11 passou a declarar o estado atual (chaves cifradas com AES-256-GCM via `WALLET_ENC_KEY` de `.env`,
  stub explícito em `walletCustody.ts`) como aceito nesta fase da POC; tasks 3, 4 e 6 marcadas `[x]`
  (endpoint de cadastro, orquestração de KYC/webhook e 8 testes vitest já implementados e passando); tasks 1
  (dividida em 1a/1b), 2, 5 e 7 mantidas em aberto com escopo expandido a partir dos gaps encontrados nesta
  reconciliação (nenhuma rota tem autenticação hoje; `GET /investors/:id/kyc` lê o banco, não
  `isVerifiedOnChain`). Spec passou de `draft` para `approved`.
- `docs/on-chain/decisions/ADR-0006-fronteira-onchain-offchain-kyc.md`: nova seção "Atualização" formaliza o
  backend como Trusted Issuer na POC, documenta o trade-off de risco aceito (chave em `.env`, sem HSM/multisig
  ainda) e o plano de migração para HSM/KMS antes de qualquer captação de investidores de varejo. `SEC-11` em
  `on-chain/security-checklist.md` atualizado para refletir que a chave é operada pelo backend, não por um
  provedor de KYC.
- `docs/backend/features/{002,003,004,005}-*/spec.md` revisadas e aprovadas: adicionados cenários
  Dado/Quando/Então que faltavam (revalidação de KYC/saldo revogado on-chain em 002, comportamento de falha
  parcial do job de claim em 003, rejeição por KYC ausente em 004, rejeição por role inválida em 005),
  nomeados os códigos de erro esperados de cada endpoint, e explicitado que 005 depende só dos **contratos**
  on-chain de 002/003 (já prontos), não do backend 002/003 (que só saem de draft agora).
- `docs/backend/api-contract.md` criado: consolida os endpoints de todas as 5 features e o vocabulário de 8
  códigos de erro já consumido por `frontend/lib/errors.ts` (`SEM_KYC`, `KYC_REPROVADO`,
  `COTAS_INSUFICIENTES`, `VALOR_MINIMO_NAO_ATINGIDO`, `LISTAGEM_JA_VENDIDA`, `LISTAGEM_NAO_ENCONTRADA`,
  `SALDO_INSUFICIENTE`, `ERRO_DESCONHECIDO`) — destrava a task 5 de `001`. Gap conhecido registrado: os
  handlers atuais de `001` ainda respondem com strings livres, não com esse formato; alinhar é trabalho de
  código futuro.
- `docs/sprints/{05,06,07,08}-*.md` criados, quebrando a trilha de Backend em sprints pela primeira vez
  (antes só existiam `tasks.md` por feature, sem sprint): Sprint 5 (esta, reconciliação — `done`), Sprint 6
  (`002`+`003`, paralelizáveis entre si), Sprint 7 (`004`, isolada por introduzir o primeiro fluxo entre duas
  carteiras custodiais — pode rodar em paralelo à 6), Sprint 8 (`005` + autenticação/RBAC transversal,
  hoje ausente em toda a API, + revisão de segurança off-chain). `docs/sprints/00-visao-geral.md` atualizado
  para listar as duas trilhas (Smart Contract 1-4, Backend 5-8).
- Todas essas mudanças foram só de documentação — nenhum código de `backend/` foi alterado nesta sprint.

### 2026-09-02 — Sprint 6: investimento primário + portfólio e rendimentos (backend)

- **`002-investimento-primario`**: `backend/src/routes/imoveis.ts` + `backend/src/services/propertyChain.ts`
  (novo). `GET /imoveis`/`GET /imoveis/:id` leem os dados financeiros (nome, preço por cota, cotas
  disponíveis, total emitido) ao vivo do `PropertyToken` on-chain via viem — nunca cacheados no banco, só
  metadados de UX (imagem, rendimento estimado, status, valor mínimo) ficam no novo model Prisma `Property`.
  `POST /imoveis/:id/comprar` revalida KYC direto on-chain (`isVerifiedOnChain`, não o status gravado pela
  feature 001 — RNF-16) e saldo/valor mínimo no momento da chamada, aprova a moeda de pagamento e assina
  `comprarCotas` com a chave da carteira custodial do investidor; grava o resultado no novo ledger
  `Investment` (usado depois pelo portfólio para calcular valor investido, já que o contrato não rastreia
  isso). Falha on-chain devolvida como `502 { codigo: "ERRO_DESCONHECIDO" }`.
- **`003-portfolio-e-rendimentos`**: `backend/src/routes/portfolio.ts` (`GET /investors/:id/portfolio`) agrega
  cotas (via `balanceOf` on-chain), valor investido (soma do ledger `Investment`) e histórico de rendimentos
  (novo ledger `YieldClaim`). `backend/src/services/yieldClaimJob.ts` + `backend/scripts/run-yield-claim-job.ts`
  implementam o job de claim automático (RF-24): tenta `DividendDistributor.claimTodos` em lote por
  investidor, com fallback para `claim` individual por ciclo se o lote reverter; falha isolada (de um ciclo ou
  de um investidor) nunca trava o processamento dos demais (testado explicitamente). A constraint única
  `(investorId, propertyId, cicloId)` em `YieldClaim` garante idempotência do job mesmo se reexecutado.
- **Descoberta durante a implementação (não prevista em nenhuma spec anterior)**: carteiras custodiais nascem
  com saldo zero de ETH — como `comprarCotas`/`claim` são assinados pela própria carteira do investidor, a
  primeira transação de qualquer investidor falhava por falta de gas (só descoberto rodando o e2e real contra
  Anvil; os testes unitários mockam a chain e não pegam isso). Resolvido com um novo serviço
  `backend/src/services/gasSponsor.ts`: o backend financia a carteira do investidor com um valor fixo de ETH,
  a partir de uma conta própria (`GAS_SPONSOR_PRIVATE_KEY`, novo env var), sempre que o saldo cair abaixo de um
  limiar — documentado em `docs/backend/features/001-onboarding-e-custodia/plan.md` como parte do componente
  de custódia.
- **Infraestrutura de teste nova**: `projeto_imobiliaria/script/DeployPropertyPipeline.s.sol` — deploy local
  (Anvil) de uma moeda de teste (`MockERC20`), da `PropertyFactory`, de um imóvel de exemplo já criado via
  `criarImovel`, e do `DividendDistributor` desse imóvel, com os papéis on-chain já concedidos. Rodado uma vez
  contra o Anvil local desta máquina para gerar endereços reais e verificar o fluxo ponta a ponta.
- **Correção de infraestrutura pré-existente**: `backend/tsconfig.json` tinha `module`/`moduleResolution`
  incompatíveis com `import ... with { type: "json" }` (usado desde a feature 001 para carregar ABIs) — `tsc
  --noEmit` já falhava antes desta sprint, só ninguém tinha rodado (só `tsx`/`vitest` eram usados, que toleram
  isso em runtime). Corrigido para `NodeNext`/`NodeNext`, consistente com `"type": "module"` do `package.json`.
  `npm run build` e `tsc --noEmit` confirmados limpos.
- **Correção de teste**: adicionado `onDelete: Cascade` nas relações de `KycSubmission`, `Investment` e
  `YieldClaim` com `Investor`/`Property` (nova migration) — sem isso, a ordem de `deleteMany()` no `beforeEach`
  de cada arquivo de teste precisava conhecer as tabelas criadas por *outros* arquivos, o que já quebrou ao
  adicionar os novos testes desta sprint.
- **Testes**: `test/imoveis.routes.test.ts` (6), `test/portfolio.routes.test.ts` (3), `test/yieldClaimJob.test.ts`
  (4) — unitários, mockando a chain. `test/property-flow.e2e.test.ts` (1, gated por `RUN_E2E=1`) — rodado
  contra o Anvil local real desta máquina: cadastro → KYC aprovado (claim real on-chain) → compra real de
  cotas → portfólio refletindo o holding → depósito de rendimento real (via viem, já que o endpoint
  administrativo de 005 não existe ainda) → job de claim automático real → portfólio refletindo o rendimento
  recebido. Suíte completa (unit + os 2 e2e): 22/22 passando.
- Pendente (não bloqueante, mesmo padrão da trilha on-chain): teste/deploy em testnet Polygon Amoy — só
  verificado contra Anvil local nesta sessão.

## Próximos passos

- **Sprint 4 on-chain (restante — todos bloqueios de negócio, não de código)**: congelar tag de release para
  envio à auditoria (`git tag -a v0.4.0-audit`, ver `on-chain/audit-package.md`); contratar a auditoria
  externa; deploy real em testnet Amoy (falta RPC + MATIC de faucet); contratar o provedor de KYC (destrava a
  custódia real de `SEC-11`, agora também rastreada como task 1b em `backend/features/001.../tasks.md`).
- **Sprint 6 (backend, restante)**: teste/deploy em testnet Polygon Amoy (bloqueio externo, não de código —
  mesmo item da trilha on-chain).
- **Sprint 7 (backend)**: implementar `004-mercado-secundario`, paralelizável à Sprint 6. Ver
  `docs/sprints/07-mercado-secundario.md`.
- **Sprint 8 (backend)**: implementar `005-painel-administrativo` e introduzir autenticação/RBAC em toda a
  API (gap hoje presente até em `001`). Ver `docs/sprints/08-painel-administrativo-e-seguranca-backend.md`.
- **Frontend**: quando as features de backend `002-005` tiverem código real, trocar a camada mockada de
  `frontend/lib/api/` por chamadas reais (as assinaturas de função já espelham os contratos de
  `integration.md`/`docs/backend/api-contract.md`, então a troca é mecânica). Revisão de acessibilidade mais
  profunda (navegação por teclado em todos os formulários, leitores de tela) ainda não foi feita — só
  verificação visual/funcional via Playwright.
