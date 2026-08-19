---
status: approved
owner: time-fundador
last_updated: 2026-08-19
---

# Guia de Conhecimentos de Solidity para Implementar os Contratos

Este guia é para quem vai **efetivamente escrever e testar** os smart contracts do projeto — diferente de [`specs/guia-conhecimentos-tecnicos.md`](guia-conhecimentos-tecnicos.md), que é para quem acompanha e revisa specs sem necessariamente programar. Aqui, os itens marcados como ⚪ *Opcional* naquele guia viram o ponto de partida.

Este documento assume que você já entende os conceitos de [`specs/guia-conhecimentos-tecnicos.md`](guia-conhecimentos-tecnicos.md) (blockchain, gas, smart contract, ERC-20, ERC-3643, nomes de vulnerabilidades, upgradability, SDD/TDD) — ele não repete essas definições, só aprofunda a parte de **linguagem Solidity e ferramentas** para implementar o que já foi decidido nos ADRs.

- 🟢 **Essencial** — indispensável antes de escrever o primeiro contrato do projeto.
- 🟡 **Recomendado** — vai aparecer em pelo menos uma feature; bom saber onde procurar quando precisar.
- ⚪ **Aprofundar antes da auditoria** — impacta diretamente um item do `security-checklist.md`.

---

## A) Sintaxe e tipos da linguagem Solidity

### 1. Versão e aritmética checada 🟢
Solidity ≥0.8 faz checagem automática de overflow/underflow em toda operação aritmética, revertendo a transação em vez de "dar a volta" no número.
**Por que precisa:** é a mitigação padrão de `SEC-03` em [`specs/security-checklist.md`](security-checklist.md). Qualquer bloco `unchecked {}` que apareça em um PR precisa ser justificado explicitamente — ele desliga essa proteção para ganhar gas, e é um dos primeiros lugares que um auditor vai procurar.

### 2. Visibilidade e tipos de valor vs. referência 🟢
`public`/`external`/`internal`/`private` controlam quem pode chamar uma função ou ler uma variável. Tipos de valor (`uint`, `bool`, `address`) são copiados quando atribuídos; tipos de referência (`array`, `struct`, `mapping`) apontam para a mesma localização de dados.
**Por que precisa:** é a base para ler qualquer um dos contratos descritos em `specs/features/*/contracts/*.md` e para não introduzir bugs sutis (ex.: modificar uma cópia de struct em vez do original).

### 3. `storage`, `memory` e `calldata` 🟢
`storage` persiste entre transações (é o "disco" do contrato, caro em gas); `memory` é temporário dentro da execução de uma função; `calldata` é a área somente-leitura dos parâmetros recebidos em funções `external`.
**Por que precisa:** confundir os três é uma das causas mais comuns de bugs em Solidity (ex.: achar que alterou o estado do contrato quando na verdade alterou uma cópia em `memory`) e afeta diretamente o custo de gas de cada função dos contratos deste projeto.

### 4. Eventos (`event`, `indexed`) 🟢
Um `event` registra um log permanente e barato na blockchain, consultável por ferramentas externas, sem ocupar `storage`. Parâmetros `indexed` ficam pesquisáveis por filtro.
**Por que precisa:** é a mitigação de `SEC-09` (auditabilidade insuficiente) — todo mint, transfer, claim, listagem, compra e mudança de compliance precisa emitir evento. Ao implementar qualquer função de estado em `PropertyToken`, `DividendDistributor` ou `Marketplace`, o evento correspondente faz parte do "pronto", não é opcional.

### 5. Modifiers e custom errors 🟡
`modifier` encapsula uma checagem repetida (ex.: `onlyRole`) que roda antes do corpo da função. Desde Solidity 0.8.4, `revert MeuErro(arg)` (custom error) substitui `require(cond, "mensagem")` com o mesmo efeito e bytecode/gas menor.
**Por que precisa:** os contratos deste projeto usam roles (`MINTER_ROLE`, `COMPLIANCE_ADMIN_ROLE`, `PLATFORM_ADMIN_ROLE` — `SEC-02`) fortemente baseadas em modifiers; preferir custom errors reduz o custo de deploy e execução, relevante numa rede já escolhida por custo baixo ([ADR-0002](decisions/ADR-0002-rede-polygon.md)).

