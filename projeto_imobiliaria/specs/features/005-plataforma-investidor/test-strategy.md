---
status: draft
owner: tech-lead
last_updated: 2026-08-17
---

# Estratégia de Testes — Feature 005

Esta feature é predominantemente off-chain (backend/frontend); não usa Foundry diretamente, mas depende dos contratos das features `001` a `004` já testados. A estratégia aqui cobre a camada de integração.

## Testes de integração backend ↔ contratos
- Backend consegue assinar e enviar `comprarCotas` em nome de uma carteira custodial e refletir o resultado no portfólio.
- Job de claim automático identifica corretamente todos os investidores com `valorReivindicavel > 0` e executa `claim` para cada um.
- Falha de uma transação on-chain (ex.: revert de compliance) é tratada e exibida de forma compreensível ao investidor, sem quebrar o fluxo para outros usuários.

## Testes end-to-end (ambiente de testnet)
- Fluxo completo: cadastro → KYC aprovado → compra de cota → depósito de rendimento pelo gestor → claim automático → saldo refletido no portfólio.
- Fluxo de mercado secundário: listagem → compra por outro investidor → saldo atualizado em ambos os portfólios.

## Testes de segurança específicos da camada off-chain
- Dados de PII nunca trafegam em payload de transação on-chain (verificação de que apenas endereços/claims categóricas são enviados aos contratos).
- Controle de acesso do painel do gestor (RF-25) — apenas usuários com papel de admin acessam funções que acionam `PropertyFactory`/`DividendDistributor`.

## Critério de saída
Todos os cenários de `spec.md` cobertos por teste de integração ou end-to-end; nenhuma PII identificada em payloads on-chain durante os testes.
