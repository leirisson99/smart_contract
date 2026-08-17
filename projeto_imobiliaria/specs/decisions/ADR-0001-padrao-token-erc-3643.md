---
status: approved
last_updated: 2026-08-17
---

# ADR-0001: Padrão de token — ERC-3643 no lugar de ERC-1400

## Status
approved

## Contexto
O pitch deck apresentado a investidores (slide 7) menciona ERC-1400 como padrão do smart contract. Ao especificar tecnicamente a solução, é preciso validar se essa é a melhor escolha disponível hoje para representar cotas fracionadas de um imóvel como security token, com restrições de transferência baseadas em KYC/compliance.

ERC-1400 foi proposto em 2018 como um "guarda-chuva" de sub-padrões (ERC-1410, ERC-1594, ERC-1643, ERC-1644) para security tokens. Na prática, a manutenção do padrão está fragmentada, poucas implementações de referência ativas existem, e a maior parte do mercado de tokenização de RWA (real world assets) migrou para outros padrões nos últimos anos.

## Decisão
Adotar **ERC-3643 (conhecido como T-REX — Token for Regulated EXchanges)** como padrão do `PropertyToken`.

Motivos técnicos:
- Possui **Identity Registry on-chain** nativo (associando cada carteira a uma identidade verificada via claims), que mapeia diretamente para o requisito de KYC do pitch (slide 4, passo 1).
- **Compliance Module pluggável**: regras de transferência (quem pode receber cotas, limites, lockups) ficam isoladas em um contrato separado, testável de forma independente — alinhado ao princípio de simplicidade da `specs/00-constitution.md`.
- É hoje o padrão de facto usado por projetos reais de tokenização de RWA e security tokens, com implementação de referência mantida ativamente (T-REX/ERC-3643 Association) — reduz risco de reinventar lógica crítica de compliance.
- Interface compatível com ERC-20 na camada de transferência básica, o que simplifica integração com carteiras e exchanges.

Isso **não altera nenhuma promessa feita no pitch aos investidores**:
- "Prova de propriedade" → `balanceOf` do `PropertyToken`, exatamente como em qualquer padrão de token.
- "Rendimentos automáticos" → responsabilidade do `DividendDistributor` (feature 003), independente do padrão de token escolhido para representar a cota.
- "Negociação livre" → transferências continuam livres entre carteiras verificadas, apenas passando por uma checagem de compliance a mais que protege o próprio investidor e o emissor de risco regulatório.

## Alternativas consideradas

| Alternativa | Prós | Contras | Motivo da rejeição |
|---|---|---|---|
| ERC-1400 (como no pitch) | Já citado no material a investidores; conceito conhecido no mercado de security tokens | Fragmentado, poucas implementações de referência ativas, maior custo de manutenção própria | Risco de manutenção e de segurança maior que o benefício de manter o nome já citado no pitch |
| ERC-20 puro + compliance própria | Simplicidade máxima, controle total | Reimplementa do zero toda a lógica de identity/compliance que já existe testada em ERC-3643 — mais superfície de bugs | Viola princípio de simplicidade/reuso; maior risco de segurança para um MVP |
| ERC-3643 (escolhido) | Identity Registry + Compliance nativos, padrão ativo no mercado de RWA, compatível com ERC-20 | Curva de aprendizado um pouco maior que ERC-20 puro | — |

## Consequências
- Positivas: menor risco de segurança (lógica de compliance testada por terceiros), melhor storytelling técnico para investidores/auditores familiarizados com tokenização de RWA, caminho mais claro para integrações futuras com exchanges que já suportam RWA.
- Negativas / trade-offs aceitos: introduz dependência de uma implementação de referência externa (a ser fixada por versão/commit auditado); equipe precisa se familiarizar com o padrão.
- Impacto em specs de feature relacionadas: `001-identidade-kyc` (Identity Registry e Compliance Module são as peças centrais deste ADR), `002-tokenizacao-imovel` (`PropertyToken` implementa a interface ERC-3643).
