---
status: draft
owner: tech-lead
last_updated: 2026-08-17
---

# Integração com as Features On-Chain

Mapa de quais ações da plataforma acionam quais contratos, para orientar o desenho da camada de integração do backend.

| Ação na plataforma | Contrato acionado | Feature | Observação |
|---|---|---|---|
| Investidor completa KYC | `IdentityRegistry.emitirClaim` (via Trusted Issuer) | 001 | Chamada feita pelo provedor de KYC, não diretamente pelo backend da plataforma |
| Gestor cria novo imóvel | `PropertyFactory.criarImovel` | 002 | Requer `PLATFORM_ADMIN_ROLE` |
| Investidor compra cotas | `PropertyToken.comprarCotas` | 002 | Backend assina em nome da carteira custodial do investidor |
| Gestor deposita aluguel do mês | `DividendDistributor.depositarRendimento` | 003 | Requer role de gestor |
| Job automático de claim | `DividendDistributor.claim` / `claimTodos` | 003 | Rodado periodicamente pelo backend, em nome de cada investidor com valor pendente |
| Investidor lista cotas para venda | `Marketplace.listar` | 004 | Backend assina em nome da carteira custodial |
| Investidor compra no mercado secundário | `Marketplace.comprar` | 004 | Backend assina em nome da carteira custodial; valida KYC antes de enviar (checagem otimista de UX, mas o contrato revalida) |

## Consulta de estado (view functions, sem transação)
- `IdentityRegistry.isVerified` — exibir status de KYC no perfil do investidor.
- `PropertyToken.balanceOf` — exibir portfólio.
- `DividendDistributor.valorReivindicavel` — exibir rendimentos pendentes.
- `Marketplace.listagensAtivasPorToken` — exibir mercado secundário na interface.

## Nota de segurança
Toda ação que envolve movimentação de valor/token é sempre revalidada pelo contrato (compliance, saldo, KYC), independentemente do que o backend já validou na UX — o backend nunca é a última linha de defesa.
