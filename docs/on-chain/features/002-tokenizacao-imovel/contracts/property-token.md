---
status: draft
owner: tech-lead
last_updated: 2026-08-17
---

# Contrato: PropertyToken

Implementa o padrão ERC-3643 (ADR-0001) para representar as cotas de um único imóvel.

## Responsabilidades
- Manter saldo de cotas por carteira (`balanceOf`), compatível com a interface básica ERC-20.
- Executar mint das cotas na emissão primária, respeitando o limite de `totalSupply`.
- Bloquear qualquer transferência (mint, transfer, transferFrom) que não seja aprovada pelo `ComplianceModule` (feature 001).
- Emitir eventos que sirvam de prova de propriedade auditável.

## Interface esperada (sem código)

**Funções de escrita:**
- `inicializar(uint256 totalCotas, uint256 precoPorCota, address complianceModule, address identityRegistry)` — chamada uma única vez pela `PropertyFactory` no deploy.
- `comprarCotas(uint256 quantidade)` — investidor compra na emissão primária; reverte se `quantidade` exceder cotas disponíveis (RF-09) ou se `!isVerified(msg.sender)`.
- `transfer(address para, uint256 quantidade)` / `transferFrom(...)` — segue interface ERC-20, mas consulta `ComplianceModule.canTransfer` antes de mover saldo.
- `pausar()` / `retomar()` — apenas `PLATFORM_ADMIN_ROLE`, para contenção emergencial.

**Funções de leitura:**
- `balanceOf(address carteira) → uint256`
- `cotasDisponiveis() → uint256`
- `precoPorCota() → uint256`
- `totalSupply() → uint256`

**Eventos:**
- `CotasCompradas(address investidor, uint256 quantidade, uint256 valorPago)`
- `Transfer(address de, address para, uint256 quantidade)` (padrão ERC-20)
- `Pausado()` / `Retomado()`

## Invariantes
- `totalSupply` nunca excede o número de cotas definido na inicialização.
- Soma de todos os `balanceOf` sempre é igual a `totalSupply` (nenhum token "perdido" ou criado fora do fluxo de mint).
- Nenhuma transferência é concluída sem `ComplianceModule.canTransfer` retornar `true`.
- `comprarCotas` é tudo-ou-nada: nunca credita quantidade parcial da solicitada (RF-09).

## Cenários de aceite (Dado/Quando/Então)
Ver tabela completa em `../spec.md`. Cenários adicionais específicos do contrato:

| Cenário | Dado | Quando | Então |
|---|---|---|---|
| Pausa emergencial | Contrato pausado por `PLATFORM_ADMIN_ROLE` | Qualquer `transfer`/`comprarCotas` é chamado | Transação reverte até `retomar()` ser chamado |
| Reentrancy em `comprarCotas` | Investidor malicioso tenta reentrar via hook de compliance | `comprarCotas` é chamado | Estado (saldo, cotas disponíveis) já foi atualizado antes de qualquer chamada externa (CEI); reentrada não duplica crédito |

## Riscos de segurança específicos
- **SEC-01 (reentrancy)**: `comprarCotas` e `transfer` seguem Checks-Effects-Interactions; `ReentrancyGuard` aplicado onde há chamada externa (consulta ao `ComplianceModule`).
- **SEC-02 (access control)**: `pausar`/`retomar`/`inicializar` restritos por role.
- **SEC-03 (overflow)**: Solidity ≥0.8; sem blocos `unchecked` em contagem de cotas.

## Referências
- Interface base ERC-20 (OpenZeppelin) + extensões de compliance no padrão ERC-3643.
- OpenZeppelin `AccessControl`, `Pausable`, `ReentrancyGuard`.
