---
status: draft
owner: tech-lead
last_updated: 2026-08-17
---

# Feature Frontend 001 — Interface do Investidor e do Gestor

Origem: pitch slide 4 (jornada completa do investidor) e slide 8 (painel do gestor). Contraparte de UI do backend ([`../../../backend/features`](../../../backend/features), repositório irmão `backend/`, 5 features) — o frontend nunca fala diretamente com os contratos on-chain; toda ação passa pelo backend (ver `integration.md` desta feature).

## Objetivo
Entregar a experiência visual e interativa que torna as features on-chain (`../../../on-chain/features/001` a `004`) acessíveis a um investidor sem conhecimento técnico de blockchain, conforme prometido no pitch ("sem conhecimento técnico", slide 4).

## Personas
- **Investidor**: usa a interface para se cadastrar, investir, acompanhar portfólio e visualizar rendimentos.
- **Gestor da SPE / administrador**: usa o painel para criar imóveis, depositar rendimentos e acompanhar status de KYC.

## Requisitos funcionais

| ID | Requisito |
|---|---|
| RF-27 | A interface deve oferecer um formulário de cadastro e upload de documentos de KYC, exibindo o status da verificação (pendente / aprovado / reprovado) ao investidor. |
| RF-28 | A interface deve exibir o imóvel disponível (valor total, cotas restantes, preço por cota, rendimento estimado) e permitir escolher a quantidade de cotas e confirmar a compra. |
| RF-29 | A interface deve exibir o portfólio do investidor: cotas possuídas por imóvel, valor investido, histórico de rendimentos recebidos e rendimentos pendentes de claim. |
| RF-30 | A interface deve fornecer um painel para o gestor: formulário de criação de imóvel, formulário de depósito de rendimento mensal, e lista de investidores com status de KYC. |
| RF-31 | A interface deve exibir o mercado secundário: listagens ativas de cotas à venda, permitir ao investidor criar uma listagem de venda e comprar uma listagem existente. |
| RF-32 | A interface deve traduzir falhas retornadas pelo backend/contrato (ex.: "sem KYC", "cotas insuficientes", "listagem já vendida") em mensagens compreensíveis para um usuário não-técnico, e exibir estados de carregamento/confirmação durante o processamento de uma transação. |
| RF-40 | A interface deve oferecer uma tela de login sem senha (e-mail → código de acesso, [`../../../backend/features/006-autenticacao-investidor`](../../../backend/features/006-autenticacao-investidor/spec.md)) para o investidor que já tem cadastro, e redirecionar para essa tela ao tentar acessar uma área que exige sessão (ex. portfólio) sem estar autenticado. O cadastro (RF-27) continua autenticando automaticamente — este RF cobre só o retorno de quem já tem conta. |

## Requisitos não funcionais
- **RNF-12 (simplicidade para não-técnicos)**: nenhuma tela expõe termos on-chain (endereço de contrato, hash de transação, gas) na jornada principal do investidor — esses detalhes ficam disponíveis apenas em uma seção avançada/opcional.
- **RNF-13 (responsividade)**: interface utilizável em dispositivos móveis, já que o investidor de varejo tende a acessar primariamente pelo celular.
- **RNF-14 (acessibilidade)**: contraste e navegação por teclado conformes a diretrizes básicas de acessibilidade (WCAG AA como referência), por lidar com decisões financeiras.
- **RNF-15 (latência percebida)**: toda ação que dispara uma transação on-chain (compra, claim, listagem) deve exibir feedback imediato de "processando", já que a confirmação on-chain não é instantânea.

## Cenários de aceite

| Cenário | Dado | Quando | Então |
|---|---|---|---|
| Cadastro e KYC | Novo visitante acessa a interface | Preenche formulário e envia documentos | Interface exibe status "KYC em análise"; ao ser aprovado (assíncrono), status muda para "aprovado" sem exigir nova ação do investidor |
| Compra de cota | Investidor com KYC aprovado visualiza o imóvel | Escolhe quantidade e confirma compra | Interface exibe "processando" e, após confirmação do backend, atualiza o portfólio com as novas cotas |
| Erro de compliance traduzido | Investidor sem KYC aprovado tenta comprar (ex.: sessão expirada revalidada pelo backend) | Backend retorna erro de compliance | Interface exibe mensagem clara ("Sua verificação de identidade precisa ser concluída antes de investir"), não o erro técnico do contrato |
| Portfólio atualizado após claim | Investidor tem rendimento pendente | Job de claim automático do backend processa o pagamento | Na próxima visita à tela de portfólio, o valor aparece como recebido, com data do ciclo |
| Painel do gestor — novo imóvel | Gestor autenticado acessa o painel | Preenche nome, valor total e número de cotas, confirma | Interface exibe confirmação e o novo imóvel passa a aparecer na listagem para investidores |
| Mercado secundário | Investidor possui cotas de um imóvel | Cria uma listagem de venda com preço fixo | Listagem aparece para outros investidores verificados; investidor pode cancelar a qualquer momento antes da venda |
| Login sem sessão ativa | Investidor com cadastro existente, sem sessão válida (limpou dados do navegador, trocou de dispositivo) | Acessa a tela de login, informa e-mail e o código recebido | Interface autentica e o investidor volta a acessar seu portfólio/ações — sem precisar se cadastrar de novo |
| Acesso negado sem sessão | Visitante sem sessão válida | Tenta acessar diretamente uma área que exige sessão (ex. `/portfolio`) | Interface redireciona para a tela de login, preservando o destino original para depois de autenticar |

## Fora de escopo desta feature
- Design visual definitivo / wireframes de alta fidelidade (processo de produto separado; esta spec define comportamento, não layout).
- Qualquer validação de negócio que decida se uma ação é permitida — isso é sempre responsabilidade do backend/contrato (`../../../backend/features`); a interface só reflete o resultado.
- Lógica de assinatura de transação, custódia de chaves ou chamadas diretas a contratos — a interface nunca interage com a blockchain diretamente.
