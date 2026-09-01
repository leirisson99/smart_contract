---
status: draft
owner: tech-lead
last_updated: 2026-08-17
---

# Contrato: Marketplace

## Responsabilidades
- Manter listagens ativas de cotas à venda, com escrow das cotas do vendedor.
- Executar compra (total ou parcial) a preço fixo, respeitando compliance.
- Cobrar taxa de transação (0.5-2%, modelo de negócio do pitch slide 5) sobre cada compra executada.

## Interface esperada (sem código)

**Funções de escrita:**
- `listar(address propertyToken, uint256 quantidade, uint256 precoPorCota)` — transfere `quantidade` cotas do vendedor para escrow no `Marketplace`; retorna/emite `idListagem`.
- `cancelar(uint256 idListagem)` — apenas o dono da listagem; devolve cotas em escrow ao vendedor.
- `comprar(uint256 idListagem, uint256 quantidade)` — comprador verificado adquire `quantidade` (≤ quantidade disponível na listagem); reverte se `!isVerified(msg.sender)`.

**Funções de leitura:**
- `listagem(uint256 idListagem) → (vendedor, propertyToken, quantidadeDisponivel, precoPorCota, ativa)`.
- `listagensAtivasPorToken(address propertyToken) → uint256[]`.
- `taxaTransacao() → uint256` (basis points).

**Eventos:**
- `ListagemCriada(uint256 idListagem, address vendedor, address propertyToken, uint256 quantidade, uint256 precoPorCota)`
- `ListagemCancelada(uint256 idListagem)`
- `CompraExecutada(uint256 idListagem, address comprador, uint256 quantidade, uint256 valorPago, uint256 taxaCobrada)`

## Invariantes
- Cotas em escrow de uma listagem só saem do `Marketplace` por `cancelar` (volta ao vendedor) ou `comprar` (vai ao comprador) — nunca ficam "presas" sem caminho de saída.
- Toda transferência de cota executada pelo `Marketplace` passa pelo mesmo `ComplianceModule.canTransfer` que a emissão primária (RF-19).
- Uma listagem cancelada ou totalmente comprada não pode ser comprada novamente.
- `comprar` nunca transfere mais cotas do que `quantidadeDisponivel` da listagem.

## Cenários de aceite (Dado/Quando/Então)
Ver tabela completa em `../spec.md`.

## Riscos de segurança específicos
- **SEC-04 (front-running/MEV)**: preço fixo por listagem elimina a maior parte da superfície de MEV típica de order books/AMMs; ainda assim, duas compras concorrentes pela mesma listagem no mesmo bloco devem ser resolvidas de forma determinística (primeira transação a ser minerada consome a quantidade disponível; a segunda ajusta automaticamente para o restante ou reverte se nada restar — comportamento a especificar em teste).
- **SEC-01 (reentrancy)**: `comprar` e `cancelar` seguem CEI — estado da listagem atualizado antes de qualquer transferência de token/valor.
- **SEC-08 (bypass de compliance)**: `comprar` nunca transfere cotas diretamente por `PropertyToken.transferFrom` sem passar pela checagem de compliance — usa o mesmo caminho de `transfer` que qualquer outra movimentação.

## Referências
- OpenZeppelin `ReentrancyGuard`.
- ADR-0004 (mesma lógica de segurança contra DoS aplicada aqui: nenhuma função itera sobre uma lista não limitada de listagens de terceiros).
