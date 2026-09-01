---
status: draft
owner: tech-lead
last_updated: 2026-08-17
---

# Integração com o Backend

Mapa de quais telas/ações do frontend consomem quais capacidades do backend (`../../../backend/features`, repositório irmão `backend/`, 5 features). O frontend nunca aciona contratos diretamente — ver regra de fronteira em `plan.md`.

| Tela / ação no frontend | Capacidade do backend consumida | RF (frontend) | Feature / RF (backend) |
|---|---|---|---|
| Formulário de cadastro e upload de KYC | Endpoint de cadastro + encaminhamento ao provedor de KYC | RF-27 | [`001-onboarding-e-custodia`](../../../backend/features/001-onboarding-e-custodia/implement.md) — RF-26/RF-33, fluxo on-chain descrito em `../../../plan.md` |
| Tela do imóvel — exibição | Endpoint de leitura de dados do imóvel (valor, cotas restantes, rendimento estimado) | RF-28 | [`002-investimento-primario`](../../../backend/features/002-investimento-primario/implement.md) — RF-22, consulta de estado via `PropertyToken` |
| Tela do imóvel — confirmar compra | Endpoint que assina e envia `comprarCotas` em nome da carteira custodial | RF-28 | [`002-investimento-primario`](../../../backend/features/002-investimento-primario/implement.md) — RF-22 |
| Tela de portfólio | Endpoint de leitura de saldo, histórico de rendimentos e claims pendentes | RF-29 | [`003-portfolio-e-rendimentos`](../../../backend/features/003-portfolio-e-rendimentos/implement.md) — RF-23 |
| Painel do gestor — criar imóvel | Endpoint que aciona `PropertyFactory.criarImovel` | RF-30 | [`005-painel-administrativo`](../../../backend/features/005-painel-administrativo/implement.md) — RF-25 |
| Painel do gestor — depositar rendimento | Endpoint que aciona `DividendDistributor.depositarRendimento` | RF-30 | [`005-painel-administrativo`](../../../backend/features/005-painel-administrativo/implement.md) — RF-25 |
| Painel do gestor — status de KYC dos investidores | Endpoint de leitura de status de KYC agregado | RF-30 | [`005-painel-administrativo`](../../../backend/features/005-painel-administrativo/implement.md) — RF-25, lê dados de `001-onboarding-e-custodia` |
| Mercado secundário — listar/comprar | Endpoints que acionam `Marketplace.listar` / `Marketplace.comprar` | RF-31 | [`004-mercado-secundario`](../../../backend/features/004-mercado-secundario/implement.md) — RF-34/RF-35 |
| Mensagens de erro traduzidas | Backend retorna código de erro estruturado (ex.: `SEM_KYC`, `COTAS_INSUFICIENTES`) que o frontend mapeia para texto amigável | RF-32 | contrato de erro a definir entre frontend e cada feature backend |

## Nota de segurança
O frontend trata toda resposta do backend como não-confiável para fins de exibição (sempre sanitiza antes de renderizar), mas nunca é a camada que decide se uma ação é permitida — essa decisão sempre vem do backend/contrato, conforme já estabelecido em RNF-16 (ver [`../../../backend/features/002-investimento-primario/implement.md`](../../../backend/features/002-investimento-primario/implement.md)).
