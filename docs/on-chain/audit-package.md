---
status: approved
owner: tech-lead
last_updated: 2026-08-22
---

# Pacote de Auditoria Externa — Sprint 4

Ponto de entrada único para o auditor externo (Fase 2 do roadmap, `roadmap.md`). Reúne escopo,
materiais de apoio e estado atual do código no momento do envio. Não duplica conteúdo — cada seção aponta
para a fonte da verdade correspondente.

## Escopo

Todos os 6 contratos em `src/*.sol`, na ordem de dependência (`001` é base dos demais):

| Contrato | Feature | Spec do contrato | LOC (aprox.) |
|---|---|---|---|
| `IdentityRegistry.sol` | 001-identidade-kyc | `features/001-identidade-kyc/contracts/identity-registry.md` | ~110 |
| `ComplianceModule.sol` | 001-identidade-kyc | `features/001-identidade-kyc/contracts/compliance-module.md` | ~75 |
| `PropertyToken.sol` | 002-tokenizacao-imovel | `features/002-tokenizacao-imovel/contracts/property-token.md` | ~250 |
| `PropertyFactory.sol` | 002-tokenizacao-imovel | `features/002-tokenizacao-imovel/contracts/property-factory.md` | ~100 |
| `DividendDistributor.sol` | 003-distribuicao-rendimentos | `features/003-distribuicao-rendimentos/contracts/dividend-distributor.md` | ~120 |
| `Marketplace.sol` | 004-mercado-secundario | `features/004-mercado-secundario/contracts/marketplace.md` | ~215 |

Fora de escopo: `lib/` (dependências de terceiros — Foundry `forge-std`, OpenZeppelin Contracts v5.7.0, não
modificadas), `script/` (scripts de deploy, não fazem parte da lógica de negócio), `test/` (só como material
de apoio, não como alvo de auditoria).

## Materiais de apoio

- **Requisitos e invariantes**: `on-chain/features/*/spec.md` (cenários Dado/Quando/Então) e
  `on-chain/features/*/contracts/*.md` (responsabilidades, interface, invariantes por contrato).
- **Decisões de arquitetura**: `decisions/ADR-0001` a `ADR-0006` (padrão de token ERC-3643 simplificado,
  rede Polygon, toolchain Foundry, estratégia de upgradability — imutável por design via clone EIP-1167 —,
  modelo de distribuição de rendimentos pull-payment, fronteira on-chain/off-chain do KYC).
- **Riscos já identificados e mitigação aplicada**: `on-chain/features/*/risks.md` (`RISK-01` a `RISK-16`) e
  consolidado em `security-checklist.md` (`SEC-01` a `SEC-12`).
- **Cobertura de testes**: 110 testes Foundry (unit + fuzz + integração), 100% de linhas/branches/funções em
  todos os 6 contratos de `src/*.sol` (`forge coverage`). Ver `PROGRESS.md` para o detalhamento por contrato.
- **Análise estática**: Slither rodado sobre todo `src/*.sol`; achados triados em
  `slither-triage.md` — nenhum finding em aberto (todos corrigidos ou justificados como falso
  positivo/risco aceito).
- **Análise dinâmica/simbólica**: Mythril rodado sobre todo `src/*.sol` — **0 findings em todos os 6
  contratos** (ver `mythril-triage.md` e observação abaixo).
- **Runbook operacional**: `runbooks/rotacao-trusted-issuer.md` (contenção e rotação de chave do
  Trusted Issuer, `SEC-11`).

## Estado do checklist de segurança no momento do envio

Ver `security-checklist.md` para o detalhamento item a item. Resumo: todos os itens têm mitigação
técnica on-chain implementada e testada; `SEC-11` tem o processo de rotação documentado
(`runbooks/rotacao-trusted-issuer.md`), mas a custódia real (hardware wallet/multisig do provedor de
KYC) só pode ser configurada após a contratação do provedor — decisão de negócio rastreada em
`PENDENCIAS.md`, não um item de código em aberto.

## Observação — Mythril

O ambiente de desenvolvimento usado nesta sprint é Windows, onde a instalação nativa do Mythril falha
(dependência `coincurve`/`cffi` não compila) — é preciso rodar via Docker (imagem oficial `mythril/myth`).
Isso ficou disponível em 2026-08-21 (Docker Desktop passou a estar em execução) e a análise foi concluída em
2026-08-22 sobre os 6 contratos, sem findings — ver `mythril-triage.md` para o comando validado (o
achatamento com `forge flatten` e o workaround necessário para o download do `solc` dentro do container).

## Congelamento de versão

Antes do envio efetivo ao auditor, criar uma tag anotada no commit que fecha a Sprint 4 (ex.: `git tag -a
v0.4.0-audit -m "Snapshot enviado à auditoria externa"`) e referenciá-la aqui. Qualquer mudança em
`src/*.sol` após essa tag deve ser comunicada ao auditor e pode invalidar findings já revisados.
