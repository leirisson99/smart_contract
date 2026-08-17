---
status: draft
owner: tech-lead
last_updated: 2026-08-17
---

# Feature 001 — Identidade e KYC

Origem: pitch slide 4 ("Cadastro e KYC — cria conta na plataforma e confirma identidade (CPF, documento)") e slide 6 (Fraqueza: "Regulação CVM exige estruturação jurídica").

## Objetivo
Garantir que somente carteiras com identidade verificada possam receber, manter ou transferir cotas tokenizadas, sem expor dados pessoais on-chain.

## Personas
- **Investidor**: pessoa física que passa por KYC para poder investir.
- **Agente de compliance**: aprova/reprova regras de elegibilidade (ex.: apenas residentes no Brasil na POC).
- **Provedor de KYC (Trusted Issuer)**: entidade terceira que executa a verificação off-chain e assina claims.
- **Administrador da plataforma**: gerencia quais Trusted Issuers são aceitos.

## Requisitos funcionais

| ID | Requisito |
|---|---|
| RF-01 | O sistema deve permitir que um investidor complete cadastro e KYC (CPF, documento) na plataforma antes de poder investir. |
| RF-02 | O sistema deve registrar, on-chain, o resultado da verificação de identidade como uma claim assinada por um Trusted Issuer, sem gravar dados pessoais. |
| RF-03 | O sistema deve impedir qualquer transferência de cota (emissão primária, secundária, ou entre carteiras) para uma carteira sem claim de KYC válida. |
| RF-04 | O sistema deve permitir que o administrador da plataforma adicione ou revogue Trusted Issuers. |
| RF-05 | O sistema deve permitir revogar a claim de um investidor (ex.: KYC expirado ou fraude identificada), bloqueando futuras transferências para essa carteira. |

## Requisitos não funcionais
- **RNF-01 (LGPD)**: nenhum dado pessoal identificável (CPF, nome, documento) é gravado em qualquer contrato.
- **RNF-02 (auditabilidade)**: toda concessão/revogação de claim emite evento on-chain.
- **RNF-03 (latência)**: verificação de elegibilidade (`isVerified`) deve ser uma leitura on-chain sem custo de gas (view function), consultável antes de qualquer transferência.

## Cenários de aceite

| Cenário | Dado | Quando | Então |
|---|---|---|---|
| KYC aprovado | Um investidor completa o KYC off-chain com sucesso | O Trusted Issuer registra a claim `KYC_APPROVED` para a carteira do investidor | `IdentityRegistry.isVerified(carteira)` retorna `true` |
| Transferência bloqueada sem KYC | Uma carteira nunca passou por KYC | Alguém tenta transferir uma cota para essa carteira | A transferência reverte com motivo específico (ex.: `ComplianceNaoVerificado`) |
| Revogação de claim | Um investidor tinha KYC aprovado | O agente de compliance revoga a claim (ex.: suspeita de fraude) | `isVerified` passa a retornar `false`; futuras transferências para essa carteira revertem; saldo existente permanece intacto (não há confisco automático) |
| Trusted Issuer não autorizado | Uma entidade não cadastrada como Trusted Issuer tenta emitir uma claim | A claim é submetida ao `IdentityRegistry` | A operação reverte — apenas Trusted Issuers autorizados podem emitir claims válidas |
| Remoção de Trusted Issuer | Um Trusted Issuer é removido pelo administrador | Claims previamente emitidas por ele já registradas | Claims existentes continuam válidas (não retroage) até revisão manual; novas claims desse issuer passam a ser rejeitadas |

## Fora de escopo desta feature
- UI de upload de documentos (`specs-backend/features/001-plataforma-investidor`).
- Escolha/contratação do provedor de KYC comercial (decisão de negócio, fora do pacote técnico).
- Verificação de investidor qualificado/sofisticado para fins de enquadramento CVM (pode virar uma claim adicional futura, ex.: `INVESTIDOR_QUALIFICADO`).