### 6. `payable`, `receive()` e `fallback()` 🟡
Funções `payable` podem receber a moeda nativa da rede (MATIC/POL na Polygon); `receive()`/`fallback()` são acionadas quando o contrato recebe valor sem dados ou uma chamada não bate com nenhuma função existente.
**Por que precisa:** relevante para qualquer contrato que receba depósito de valor, como o `DividendDistributor` ao registrar o aluguel do mês — ver [`specs/features/003-distribuicao-rendimentos/contracts/dividend-distributor.md`](features/003-distribuicao-rendimentos/contracts/dividend-distributor.md).

### 7. Interfaces, `abstract contract` e herança múltipla 🟡
Uma `interface` declara só as assinaturas de função; `abstract contract` pode misturar funções implementadas e não implementadas; Solidity permite herdar de várias interfaces/contratos ao mesmo tempo (com regras próprias de resolução de conflito, tipo C3 linearization).
**Por que precisa:** o padrão ERC-3643/T-REX ([ADR-0001](decisions/ADR-0001-padrao-token-erc-3643.md)) é composto por várias interfaces menores (identity, compliance, transferência) que o `PropertyToken` implementa simultaneamente — sem entender herança múltipla, a estrutura do contrato parece mais confusa do que é.

---

## B) EVM na prática para quem programa

### 8. Layout de `storage` e slots 🟡
Cada variável de `storage` ocupa um "slot" de 32 bytes; variáveis pequenas (ex.: `bool`, `uint8`) podem ser agrupadas ("packed") no mesmo slot se declaradas em sequência, economizando gas. A ordem das variáveis de um contrato define seu layout.
**Por que precisa:** mesmo com contratos imutáveis (sem proxy) na POC ([ADR-0005](decisions/ADR-0005-estrategia-upgradability.md)), entender storage layout ajuda a escrever `struct`s mais baratas (ex.: dados de um imóvel na `PropertyFactory`) e é pré-requisito caso o projeto adote upgradability no `IdentityRegistry`/`ComplianceModule` no futuro, onde storage collision vira um risco real.

### 9. Operações caras: `SSTORE`, chamadas externas, loops sobre arrays 🟡
Escrever em `storage` (`SSTORE`) é a operação mais cara do EVM; chamadas externas (`call` para outro contrato) também custam mais e podem falhar; loops cujo número de iterações cresce com o número de usuários crescem o custo (e o risco) proporcionalmente.
**Por que precisa:** é a razão técnica direta por trás do [ADR-0004](decisions/ADR-0004-modelo-distribuicao-rendimentos.md) — um `for` que paga N holders em push automático foi rejeitado exatamente por esse motivo (custo de gas + risco de DoS, `SEC-07`). Qualquer loop sobre um array sem tamanho limitado, em uma função pública, deveria te fazer parar e perguntar "isso escala?".

### 10. `call`, `delegatecall`, `transfer`/`send` 🟢
`call` executa código de outro contrato no contexto dele; `delegatecall` executa o código de outro contrato *no contexto do contrato chamador* (usado em proxies); `transfer`/`send` são formas antigas e mais limitadas de enviar valor nativo, hoje geralmente desaconselhadas em favor de `call{value: x}("")` com checagem de retorno.
**Por que precisa:** é a base para entender por que o padrão **Checks-Effects-Interactions** (item 14) existe: toda vulnerabilidade de reentrancy (`SEC-01`) explora o momento entre uma chamada externa (`call`) e a atualização do estado do contrato.

---

## C) Bibliotecas e padrões usados neste projeto (OpenZeppelin)

### 11. `AccessControl` (roles) 🟢
Biblioteca da OpenZeppelin que substitui o `Ownable` de dono único por papéis nomeados (`bytes32 constant MINTER_ROLE = ...`), cada um concedido/revogado independentemente e verificável via `hasRole`/`onlyRole`.
**Por que precisa:** é a mitigação especificada em `SEC-02` e `SEC-12` para toda função administrativa sensível (mint, freeze, pause, forced transfer, criação de imóvel) — idealmente com a conta que detém o role sendo um multisig, não uma EOA única.

### 12. `ReentrancyGuard` (`nonReentrant`) 🟢
Modifier da OpenZeppelin que impede que uma função seja re-executada antes de terminar sua primeira execução, usando uma trava simples de estado.
**Por que precisa:** é a mitigação nomeada em `SEC-01` para toda função que move valor ou faz chamada externa (mint, transfer, `claim()`). Deve ser tratada como defesa **adicional**, nunca como substituto do padrão CEI (item 14).

