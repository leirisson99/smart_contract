---
status: approved
owner: time-fundador
last_updated: 2026-08-17
---

# Guia de Conhecimentos para Acompanhar o Projeto

Este guia é para quem vai **acompanhar e tomar decisões** sobre o projeto (revisar specs, conversar com desenvolvedores e auditores, avaliar riscos) — não necessariamente para quem vai **escrever o código**. Por isso, cada conceito traz um nível de profundidade sugerido:

- 🟢 **Essencial** — você precisa entender o suficiente para explicar com suas próprias palavras e identificar se algo está errado.
- 🟡 **Recomendado** — ajuda a fazer perguntas melhores e entender decisões técnicas, mas dá para acompanhar sem dominar.
- ⚪ **Opcional** — só necessário se você (ou alguém do seu time) for efetivamente programar os contratos.

Cada item indica em qual documento do pacote de specs ele aparece, para você já ir direto à fonte.

---

## A) Fundamentos de blockchain

### 1. Blockchain e rede descentralizada 🟢
Um banco de dados replicado em milhares de computadores (nós), onde nenhuma entidade única controla ou pode alterar unilateralmente os registros já confirmados.
**Por que precisa:** é a base de toda promessa do pitch — "transparência total pelo blockchain" (slide 6). Sem entender isso, é difícil avaliar por que o projeto troca burocracia de cartório por um registro público e imutável.

### 2. Carteira digital (wallet) e chave privada 🟢
Uma carteira é um par de chaves criptográficas: a chave privada assina transações (prova que você é o dono), o endereço público é como uma "conta" visível a todos. Quem controla a chave privada controla os ativos.
**Por que precisa:** o pitch promete "carteira criada automaticamente — sem conhecimento técnico" (slide 4). Isso só é possível porque a plataforma usa **carteiras custodiais** (a plataforma guarda a chave em nome do investidor) — decisão registrada como non-goal explícito da POC em [`specs/00-constitution.md`](00-constitution.md) e detalhada em `RNF-11` de [`specs-backend/features/001-plataforma-investidor/spec.md`](../specs-backend/features/001-plataforma-investidor/spec.md). Entender a diferença entre custodial e não-custodial é necessário para avaliar o risco operacional de quem guarda essas chaves.

### 3. Transação e gas 🟢
Toda ação que muda o estado da blockchain (transferir um token, criar um contrato) é uma "transação", que precisa pagar uma taxa chamada "gas" — o preço de usar a capacidade computacional da rede.
**Por que precisa:** gas é citado como critério de decisão em vários ADRs (ex.: [ADR-0002](decisions/ADR-0002-rede-polygon.md) escolhe Polygon exatamente por causa do custo de gas ser baixo, viabilizando o `claim` mensal de dividendos por até 20+ investidores). Sem entender gas, decisões de arquitetura como "pull vs push" ([ADR-0004](decisions/ADR-0004-modelo-distribuicao-rendimentos.md)) parecem arbitrárias.

### 4. Contrato inteligente (smart contract) 🟢
Um programa que roda na blockchain, com regras fixas e visíveis publicamente, que executa automaticamente quando chamado — não pode ser "convencido" a agir fora do que está programado.
**Por que precisa:** é literalmente o produto do pitch ("cada token é um smart contract" — slide 3). Toda a pasta `specs/features/*/contracts/` descreve o comportamento desses programas antes de serem escritos.

### 5. Rede EVM, Polygon, testnet vs. mainnet 🟡
EVM (Ethereum Virtual Machine) é o "motor" que executa contratos inteligentes; Polygon é uma rede compatível com EVM, mais barata que a rede principal do Ethereum. Testnet é um ambiente de testes com dinheiro fictício; mainnet é a rede real com valor real.
**Por que precisa:** o roadmap ([`specs/roadmap.md`](roadmap.md)) só autoriza deploy em **mainnet** na Fase 4, depois de auditoria — antes disso tudo roda em **testnet (Amoy)**. Se alguém falar em "subir para mainnet" antes da auditoria estar concluída, isso deveria soar um alarme para você.

---

## B) Tokens e tokenização

### 6. Token vs. criptomoeda 🟢
Criptomoeda (como Bitcoin) tem sua própria blockchain; token é criado *sobre* uma blockchain já existente (ex.: sobre a Polygon), seguindo um padrão que define como ele se comporta.
**Por que precisa:** as "cotas" do imóvel (slide 3) são tokens sobre a Polygon, não uma criptomoeda nova — isso simplifica a regulação e a distribuição.

