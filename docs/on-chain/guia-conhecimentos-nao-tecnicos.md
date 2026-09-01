---
status: approved
owner: time-fundador
last_updated: 2026-08-17
---

# Guia de Conhecimentos Não Técnicos para Acompanhar o Projeto

Este guia é para quem vai **acompanhar e tomar decisões** sobre o projeto (revisar specs, conversar com desenvolvedores e auditores, avaliar riscos) — não necessariamente para quem vai **escrever o código**. Por isso, cada conceito traz um nível de profundidade sugerido:

- 🟢 **Essencial** — você precisa entender o suficiente para explicar com suas próprias palavras e identificar se algo está errado.
- 🟡 **Recomendado** — ajuda a fazer perguntas melhores e entender decisões técnicas, mas dá para acompanhar sem dominar.
- ⚪ **Opcional** — só necessário se você (ou alguém do seu time) for efetivamente programar os contratos.

Cada item indica em qual documento do pacote de specs ele aparece, para você já ir direto à fonte.

Este documento cobre **regulação, compliance e modelo de negócio**. Para os fundamentos técnicos (blockchain, tokens, segurança, metodologia de engenharia), veja [`guia-conhecimentos-tecnicos.md`](guia-conhecimentos-tecnicos.md).

---

## A) Regulação e compliance (Brasil)

### 1. CVM e Instrução CVM 588 🟢
A Comissão de Valores Mobiliários regula ofertas de investimento ao público no Brasil. A Instrução 588 trata especificamente de ofertas públicas via plataformas eletrônicas de investimento participativo (crowdfunding) — um caminho regulatório provável para oferecer as cotas a investidores de varejo.
**Por que precisa:** é citado como Fraqueza no SWOT do pitch ("Regulação CVM exige estruturação jurídica", slide 6) e é pré-requisito bloqueante da Fase 1 do roadmap (semanas 1-4, [`roadmap.md`](roadmap.md)). Sem constituir esse enquadramento, a captação de investidores de varejo pode ser ilegal.

### 2. Lei 14.478/22 (marco legal de criptoativos) 🟡
Lei brasileira que regula prestadoras de serviços de ativos virtuais e coloca a supervisão sob o Banco Central.
**Por que precisa:** citada como Oportunidade regulatória no pitch (slide 6) e referenciada em [`00-constitution.md`](00-constitution.md) como um dos marcos legais que o projeto busca respeitar.

### 3. SPE (Sociedade de Propósito Específico) 🟢
Uma empresa criada especificamente para deter um único ativo ou projeto (aqui, o imóvel piloto), isolando riscos jurídicos e financeiros do restante do negócio.
**Por que precisa:** é a entidade que juridicamente "possui" o imóvel por trás do token — sua constituição é o primeiro marco do roadmap (Fase 1, semanas 1-4). Sem a SPE, não há lastro jurídico para o que o token representa.

### 4. KYC/AML (Know Your Customer / Anti-Money Laundering) 🟢
Processo de verificar a identidade de um cliente (KYC) e monitorar transações suspeitas de lavagem de dinheiro (AML) — exigência legal para qualquer produto financeiro regulado.
**Por que precisa:** é o primeiro passo da jornada do investidor no pitch (slide 4) e a feature técnica `001-identidade-kyc` inteira existe para implementar isso on-chain sem violar privacidade.

### 5. LGPD (Lei Geral de Proteção de Dados) 🟢
Lei brasileira que regula como dados pessoais podem ser coletados, armazenados e usados.
**Por que precisa:** é o motivo direto pelo qual CPF e documentos **nunca** vão para a blockchain (decisão em [ADR-0006](decisions/ADR-0006-fronteira-onchain-offchain-kyc.md)) — violar isso é risco jurídico grave, não só técnico.

---

## B) Negócio e operação

### 6. Custódia (custodial vs. não-custodial) 🟢
Custodial = a plataforma guarda as chaves privadas em nome do usuário (mais simples para quem não entende cripto, mas concentra responsabilidade e risco na plataforma). Não-custodial = o próprio usuário guarda suas chaves (mais controle, mais responsabilidade e complexidade para ele).
**Por que precisa:** o projeto escolheu o modelo custodial para atender a promessa de "sem conhecimento técnico" (slide 4) — isso significa que a segurança da guarda de chaves da própria plataforma se torna um risco operacional crítico que você precisa cobrar (RNF-11 em [`../backend/features/001-onboarding-e-custodia/spec.md`](../backend/features/001-onboarding-e-custodia/spec.md), repositório irmão `backend/`).

### 7. Liquidez e mercado secundário 🟢
Liquidez é a facilidade de converter um ativo em dinheiro rapidamente. Mercado secundário é onde investidores compram/vendem entre si (diferente da compra direta do emissor, que é o mercado primário).
**Por que precisa:** é uma das três dores centrais do pitch ("baixa liquidez", slide 2) e a razão de existir da feature `004-mercado-secundario`. Entender o conceito ajuda a avaliar se o desenho simplificado (preço fixo, sem order book) é suficiente para o volume da POC.

### 8. Modelo de taxas (fee model) 🟡
Como o negócio cobra pelo serviço: aqui, taxa de emissão (uma vez, na tokenização), taxa de transação (a cada negociação no mercado secundário) e taxa de administração (recorrente, pela gestão do imóvel).
**Por que precisa:** é o modelo de receita apresentado no slide 5 do pitch, e a taxa de transação é literalmente cobrada dentro do contrato `Marketplace` ([`features/004-mercado-secundario/contracts/marketplace.md`](features/004-mercado-secundario/contracts/marketplace.md)) — ou seja, uma decisão de negócio que virou uma linha de código.

---

## Trilha de estudo sugerida

Se você quiser estudar antes das próximas reuniões técnicas, essa é uma ordem razoável:

1. Conceitos 1-5 (regulação) — para acompanhar a Fase 1 do roadmap, que já está em andamento no cronograma.
2. Conceitos 6-8 (negócio/operação) — já deve estar familiar pelo próprio pitch, mas ajuda a conectar com a implementação técnica.

Nenhum desses conceitos exige que você aprenda a programar em Solidity — isso fica a cargo do time técnico. O objetivo aqui é te dar vocabulário e critério suficientes para ler as specs, participar das decisões registradas nos ADRs, e fazer as perguntas certas ao time técnico e aos auditores.

Para os fundamentos técnicos (blockchain, tokens, segurança de smart contracts, metodologia de engenharia), continue em [`guia-conhecimentos-tecnicos.md`](guia-conhecimentos-tecnicos.md).