### 13. `SafeERC20` e a interface ERC-20 🟡
`SafeERC20` envolve chamadas `transfer`/`transferFrom` de tokens ERC-20 com checagens que cobrem implementações não-conformes ao padrão (que não retornam `bool`, por exemplo).
**Por que precisa:** o `PropertyToken` implementa a camada ERC-20 por baixo do ERC-3643 ([ADR-0001](decisions/ADR-0001-padrao-token-erc-3643.md)); se o `DividendDistributor` ou o `Marketplace` também movimentarem uma stablecoin ERC-20 para liquidação ([`specs/features/002-tokenizacao-imovel/plan.md`](features/002-tokenizacao-imovel/plan.md)), essas transferências devem passar por `SafeERC20`.

### 14. Padrão Checks-Effects-Interactions (CEI) 🟢
Ordem recomendada dentro de uma função: primeiro valide as condições (*checks*), depois atualize o estado do próprio contrato (*effects*), só então faça chamadas externas (*interactions*) — nunca o contrário.
**Por que precisa:** é a mitigação primária de `SEC-01`, mencionada explicitamente no `security-checklist.md` antes até do `ReentrancyGuard`. Todo `claim()`, `mint`, `transfer` ou compra no `Marketplace` deve seguir essa ordem.

### 15. Implementação de referência T-REX/ERC-3643 (ONCHAINID, ClaimTopicsRegistry, TrustedIssuersRegistry) ⚪
O padrão ERC-3643 na prática é composto por várias peças: `ONCHAINID` (identidade on-chain do investidor), `ClaimTopicsRegistry` (quais tipos de claim são exigidos), `TrustedIssuersRegistry` (quem pode emitir claims), além do `IdentityRegistry` e `ComplianceModule` já descritos nas specs deste projeto.
**Por que precisa:** o [ADR-0001](decisions/ADR-0001-padrao-token-erc-3643.md) decide usar a implementação de referência do T-REX/ERC-3643 Association em vez de reescrever essa lógica do zero — antes de implementar `001-identidade-kyc`, vale estudar essa implementação de referência (fixando versão/commit auditado) em vez de reinventar as peças que ela já resolve.

---

## D) Ferramentas: Foundry

### 16. `forge test` e fuzz testing 🟢
`forge test` roda a suíte de testes escrita em Solidity. Um teste de fuzz (`function testFuzz_algo(uint256 x)`) roda a mesma função centenas de vezes com valores gerados automaticamente, incluindo casos extremos.
**Por que precisa:** é o motivo central da escolha de Foundry no [ADR-0003](decisions/ADR-0003-toolchain-foundry.md) — testes na mesma linguagem do contrato, com fuzzing nativo, usados extensivamente em todo `test-strategy.md` de cada feature.

### 17. Invariant testing (stateful fuzzing) 🟡
Diferente do fuzz simples (uma função, muitos valores), o invariant testing chama uma sequência aleatória de funções do contrato e verifica, ao final, que propriedades globais continuam verdadeiras (ex.: "a soma dos saldos nunca excede o `totalSupply`").
**Por que precisa:** é citado explicitamente como prática esperada nos `test-strategy.md` das features on-chain — é a ferramenta certa para validar invariantes financeiras do `PropertyToken` e do `DividendDistributor` (ex.: "o total distribuído nunca excede o total depositado").

### 18. `forge coverage` 🟢
Gera relatório de cobertura de testes por linha/função/branch de cada contrato.
**Por que precisa:** é critério de saída explícito e obrigatório do `security-checklist.md` antes de contratar a auditoria externa (meta: funções críticas de transferência/claim/compliance em 100%).

### 19. Fork testing (`--fork-url`) ⚪
Executa os testes contra uma cópia local do estado real de uma rede (ex.: Polygon), permitindo testar integração com contratos/dados que já existem on-chain sem gastar gas real nem esperar confirmação.
**Por que precisa:** o [ADR-0003](decisions/ADR-0003-toolchain-foundry.md) cita fork testing como pré-requisito para validar a integração com estado real da Polygon antes do deploy em mainnet (Fase 4 do [`specs/roadmap.md`](roadmap.md)).

### 20. `cast` e `anvil` ⚪
`cast` é a CLI do Foundry para interagir manualmente com contratos já deployados (ler estado, montar transações). `anvil` sobe um nó Ethereum/EVM local para desenvolvimento e testes de integração.
**Por que precisa:** úteis no dia a dia de debug (inspecionar uma transação que falhou em testnet, simular uma chamada antes de assinar) e para rodar a plataforma (`specs-backend/features/001-plataforma-investidor`) localmente contra um nó de teste.

---