### 7. ERC-20 (padrão básico de token) 🟡
Um conjunto padronizado de funções (`balanceOf`, `transfer`, `totalSupply`...) que todo token "fungível" simples segue, permitindo que carteiras e exchanges saibam como interagir com ele sem código customizado.
**Por que precisa:** o padrão escolhido para o projeto, ERC-3643, é compatível com essa interface básica — entender ERC-20 é o alicerce para entender por que ERC-3643 foi escolhido em vez dele puro (ver [ADR-0001](decisions/ADR-0001-padrao-token-erc-3643.md)).

### 8. Security token / RWA (Real World Asset) 🟢
Um token que representa um ativo real regulado (imóvel, ação, recebível) e, por isso, precisa de restrições de quem pode possuí-lo (diferente de um token totalmente livre, como a maioria das criptomoedas).
**Por que precisa:** é a categoria exata do produto do pitch. Entender essa diferença explica por que o projeto precisa de KYC embutido no próprio token (feature `001-identidade-kyc`), e não apenas na plataforma.

### 9. Identity Registry, Trusted Issuer, Claim (conceitos do ERC-3643) 🟢
- **Identity Registry**: registro on-chain de quais carteiras têm identidade verificada.
- **Trusted Issuer**: entidade autorizada a atestar essa verificação (ex.: o provedor de KYC).
- **Claim**: o "carimbo" assinado pelo Trusted Issuer, registrado on-chain, sem expor dados pessoais.
**Por que precisa:** é o mecanismo central que torna o projeto compatível com KYC sem violar a LGPD. Está detalhado em [`specs/features/001-identidade-kyc/contracts/identity-registry.md`](features/001-identidade-kyc/contracts/identity-registry.md) e na decisão [ADR-0006](decisions/ADR-0006-fronteira-onchain-offchain-kyc.md). Sem esse conceito, é difícil entender por que o CPF do investidor nunca aparece na blockchain.

### 10. Stablecoin e on/off-ramp 🟡
Stablecoin é um token cujo valor é atrelado a uma moeda fiduciária (ex.: 1 token = 1 dólar/real). On-ramp/off-ramp é a conversão entre dinheiro tradicional (PIX, cartão) e ativos cripto.
**Por que precisa:** é uma **decisão em aberto** do projeto — [`specs/features/002-tokenizacao-imovel/plan.md`](features/002-tokenizacao-imovel/plan.md) registra que a moeda de liquidação da compra de cotas (stablecoin vs. BRL) ainda não está travada, e isso depende de uma parceria comercial de on/off-ramp que também aparece como pergunta em aberto no pitch (slide 8).

---

## C) Segurança de smart contracts

### 11. Auditoria de smart contracts 🟢
Revisão especializada e paga, feita por uma empresa terceira, que analisa o código em busca de vulnerabilidades antes do deploy em mainnet — é o equivalente a uma inspeção estrutural antes de habitar um prédio.
**Por que precisa:** é um marco obrigatório e bloqueante no roadmap (Fase 2 e pré-requisito da Fase 4 em [`specs/roadmap.md`](roadmap.md)). Você vai precisar orçar e contratar isso — é citado no modelo de negócio como parte do "custo inicial" (SWOT, Fraquezas, slide 6).

### 12. Vulnerabilidades comuns: reentrancy, controle de acesso, overflow, front-running, DoS 🟡
- **Reentrancy**: um contrato malicioso "reentra" numa função antes dela terminar, duplicando efeitos (ex.: sacar duas vezes).
- **Controle de acesso (access control)**: garantir que só quem tem permissão execute funções sensíveis (mint, pausar, criar imóvel).
- **Overflow/underflow**: erro aritmético que pode gerar números absurdos (mitigado por padrão em Solidity moderno).
- **Front-running/MEV**: alguém "fura a fila" observando uma transação pendente e agindo antes dela para lucrar.
- **DoS (negação de serviço)**: uma ação de um único usuário trava o sistema para todos os outros.
**Por que precisa:** são exatamente os itens do [`specs/security-checklist.md`](security-checklist.md) (SEC-01 a SEC-12), que é o critério de saída antes de contratar a auditoria. Você não precisa saber corrigir esses problemas, mas precisa reconhecer os nomes quando o time técnico ou o auditor reportar um finding.

