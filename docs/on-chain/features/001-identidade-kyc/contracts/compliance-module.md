---
status: draft
owner: tech-lead
last_updated: 2026-08-17
---

# Contrato: ComplianceModule

## Responsabilidades
- Decidir, de forma consultável por outros contratos (`PropertyToken`, `Marketplace`), se uma transferência entre duas carteiras é permitida.
- Centralizar regras de negócio de elegibilidade além do KYC básico (ex.: limite de holders por imóvel na POC, se necessário).

## Interface esperada (sem código)

**Funções de leitura (view):**
- `canTransfer(address de, address para, uint256 quantidade) → bool` — chamada pelo `PropertyToken` antes de qualquer transferência.
- `motivoBloqueio(address de, address para) → string` — retorna o motivo legível do bloqueio, usado para mensagens de erro/UX na plataforma.

**Funções de configuração (restritas):**
- `definirLimiteHolders(uint256 limite)` — apenas `COMPLIANCE_ADMIN_ROLE`; `0` = sem limite.

**Eventos:**
- `TransferenciaBloqueada(address de, address para, string motivo)` (emitido pelo `PropertyToken` ao consultar, não pelo módulo em si, para manter o módulo como `view`).

## Invariantes
- `canTransfer` retorna `false` sempre que `IdentityRegistry.isVerified(para)` for `false` (exceto para a própria plataforma em operações de custódia interna, se aplicável — a definir em revisão).
- `canTransfer` é uma função `view` — nunca modifica estado, para poder ser chamada livremente por outros contratos sem custo de gas adicional em simulações.

## Cenários de aceite (Dado/Quando/Então)
| Cenário | Dado | Quando | Então |
|---|---|---|---|
| Transferência permitida | `de` tem saldo suficiente, `para` tem `isVerified == true` | `PropertyToken.transfer` é chamado | `canTransfer` retorna `true`; transferência prossegue |
| Transferência bloqueada — destino sem KYC | `para` tem `isVerified == false` | `PropertyToken.transfer` é chamado | `canTransfer` retorna `false`; transferência reverte com motivo específico |
| Limite de holders atingido | Limite de holders está configurado e já foi atingido | Uma transferência criaria um novo holder | `canTransfer` retorna `false` |

## Riscos de segurança específicos
- **SEC-08**: garantir que absolutamente todo caminho de transferência (mint, transfer direto, transfer via `Marketplace`) passe por `canTransfer` — nenhum atalho que ignore o módulo.
- Gas de leitura: `canTransfer` deve ser eficiente (evitar loops não limitados) para não inviabilizar transferências com muitos holders.

## Referências
- Padrão "Compliance Module pluggável" do ERC-3643 (ADR-0001) — este contrato é uma implementação inicial simplificada; desenho permite trocar/estender regras sem alterar o `PropertyToken`.
