---
status: draft
owner: tech-lead
last_updated: 2026-08-17
---

# Integração com o Backend

Mapa de quais telas/ações do frontend consomem quais capacidades do backend (`specs-backend/features/001-plataforma-investidor`). O frontend nunca aciona contratos diretamente — ver regra de fronteira em `plan.md`.

| Tela / ação no frontend | Capacidade do backend consumida | RF (frontend) | RF/observação (backend) |
|---|---|---|---|
| Formulário de cadastro e upload de KYC | Endpoint de cadastro + encaminhamento ao provedor de KYC | RF-27 | RF-26 (armazenamento de PII), fluxo descrito em `specs/features/001-identidade-kyc/plan.md` |
| Tela do imóvel — exibição | Endpoint de leitura de dados do imóvel (valor, cotas restantes, rendimento estimado) | RF-28 | Consulta de estado via `PropertyToken` (ver `specs-backend/.../integration.md`) |
| Tela do imóvel — confirmar compra | Endpoint que assina e envia `comprarCotas` em nome da carteira custodial | RF-28 | RF-22 (backend) |
| Tela de portfólio | Endpoint de leitura de saldo, histórico de rendimentos e claims pendentes | RF-29 | RF-23 (backend) |
| Painel do gestor — criar imóvel | Endpoint que aciona `PropertyFactory.criarImovel` | RF-30 | RF-25 (backend) |
| Painel do gestor — depositar rendimento | Endpoint que aciona `DividendDistributor.depositarRendimento` | RF-30 | RF-25 (backend) |
| Painel do gestor — status de KYC dos investidores | Endpoint de leitura de status de KYC agregado | RF-30 | RF-25 (backend) |
| Mercado secundário — listar/comprar | Endpoints que acionam `Marketplace.listar` / `Marketplace.comprar` | RF-31 | integração descrita em `specs-backend/.../integration.md` |
| Mensagens de erro traduzidas | Backend retorna código de erro estruturado (ex.: `SEM_KYC`, `COTAS_INSUFICIENTES`) que o frontend mapeia para texto amigável | RF-32 | contrato de erro a definir entre frontend/backend |

## Nota de segurança
O frontend trata toda resposta do backend como não-confiável para fins de exibição (sempre sanitiza antes de renderizar), mas nunca é a camada que decide se uma ação é permitida — essa decisão sempre vem do backend/contrato, conforme já estabelecido em `specs-backend/features/001-plataforma-investidor/integration.md`.