### 13. Upgradability (contrato imutável vs. atualizável) 🟡
Contratos "imutáveis" nunca podem ser alterados depois do deploy; contratos "upgradeable" usam um mecanismo (proxy) que permite trocar a lógica mantendo o mesmo endereço — com o trade-off de exigir mais confiança em quem controla essa atualização.
**Por que precisa:** o projeto decidiu por contratos imutáveis por imóvel na POC ([ADR-0005](decisions/ADR-0005-estrategia-upgradability.md)) — ou seja, um bug encontrado depois do deploy não pode ser corrigido no mesmo contrato, só contido e substituído. Isso é uma decisão de risco que vale a pena você entender e poder explicar a um investidor.

### 14. Multisig 🟡
Uma carteira que exige múltiplas assinaturas (ex.: 3 de 5 pessoas) para autorizar uma ação sensível, em vez de depender de uma única chave.
**Por que precisa:** é a mitigação recomendada em várias funções administrativas críticas (criação de imóvel, depósito de rendimento, gestão de Trusted Issuers) espalhadas pelo `security-checklist.md` e pelos `risks.md` de cada feature — decidir quem faz parte desse multisig é uma decisão de governança sua, não só técnica.

---

## D) Metodologia de engenharia usada neste projeto

### 15. Spec-Driven Development (SDD) 🟢
Metodologia onde a especificação (documento detalhado do comportamento esperado) é escrita e aprovada *antes* de qualquer código — o código é só a implementação de uma spec já validada, nunca o contrário.
**Por que precisa:** é a estrutura de todo o pacote em `specs/` que construímos. Acompanhar o projeto, na prática, significa revisar e aprovar `spec.md` de cada feature conforme ele evolui de `draft` para `approved` — esse é o seu principal ponto de controle antes que qualquer linha de código exista.

### 16. Test-Driven Development (TDD) e pirâmide de testes 🟡
Prática de escrever o teste antes do código (o teste começa falhando — "red" — depois o código mínimo necessário o faz passar — "green" — depois o código é melhorado — "refactor"). A "pirâmide de testes" organiza tipos de teste por volume: muitos testes unitários pequenos e rápidos na base, poucos testes end-to-end/fork no topo.
**Por que precisa:** cada `test-strategy.md` (ex.: [`specs/features/001-identidade-kyc/test-strategy.md`](features/001-identidade-kyc/test-strategy.md)) define essa pirâmide para cada feature. Você não precisa escrever os testes, mas entender a lógica te ajuda a cobrar do time: "esse contrato tem teste de fuzz? tem teste de invariante?" antes de aceitar que uma feature está pronta.

### 17. ADR (Architecture Decision Record) 🟢
Um documento curto que registra uma decisão técnica importante, o contexto que a motivou, as alternativas consideradas e as consequências aceitas — para que ninguém precise "adivinhar" por que algo foi feito de um certo jeito meses depois.
**Por que precisa:** os 6 ADRs em [`specs/decisions/`](decisions/) já tomaram decisões que afetam diretamente o pitch (ex.: trocar ERC-1400 por ERC-3643). São o lugar certo para você questionar ou validar escolhas técnicas sem precisar entender a implementação inteira.

### 18. Git e controle de versão 🟡
Sistema que guarda o histórico de todas as mudanças em um projeto (quem mudou o quê e quando), permitindo reverter erros e trabalhar em paralelo sem sobrescrever o trabalho de outros.
**Por que precisa:** todo o pacote de specs (e futuramente o código) vive em um repositório Git. Mesmo sem programar, entender o básico (commit, branch, pull request) ajuda você a acompanhar o histórico de decisões e revisar mudanças antes delas serem incorporadas.

---

## E) Regulação e compliance (Brasil)

### 19. CVM e Instrução CVM 588 🟢
A Comissão de Valores Mobiliários regula ofertas de investimento ao público no Brasil. A Instrução 588 trata especificamente de ofertas públicas via plataformas eletrônicas de investimento participativo (crowdfunding) — um caminho regulatório provável para oferecer as cotas a investidores de varejo.
**Por que precisa:** é citado como Fraqueza no SWOT do pitch ("Regulação CVM exige estruturação jurídica", slide 6) e é pré-requisito bloqueante da Fase 1 do roadmap (semanas 1-4, [`specs/roadmap.md`](roadmap.md)). Sem constituir esse enquadramento, a captação de investidores de varejo pode ser ilegal.

### 20. Lei 14.478/22 (marco legal de criptoativos) 🟡
Lei brasileira que regula prestadoras de serviços de ativos virtuais e coloca a supervisão sob o Banco Central.
**Por que precisa:** citada como Oportunidade regulatória no pitch (slide 6) e referenciada em [`specs/00-constitution.md`](00-constitution.md) como um dos marcos legais que o projeto busca respeitar.

