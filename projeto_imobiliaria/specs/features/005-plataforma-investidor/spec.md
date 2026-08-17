---
status: draft
owner: tech-lead
last_updated: 2026-08-17
---

# Feature 005 — Plataforma do Investidor (off-chain)

Origem: pitch slide 4 (jornada completa do investidor) e slide 8 (painel do gestor).

## Objetivo
Entregar a experiência de usuário que torna as features on-chain (`001` a `004`) acessíveis a um investidor sem conhecimento técnico de blockchain, conforme prometido no pitch ("Carteira criada automaticamente — sem conhecimento técnico", slide 4).

## Personas
- **Investidor**: usa a plataforma para se cadastrar, investir, acompanhar portfólio e receber rendimentos.
- **Gestor da SPE / administrador**: usa o painel para criar imóveis, depositar rendimentos, gerenciar KYC.

## Requisitos funcionais

| ID | Requisito |
|---|---|
| RF-21 | O sistema deve criar automaticamente uma carteira digital custodial para o investidor no momento do cadastro, sem exigir que ele gerencie chaves privadas (slide 4, passo 2). |
| RF-22 | O sistema deve exibir o imóvel disponível, o rendimento estimado e permitir a compra de cotas diretamente pela interface (slide 4, passo 3), acionando a feature `002` on-chain. |
| RF-23 | O sistema deve exibir o portfólio do investidor: cotas possuídas, valor investido, histórico de rendimentos recebidos. |
| RF-24 | O sistema deve executar automaticamente o `claim` de rendimentos disponíveis em nome do investidor (via carteira custodial), refletindo a promessa de "automático" (ADR-0004). |
| RF-25 | O sistema deve fornecer um painel para o gestor: criar imóvel (aciona `PropertyFactory`), depositar rendimento mensal (aciona `DividendDistributor`), consultar status de KYC dos investidores. |
| RF-26 | O sistema deve armazenar dados pessoais de KYC (CPF, documentos) em banco de dados próprio, sujeito à LGPD, nunca on-chain (ADR-0006). |

## Requisitos não funcionais
- **RNF-10 (LGPD)**: dados pessoais armazenados com controles de acesso e retenção conforme legislação brasileira.
- **RNF-11 (custódia de chaves)**: chaves privadas das carteiras custodiais geridas com práticas de segurança adequadas (HSM ou equivalente) — fora do escopo de contratos on-chain, mas crítico para a segurança geral do sistema.

## Cenários de aceite

| Cenário | Dado | Quando | Então |
|---|---|---|---|
| Cadastro cria carteira | Novo investidor completa cadastro | Backend processa o cadastro | Uma carteira custodial é criada e associada ao investidor, sem exigir nenhuma ação técnica dele |
| Compra pela interface | Investidor com KYC aprovado navega até o imóvel | Investidor confirma compra de cotas na interface | Backend assina e envia a transação `comprarCotas` (feature 002) usando a carteira custodial do investidor |
| Claim automático | Rendimento disponível para o investidor (feature 003) | Job periódico da plataforma roda | Backend executa `claim` em nome do investidor; portfólio reflete o valor recebido |
| Painel do gestor | Gestor autenticado com papel de admin | Gestor deposita valor de aluguel do mês | Backend aciona `DividendDistributor.depositarRendimento`; confirmação exibida no painel |

## Fora de escopo desta feature
- Design visual/wireframes (tratado em processo de produto separado).
- Integração com gateway de pagamento fiat específico (decisão de parceria comercial, ver `002-tokenizacao-imovel/plan.md`).
