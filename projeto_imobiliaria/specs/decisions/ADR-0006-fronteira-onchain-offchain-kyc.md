---
status: approved
last_updated: 2026-08-17
---

# ADR-0006: Fronteira on-chain/off-chain do KYC

## Status
approved

## Contexto
O passo 1 da jornada do investidor (slide 4) exige cadastro e confirmação de identidade (CPF, documento). Dados pessoais nunca devem ser gravados on-chain (imutável, público) por razões de LGPD e de boas práticas de segurança — mas o resultado da verificação precisa ser consultável on-chain para que o `ComplianceModule` (feature 001) possa decidir se uma transferência é permitida.

## Decisão
- **Off-chain**: coleta de documentos, CPF, selfie, e a decisão de aprovação/reprovação de KYC são feitas por um provedor terceiro de KYC (a contratar), fora da blockchain.
- **On-chain**: apenas o resultado da verificação é registrado, como uma **claim** assinada pelo provedor (atuando como Trusted Issuer) no `IdentityRegistry` — por exemplo: `claim: KYC_APPROVED`, `claim: PAIS=BR`, `claim: TIPO_INVESTIDOR=PESSOA_FISICA`. Nenhum CPF, nome ou documento é gravado em nenhum contrato.
- A plataforma (`specs-backend/features/001-plataforma-investidor`) guarda os dados pessoais em seu banco de dados off-chain (sujeito à LGPD), associados à carteira custodial do investidor, mas essa associação não é pública on-chain além do necessário para o Compliance funcionar.

## Alternativas consideradas
| Alternativa | Prós | Contras | Motivo da rejeição |
|---|---|---|---|
| KYC totalmente on-chain (dados no contrato) | Máxima transparência/auditabilidade | Viola LGPD, expõe dados pessoais permanentemente e publicamente | Inaceitável do ponto de vista legal e de segurança |
| KYC totalmente off-chain (sem registro on-chain) | Simplicidade máxima | `ComplianceModule` não teria como verificar elegibilidade de forma confiável e auditável on-chain | Quebra o modelo de compliance do ERC-3643 (ADR-0001) |
| Claims on-chain sem PII (escolhido) | Compliance auditável on-chain sem expor dados pessoais | Depende da confiabilidade do Trusted Issuer (provedor de KYC) | — |

## Consequências
- Positivas: compliance com LGPD; compliance on-chain auditável sem expor dados pessoais; alinhado ao desenho nativo do ERC-3643 (Identity Registry + Trusted Issuers + Claims).
- Negativas / trade-offs aceitos: confiança depositada no provedor de KYC como Trusted Issuer — se comprometido, pode emitir claims falsas. Mitigação: contrato com provedor estabelecido, chave do Trusted Issuer em hardware wallet/multisig.
- Impacto em specs de feature relacionadas: `specs/features/001-identidade-kyc` (spec completa do fluxo), `specs-backend/features/001-plataforma-investidor` (armazenamento de PII off-chain, LGPD).
