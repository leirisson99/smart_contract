---
status: draft
owner: tech-lead
last_updated: 2026-08-17
---

# Estratégia de Testes — Feature Frontend 001

Esta feature é 100% off-chain e não usa Foundry (ADR-0003 cobre só os contratos); a estratégia aqui cobre a camada de interface.

## Testes de componente/unidade
- Renderização correta dos estados de cada tela (vazio, carregando, erro, sucesso) — RF-27 a RF-31.
- Formulário de cadastro/KYC valida campos obrigatórios antes de enviar ao backend.
- Tradução de códigos de erro do backend em mensagens amigáveis (RF-32) — testar todos os códigos de erro conhecidos (`SEM_KYC`, `COTAS_INSUFICIENTES`, `LISTAGEM_INDISPONIVEL`, etc.).

## Testes de integração com o backend
- Mock do backend: fluxo de compra completo (seleção de quantidade → confirmação → estado "processando" → estado "confirmado").
- Mock do backend retornando erro de compliance: interface exibe mensagem correta sem quebrar o fluxo para outras ações.
- Painel do gestor: criação de imóvel e depósito de rendimento refletem no restante da interface (ex.: novo imóvel aparece na listagem).

## Testes end-to-end (ambiente de testnet, backend real)
- Fluxo completo do investidor: cadastro → KYC aprovado → compra de cota → visualização no portfólio → recebimento de rendimento após ciclo do gestor.
- Fluxo do mercado secundário: criar listagem → outro investidor compra → portfólio de ambos atualizado.

## Testes não funcionais
- Acessibilidade (RNF-14): navegação por teclado e contraste mínimo nas telas principais.
- Responsividade (RNF-13): telas principais utilizáveis em viewport mobile.
- Ausência de termos on-chain na jornada principal (RNF-12): checagem de que nenhuma tela padrão exibe endereço de contrato, hash de transação ou termo de gas fora de uma seção avançada opcional.

## Critério de saída
Todos os cenários de `spec.md` cobertos por teste de componente e/ou end-to-end; nenhum código de erro do backend chega ao usuário sem tradução (RF-32).
