---
status: draft
owner: tech-lead
last_updated: 2026-08-17
---

# Contrato: IdentityRegistry

Implementa a porção "Identity Registry" do padrão ERC-3643 (ADR-0001).

## Responsabilidades
- Manter o registro de quais carteiras possuem claims válidas.
- Manter o registro de quais endereços são Trusted Issuers autorizados.
- Expor consulta de elegibilidade (`isVerified`) sem custo de gas para quem consulta.

## Interface esperada (sem código)

**Funções de escrita** (restritas por role):
- `adicionarTrustedIssuer(address issuer)` — apenas `PLATFORM_ADMIN_ROLE`.
- `removerTrustedIssuer(address issuer)` — apenas `PLATFORM_ADMIN_ROLE`.
- `emitirClaim(address carteira, bytes32 topico, bytes assinatura)` — apenas Trusted Issuer autorizado; `topico` identifica o tipo de claim (ex.: `KYC_APPROVED`, `PAIS_BR`).
- `revogarClaim(address carteira, bytes32 topico)` — Trusted Issuer que emitiu ou `PLATFORM_ADMIN_ROLE`.

**Funções de leitura (view):**
- `isVerified(address carteira) → bool` — true se a carteira possui a claim mínima exigida (`KYC_APPROVED`) de um Trusted Issuer atualmente autorizado.
- `temClaim(address carteira, bytes32 topico) → bool`.
- `trustedIssuers() → address[]`.

**Eventos:**
- `TrustedIssuerAdicionado(address issuer)`
- `TrustedIssuerRemovido(address issuer)`
- `ClaimEmitida(address carteira, bytes32 topico, address issuer)`
- `ClaimRevogada(address carteira, bytes32 topico, address revogadoPor)`

## Invariantes
- `isVerified` nunca retorna `true` para uma carteira sem claim `KYC_APPROVED` de um issuer que estava autorizado no momento da emissão.
- Remover um Trusted Issuer não apaga retroativamente claims já emitidas (ver cenário "Remoção de Trusted Issuer" em `spec.md`), mas impede novas emissões por ele.
- Apenas `PLATFORM_ADMIN_ROLE` gerencia a lista de Trusted Issuers.

## Cenários de aceite (Dado/Quando/Então)
Ver tabela completa em `../spec.md`. Cada linha daquela tabela deve corresponder a um teste (`test_RF02_...`, `test_RF03_...`) em `../test-strategy.md`.

## Riscos de segurança específicos
- **SEC-11**: comprometimento da chave de um Trusted Issuer — mitigação fora do contrato (hardware wallet/multisig do provedor), mas o contrato deve permitir revogação rápida de um issuer inteiro (`removerTrustedIssuer`) como contenção.
- **SEC-02**: funções administrativas protegidas por `AccessControl`, não por `onlyOwner` simples — permite múltiplos admins/multisig sem redeploy.
- Replay de assinatura: `emitirClaim` deve invalidar assinaturas já usadas (nonce ou hash único por claim) para impedir reuso.

## Referências
- OpenZeppelin `AccessControl` para roles.
- Implementação de referência ERC-3643 (T-REX) — `IdentityRegistry`/`ClaimTopicsRegistry`/`TrustedIssuersRegistry` como inspiração de design (aqui simplificados em um único contrato para a POC, conforme princípio de simplicidade da `specs/00-constitution.md`).
