---
status: approved
last_updated: 2026-09-02
---

# ADR-0006: Fronteira on-chain/off-chain do KYC

## Status
approved

## Contexto
O passo 1 da jornada do investidor (slide 4) exige cadastro e confirmação de identidade (CPF, documento). Dados pessoais nunca devem ser gravados on-chain (imutável, público) por razões de LGPD e de boas práticas de segurança — mas o resultado da verificação precisa ser consultável on-chain para que o `ComplianceModule` (feature 001) possa decidir se uma transferência é permitida.

## Decisão
- **Off-chain**: coleta de documentos, CPF, selfie, e a decisão de aprovação/reprovação de KYC são feitas por um provedor terceiro de KYC (a contratar), fora da blockchain.
- **On-chain**: apenas o resultado da verificação é registrado, como uma **claim** assinada pelo Trusted Issuer configurado no `IdentityRegistry` — por exemplo: `claim: KYC_APPROVED`, `claim: PAIS=BR`, `claim: TIPO_INVESTIDOR=PESSOA_FISICA`. Nenhum CPF, nome ou documento é gravado em nenhum contrato. **Hoje (POC), esse papel de Trusted Issuer é exercido pelo backend da plataforma, não pelo provedor de KYC** — ver seção "Atualização" abaixo.
- A plataforma (`../../backend/features/001-onboarding-e-custodia`, repositório irmão `backend/`) guarda os dados pessoais em seu banco de dados off-chain (sujeito à LGPD), associados à carteira custodial do investidor, mas essa associação não é pública on-chain além do necessário para o Compliance funcionar.

## Alternativas consideradas
| Alternativa | Prós | Contras | Motivo da rejeição |
|---|---|---|---|
| KYC totalmente on-chain (dados no contrato) | Máxima transparência/auditabilidade | Viola LGPD, expõe dados pessoais permanentemente e publicamente | Inaceitável do ponto de vista legal e de segurança |
| KYC totalmente off-chain (sem registro on-chain) | Simplicidade máxima | `ComplianceModule` não teria como verificar elegibilidade de forma confiável e auditável on-chain | Quebra o modelo de compliance do ERC-3643 (ADR-0001) |
| Claims on-chain sem PII (escolhido) | Compliance auditável on-chain sem expor dados pessoais | Depende da confiabilidade do Trusted Issuer (provedor de KYC) | — |

## Consequências
- Positivas: compliance com LGPD; compliance on-chain auditável sem expor dados pessoais; alinhado ao desenho nativo do ERC-3643 (Identity Registry + Trusted Issuers + Claims).
- Negativas / trade-offs aceitos: confiança depositada em quem detém a chave do Trusted Issuer — se comprometida, pode emitir claims falsas. Mitigação de processo já implementada (contenção via `removerTrustedIssuer`, runbook de rotação); mitigação de custódia (hardware wallet/multisig) ainda pendente — ver a atualização abaixo, que também muda **quem** detém essa chave na fase atual.
- Impacto em specs de feature relacionadas: `../features/001-identidade-kyc` (spec completa do fluxo), `../../backend/features/001-onboarding-e-custodia` (armazenamento de PII off-chain, LGPD, e agora também a operação da chave do Trusted Issuer).

## Atualização (2026-09-02): backend como Trusted Issuer na POC

**Contexto**: nenhum dos 3 candidatos a provedor de KYC avaliados (Didit, Sumsub, idwall — ver [`PENDENCIAS.md`](../../PENDENCIAS.md)) assina claims on-chain nativamente. Todos operam apenas via API/webhook, entregando o resultado da verificação (aprovado/reprovado) para quem os integrar — nenhum deles opera uma chave própria de Trusted Issuer.

**Decisão**: enquanto a POC não integra um provedor com capacidade de assinatura on-chain nativa, **o backend da plataforma guarda a chave privada do Trusted Issuer** (`TRUSTED_ISSUER_PRIVATE_KEY`) e assina `IdentityRegistry.emitirClaim` diretamente, a partir do resultado recebido do provedor (ou de um provedor mock, hoje) via webhook. Implementação de referência: `../../backend/src/services/trustedIssuerSigner.ts` (assinatura/envio) e `../../backend/scripts/grant-trusted-issuer.ts` (provisionamento do endereço do backend como Trusted Issuer via `adicionarTrustedIssuer`).

**Trade-off / risco aceito**: a confiança que antes seria depositada no provedor de KYC passa a ser depositada na própria plataforma — se a chave do backend for comprometida, um invasor pode emitir claims `KYC_APPROVED` falsas para qualquer carteira. Hoje (POC) a chave vive em `.env` (não versionado, mas em texto puro em disco), sem HSM/multisig — a mitigação de processo já existe (contenção via `removerTrustedIssuer`, rotação documentada em [`../runbooks/rotacao-trusted-issuer.md`](../runbooks/rotacao-trusted-issuer.md)), mas a mitigação de custódia real ainda não foi implementada (`SEC-11` em [`../security-checklist.md`](../security-checklist.md), `parcialmente mitigado`).

**Plano de migração futura**: antes de qualquer captação de investidores de varejo (ou da contratação de um provedor de KYC, o que ocorrer primeiro), migrar a custódia da chave do Trusted Issuer para HSM/KMS (ex.: AWS KMS, Google Cloud KMS, ou hardware wallet dedicado) — gate explícito para essa fase, não apenas recomendação. Critério de saída: a chave nunca mais reside em `.env`/texto puro; toda assinatura passa por um serviço de assinatura remota (KMS) ou hardware dedicado. Rastreado como task 1b em [`../../backend/features/001-onboarding-e-custodia/tasks.md`](../../backend/features/001-onboarding-e-custodia/tasks.md).

**Nota de escopo**: isso não muda a interface do `IdentityRegistry` nem o desenho ERC-3643 (Trusted Issuer é só um endereço autorizado, ver `adicionarTrustedIssuer`/`removerTrustedIssuer`) — é puramente uma decisão de **quem opera** esse endereço na fase atual da POC. A alternativa original ("provedor como Trusted Issuer", tabela acima) não foi descartada por preferência — foi tecnicamente inviabilizada pelos 3 candidatos avaliados.