### 21. SPE (Sociedade de Propósito Específico) 🟢
Uma empresa criada especificamente para deter um único ativo ou projeto (aqui, o imóvel piloto), isolando riscos jurídicos e financeiros do restante do negócio.
**Por que precisa:** é a entidade que juridicamente "possui" o imóvel por trás do token — sua constituição é o primeiro marco do roadmap (Fase 1, semanas 1-4). Sem a SPE, não há lastro jurídico para o que o token representa.

### 22. KYC/AML (Know Your Customer / Anti-Money Laundering) 🟢
Processo de verificar a identidade de um cliente (KYC) e monitorar transações suspeitas de lavagem de dinheiro (AML) — exigência legal para qualquer produto financeiro regulado.
**Por que precisa:** é o primeiro passo da jornada do investidor no pitch (slide 4) e a feature técnica `001-identidade-kyc` inteira existe para implementar isso on-chain sem violar privacidade.

### 23. LGPD (Lei Geral de Proteção de Dados) 🟢
Lei brasileira que regula como dados pessoais podem ser coletados, armazenados e usados.
**Por que precisa:** é o motivo direto pelo qual CPF e documentos **nunca** vão para a blockchain (decisão em [ADR-0006](decisions/ADR-0006-fronteira-onchain-offchain-kyc.md)) — violar isso é risco jurídico grave, não só técnico.

---

## F) Negócio e operação

### 24. Custódia (custodial vs. não-custodial) 🟢
Custodial = a plataforma guarda as chaves privadas em nome do usuário (mais simples para quem não entende cripto, mas concentra responsabilidade e risco na plataforma). Não-custodial = o próprio usuário guarda suas chaves (mais controle, mais responsabilidade e complexidade para ele).
**Por que precisa:** o projeto escolheu o modelo custodial para atender a promessa de "sem conhecimento técnico" (slide 4) — isso significa que a segurança da guarda de chaves da própria plataforma se torna um risco operacional crítico que você precisa cobrar (RNF-11 em [`specs-backend/features/001-plataforma-investidor/spec.md`](../specs-backend/features/001-plataforma-investidor/spec.md)).

### 25. Liquidez e mercado secundário 🟢
Liquidez é a facilidade de converter um ativo em dinheiro rapidamente. Mercado secundário é onde investidores compram/vendem entre si (diferente da compra direta do emissor, que é o mercado primário).
**Por que precisa:** é uma das três dores centrais do pitch ("baixa liquidez", slide 2) e a razão de existir da feature `004-mercado-secundario`. Entender o conceito ajuda a avaliar se o desenho simplificado (preço fixo, sem order book) é suficiente para o volume da POC.

### 26. Modelo de taxas (fee model) 🟡
Como o negócio cobra pelo serviço: aqui, taxa de emissão (uma vez, na tokenização), taxa de transação (a cada negociação no mercado secundário) e taxa de administração (recorrente, pela gestão do imóvel).
**Por que precisa:** é o modelo de receita apresentado no slide 5 do pitch, e a taxa de transação é literalmente cobrada dentro do contrato `Marketplace` ([`specs/features/004-mercado-secundario/contracts/marketplace.md`](features/004-mercado-secundario/contracts/marketplace.md)) — ou seja, uma decisão de negócio que virou uma linha de código.

---

## Trilha de estudo sugerida

Se você quiser estudar antes das próximas reuniões técnicas, essa é uma ordem razoável:

1. Conceitos 1-5 (fundamentos de blockchain) — base para tudo o resto.
2. Conceitos 6-10 (tokens) — para entender o produto em si.
3. Conceitos 19-23 (regulação) — para acompanhar a Fase 1 do roadmap, que já está em andamento no cronograma.
4. Conceitos 15-17 (SDD/TDD/ADR) — para saber como ler e cobrar o pacote de specs.
5. Conceitos 11-14 (segurança) — para acompanhar a Fase 2 e a auditoria.
6. Conceitos 24-26 (negócio/operação) — já deve estar familiar pelo próprio pitch, mas ajuda a conectar com a implementação técnica.

Nenhum desses conceitos exige que você aprenda a programar em Solidity — isso fica a cargo do time técnico. O objetivo aqui é te dar vocabulário e critério suficientes para ler as specs, participar das decisões registradas nos ADRs, e fazer as perguntas certas ao time técnico e aos auditores.
