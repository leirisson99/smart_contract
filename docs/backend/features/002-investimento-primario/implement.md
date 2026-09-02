---
status: approved
owner: tech-lead
last_updated: 2026-09-02
---

# Implementação — Feature Backend 002

> Consolida mapa de integração on-chain, estratégia de testes e status de implementação desta feature.

## Integração com contratos

| Ação na plataforma | Contrato acionado | Feature on-chain | Observação |
|---|---|---|---|
| Investidor compra cotas | `PropertyToken.comprarCotas` | `../../../on-chain/features/002-tokenizacao-imovel` | Backend assina em nome da carteira custodial do investidor (custódia gerida por [001](../001-onboarding-e-custodia/implement.md)); `backend/src/services/propertyChain.ts` (`comprarCotasOnChain`) aprova a moeda de pagamento antes de comprar, ambas as transações assinadas pela chave do próprio investidor |

### Consulta de estado (view functions, sem transação)
- `PropertyToken.{nome,precoPorCota,totalCotas,cotasDisponiveis,totalSupply,moedaPagamento,balanceOf}` — lidas ao vivo a cada request (`lerImovelOnChain`/`balanceOfOnChain`), nunca cacheadas, para nunca divergir da fonte da verdade.

## Estratégia de testes

Depende dos contratos de `../../../on-chain/features/002-tokenizacao-imovel` já testados. A estratégia aqui cobre a camada de integração backend ↔ contrato.

- Unit (`test/imoveis.routes.test.ts`, mockando `propertyChain`/`trustedIssuerSigner`): `GET /imoveis`/`GET /imoveis/:id`, compra bem-sucedida, e as 3 rejeições RNF-16 (`SEM_KYC` mesmo com banco dizendo aprovado, `COTAS_INSUFICIENTES`, `VALOR_MINIMO_NAO_ATINGIDO`).
- E2e real (`test/property-flow.e2e.test.ts`, gated por `RUN_E2E=1`): cadastro → KYC aprovado → compra de cota → saldo refletido on-chain e no portfólio ([003](../003-portfolio-e-rendimentos/implement.md)) — rodado uma vez contra Anvil local para verificação (ver `projeto_imobiliaria/script/DeployPropertyPipeline.s.sol`).
- Falha de uma transação on-chain (ex.: revert de compliance) é capturada e devolvida como `502 { codigo: "ERRO_DESCONHECIDO" }`, sem gravar `Investment`, sem quebrar o fluxo para outros usuários.
- Teste end-to-end em testnet Polygon Amoy: ainda não feito (mesmo bloqueio de RPC/MATIC de faucet da trilha on-chain, `PENDENCIAS.md`).

### Critério de saída
Todos os cenários de `spec.md` cobertos por teste de integração ou end-to-end (Anvil local). Testnet pendente por bloqueio externo, não de código.

## Nota de segurança (RNF-16)
Toda ação que envolve movimentação de valor/token é sempre revalidada pelo contrato (compliance, saldo, KYC), independentemente do que o backend já validou na UX — o backend nunca é a última linha de defesa. O endpoint de compra também revalida o KYC direto on-chain (`isVerifiedOnChain`) a cada chamada, nunca a partir do status gravado no banco pela feature 001 (que pode estar desatualizado se a claim foi revogada). Mesmo princípio aplicado por [004](../004-mercado-secundario/implement.md) e [005](../005-painel-administrativo/implement.md).

## Status de implementação
Implementado e testado — `backend/src/routes/imoveis.ts`, `backend/src/services/propertyChain.ts`. Testes unitários (mockando a chain) + e2e real gated contra Anvil local. Reconciliado com o código em 2026-09-02 (Sprint 6).
