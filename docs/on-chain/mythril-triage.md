---
status: approved
owner: tech-lead
last_updated: 2026-08-22
---

# Triagem Mythril — Sprint 4

Resultado de `myth analyze --solv 0.8.28 -o json` (Mythril v0.24.8, via Docker `mythril/myth`, solc 0.8.28) sobre
os 6 contratos de `src/*.sol` (achatados com `forge flatten` antes da análise), rodado como item do
[`security-checklist.md`](security-checklist.md) antes da auditoria externa. Complementa
[`slither-triage.md`](slither-triage.md) (análise estática) com análise dinâmica/simbólica. Referenciado por
[`PROGRESS.md`](../PROGRESS.md).

## Resumo

- **Rodada concluída em 2026-08-22.** Os 6 contratos de `src/*.sol` foram analisados via Mythril v0.24.8
  (`myth analyze --solv 0.8.28 -t 3 --execution-timeout 600`, achatados com `forge flatten`).
  **Nenhum finding em nenhum dos 6 contratos** — 0 issues reportados pelos módulos de análise simbólica
  padrão do Mythril (reentrancy, overflow/underflow, unprotected selfdestruct/delegatecall, tx.origin,
  timestamp dependence, etc.).
- Complementa o resultado do Slither ([`slither-triage.md`](slither-triage.md)): estática (Slither) e
  simbólica/dinâmica (Mythril) convergem sem findings em aberto em nenhuma das duas ferramentas.
- Nenhuma linha em `src/*.sol` foi alterada por conta desta rodada — não havia o que corrigir.

## Findings

Nenhum. Os 6 contratos rodaram com `"issues": [], "success": true`.

| Contrato | Resultado |
|---|---|
| `IdentityRegistry` | 0 findings |
| `ComplianceModule` | 0 findings |
| `PropertyToken` | 0 findings |
| `PropertyFactory` | 0 findings |
| `DividendDistributor` | 0 findings |
| `Marketplace` | 0 findings |

## Como reproduzir

Pré-requisito: Docker Desktop rodando.

```bash
# 1. Achatar os contratos (resolve imports OZ/forge-std num único arquivo cada)
for f in IdentityRegistry ComplianceModule PropertyToken PropertyFactory DividendDistributor Marketplace; do
  forge flatten src/$f.sol -o /tmp/flattened/$f.sol
done

# 2. Baixar o solc 0.8.28 (linux) manualmente e colocar no cache que a solcx (usada pelo Mythril) espera —
#    necessário porque a py-solc-x embutida na imagem mythril/myth tem hardcoded o domínio legado
#    solc-bin.ethereum.org, que não resolve mais (ver PROGRESS.md, 2026-08-21).
mkdir -p /tmp/solcx-cache
curl -sL -o /tmp/solcx-cache/solc-v0.8.28 \
  https://binaries.soliditylang.org/linux-amd64/solc-linux-amd64-v0.8.28+commit.7893614a
chmod +x /tmp/solcx-cache/solc-v0.8.28

# 3. Rodar (no Git Bash/MSYS do Windows, exportar MSYS_NO_PATHCONV=1 antes, senão os paths do -v são
#    reescritos incorretamente)
docker pull mythril/myth:latest
docker run --rm \
  -v /tmp/solcx-cache:/home/mythril/.solcx \
  -v /tmp/flattened:/tmp/src \
  mythril/myth analyze /tmp/src/<Contrato>.sol --solv 0.8.28 -o json -t 3 --execution-timeout 600
```

Repetir a cada mudança relevante em `src/*.sol` antes de reenviar para a auditoria externa.
