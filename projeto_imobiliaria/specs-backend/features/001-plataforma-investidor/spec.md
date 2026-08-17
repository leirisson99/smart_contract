---
status: draft
owner: tech-lead
last_updated: 2026-08-17
---

# Feature Backend 001 — Plataforma do Investidor (API e serviços off-chain)

Origem: pitch slide 4 (jornada completa do investidor) e slide 8 (painel do gestor). Contraparte de API/serviço de [`specs-frontend/features/001-interface-investidor`](../../../specs-frontend/features/001-interface-investidor/spec.md) — este documento cobre o que o backend faz, não como é exibido.

## Objetivo
Fornecer a camada de serviço (custódia, orquestração de KYC, execução de transações on-chain em nome do investidor, armazenamento de dados pessoais) que sustenta a experiência prometida no pitch ("Carteira criada automaticamente — sem conhecimento técnico", slide 4), consumida pela interface (`specs-frontend`).

## Personas
- **Investidor**: suas ações na interface (`specs-frontend`) se traduzem em chamadas a este backend.
- **Gestor da SPE / administrador**: suas ações no painel (`specs-frontend`) acionam os endpoints administrativos deste backend.

## Requisitos funcionais

| ID | Requisito |
|---|---|
| RF-21 | O backend deve criar automaticamente uma carteira digital custodial para o investidor no momento do cadastro, sem exigir que ele gerencie chaves privadas (slide 4, passo 2). |
| RF-22 | O backend deve expor um endpoint que retorna os dados do imóvel disponível (valor, cotas restantes, rendimento estimado) e um endpoint que assina e envia a transação `comprarCotas` (`specs/features/002-tokenizacao-imovel`) em nome da carteira custodial do investidor. |
| RF-23 | O backend deve expor um endpoint de leitura do portfólio do investidor: cotas possuídas, valor investido, histórico de rendimentos recebidos e pendentes. |
| RF-24 | O backend deve executar automaticamente o `claim` de rendimentos disponíveis em nome do investidor (via carteira custodial, job periódico), refletindo a promessa de "automático" (ADR-0004). |
| RF-25 | O backend deve expor endpoints administrativos para o gestor: criar imóvel (aciona `PropertyFactory`), depositar rendimento mensal (aciona `DividendDistributor`), e consultar status de KYC dos investidores. |
| RF-26 | O backend deve armazenar dados pessoais de KYC (CPF, documentos) em banco de dados próprio, sujeito à LGPD, nunca on-chain (ADR-0006). |

## Requisitos não funcionais
- **RNF-10 (LGPD)**: dados pessoais armazenados com controles de acesso e retenção conforme legislação brasileira.
- **RNF-11 (custódia de chaves)**: chaves privadas das carteiras custodiais geridas com práticas de segurança adequadas (HSM ou equivalente) — fora do escopo de contratos on-chain, mas crítico para a segurança geral do sistema.
- **RNF-16 (última linha de defesa)**: todo endpoint que executa uma ação de negócio revalida compliance/saldo/KYC no momento da chamada, nunca confiando apenas na validação já feita pela interface (`specs-frontend`).

## Cenários de aceite

| Cenário | Dado | Quando | Então |
|---|---|---|---|
| Cadastro cria carteira | Novo investidor completa cadastro | Backend processa o cadastro | Uma carteira custodial é criada e associada ao investidor, sem exigir nenhuma ação técnica dele |
| Compra via endpoint | Investidor com KYC aprovado chama o endpoint de compra | Backend recebe a chamada | Backend assina e envia a transação `comprarCotas` (`specs/features/002-tokenizacao-imovel`) usando a carteira custodial do investidor |
| Claim automático | Rendimento disponível para o investidor (`specs/features/003-distribuicao-rendimentos`) | Job periódico da plataforma roda | Backend executa `claim` em nome do investidor; endpoint de portfólio passa a refletir o valor recebido |
| Endpoint administrativo | Gestor autenticado chama o endpoint de depósito de rendimento | Backend recebe a chamada com role validada | Backend aciona `DividendDistributor.depositarRendimento`; retorna confirmação estruturada |

## Fora de escopo desta feature
- Telas, layout e interações visuais — cobertos por [`specs-frontend/features/001-interface-investidor`](../../../specs-frontend/features/001-interface-investidor/spec.md).
- Integração com gateway de pagamento fiat específico (decisão de parceria comercial, ver `specs/features/002-tokenizacao-imovel/plan.md`).