## E) Análise estática e ferramentas de auditoria

### 21. Slither ⚪
Ferramenta de análise estática que varre o código Solidity em busca de padrões conhecidos de vulnerabilidade sem executar o contrato.
**Por que precisa:** listada como **ferramenta obrigatória** em todos os contratos antes da auditoria externa, no rodapé do [`specs/security-checklist.md`](security-checklist.md). Rodar Slither cedo (não só no fim) evita reescrever contratos inteiros perto do prazo da auditoria.

### 22. Mythril (análise dinâmica/simbólica) ⚪
Ferramenta de execução simbólica que explora caminhos de execução do contrato em busca de estados inválidos, de forma mais profunda (e mais lenta) que uma análise puramente estática.
**Por que precisa:** listada como **opcional** no `security-checklist.md`, recomendada especificamente para os contratos de maior superfície de risco financeiro: `PropertyToken` e `DividendDistributor`.

---

## F) Convenções específicas deste projeto

### 23. Imutabilidade por imóvel + `PropertyFactory` 🟢
Cada imóvel tokenizado ganha sua própria instância imutável de `PropertyToken`, `DividendDistributor` e `Marketplace`, deployada pela `PropertyFactory`. Não existe proxy/upgrade nesses contratos na POC.
**Por que precisa:** é a decisão do [ADR-0005](decisions/ADR-0005-estrategia-upgradability.md) — ao implementar qualquer um desses três contratos, não introduza um padrão de proxy "por precaução"; a estratégia de correção de bug pós-deploy é uma **nova versão via Factory**, documentada em [`specs/features/002-tokenizacao-imovel/contracts/property-factory.md`](features/002-tokenizacao-imovel/contracts/property-factory.md), não um upgrade in-place.

### 24. Pull-payment com `claim()` 🟢
O `DividendDistributor` nunca envia valor para holders em loop; ele registra o depósito e cada holder chama `claim()` para puxar sua parte proporcional.
**Por que precisa:** é a decisão do [ADR-0004](decisions/ADR-0004-modelo-distribuicao-rendimentos.md). Ao implementar qualquer distribuição de valor a múltiplos endereços neste projeto (dividendos, eventualmente taxas), o padrão pull, não push, é o default — desviar disso exige justificar por que o caso é diferente.

### 25. Fronteira on-chain/off-chain de dados pessoais 🟢
Nenhum dado pessoal identificável (CPF, nome, documento) pode ir para `storage`, para um `event`, ou aparecer em texto claro em qualquer transação — nem mesmo em comentário de código versionado. Apenas *claims* booleanas/categorizadas (ex.: "KYC nível 2 aprovado") ficam on-chain.
**Por que precisa:** é a mitigação de `SEC-10` e a decisão do [ADR-0006](decisions/ADR-0006-fronteira-onchain-offchain-kyc.md) — violar essa fronteira ao implementar o `IdentityRegistry` ou o `ComplianceModule` é uma violação de LGPD, não só um bug técnico.

---

## Trilha de estudo sugerida

Antes de escrever o primeiro contrato deste projeto, essa é uma ordem razoável:

1. Conceitos 1-7 (sintaxe Solidity) — se você já programa em outra linguagem, isso é rápido; se Solidity é sua primeira linguagem de smart contract, não pule.
2. Conceitos 10, 14 (chamadas externas e CEI) — antes de tocar em qualquer função que mova valor.
3. Conceitos 11-13 (OpenZeppelin: `AccessControl`, `ReentrancyGuard`, `SafeERC20`) — as bibliotecas que o projeto já decidiu usar; não reimplemente o que elas já resolvem.
4. Conceitos 16-18 (Foundry: `forge test`, fuzz, coverage) — o ciclo TDD do dia a dia.
5. Conceitos 23-25 (convenções deste projeto) — as três decisões que mais frequentemente vão contrariar seu instinto de "como eu faria isso normalmente" (sem proxy, sem push, sem PII on-chain).
6. Conceitos 8-9, 15, 19-22 — aprofundar conforme a feature específica exigir, e obrigatoriamente antes de contratar a auditoria externa (Fase 2 do [`specs/roadmap.md`](roadmap.md)).

Para o vocabulário de negócio, regulação e os fundamentos conceituais de blockchain que este guia não repete, veja [`specs/guia-conhecimentos-tecnicos.md`](guia-conhecimentos-tecnicos.md) e [`specs/guia-conhecimentos-nao-tecnicos.md`](guia-conhecimentos-nao-tecnicos.md).
