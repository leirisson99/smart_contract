---
status: draft
owner: tech-lead
last_updated: 2026-08-17
---

# Contrato: PropertyFactory

## Responsabilidades
- Deployar um novo `PropertyToken` por imóvel, de forma padronizada.
- Manter o registro de todos os imóveis já tokenizados na plataforma.
- Compartilhar a mesma referência de `IdentityRegistry`/`ComplianceModule` (feature 001) entre todos os imóveis, para que o KYC de um investidor valha para qualquer imóvel da plataforma.

## Interface esperada (sem código)

**Funções de escrita:**
- `criarImovel(string nome, uint256 valorTotal, uint256 numeroCotas)` — apenas `PLATFORM_ADMIN_ROLE`; deploya novo `PropertyToken` (via minimal proxy EIP-1167 para otimização de gas — a validar em benchmark) e o registra.

**Funções de leitura:**
- `imoveis() → address[]` — lista todos os `PropertyToken` já criados.
- `imovelPorId(uint256 id) → address`.

**Eventos:**
- `ImovelCriado(uint256 id, address propertyToken, string nome, uint256 valorTotal, uint256 numeroCotas)`

## Invariantes
- Todo `PropertyToken` criado pela Factory é inicializado com o mesmo `IdentityRegistry`/`ComplianceModule` compartilhado (RF-10 da feature 002 depende disso).
- `criarImovel` só pode ser chamado por `PLATFORM_ADMIN_ROLE`.

## Cenários de aceite (Dado/Quando/Então)
| Cenário | Dado | Quando | Então |
|---|---|---|---|
| Criação de imóvel | Admin da plataforma autenticado | `criarImovel("Edifício X", 10_000_000, 1000)` é chamado | Novo `PropertyToken` deployado, registrado em `imoveis()`, evento `ImovelCriado` emitido |
| Criação por não-admin | Carteira sem `PLATFORM_ADMIN_ROLE` | Tenta chamar `criarImovel` | Transação reverte |

## Riscos de segurança específicos
- **SEC-12**: `criarImovel` restrito e idealmente atrás de multisig — evita criação fraudulenta de "imóveis" falsos na plataforma.
- Uso de minimal proxy (EIP-1167): avaliar trade-off de gas vs. simplicidade de auditoria (cada proxy aponta para uma implementação auditada uma única vez) — decisão a registrar como nota técnica nesta spec após benchmark inicial.

## Referências
- OpenZeppelin `Clones` (EIP-1167) como possível otimização de gas.
- ADR-0005 (imutabilidade por imóvel — a Factory é o ponto de versionamento entre imóveis, não os tokens individuais).
