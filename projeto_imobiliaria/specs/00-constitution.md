---
status: approved
owner: time-fundador
last_updated: 2026-08-17
---

# Constituição do Projeto — Tokenização Imobiliária

## Missão

Permitir que qualquer pessoa invista em imóveis com o valor que couber no bolso, usando smart contracts para dar prova de propriedade digital, rendimento automático e negociação livre de cotas — eliminando as três barreiras hoje existentes: acesso restrito, baixa liquidez e alta burocracia (ver `tokenizacao-imobiliaria-poc.pptx`, slides 2-3).

## Princípios de engenharia

1. **Spec-Driven Development (SDD)**: nenhuma linha de código é escrita antes de existir uma spec aprovada em `specs/features/*/spec.md` com cenários de aceite testáveis. Specs são a fonte da verdade; código é a implementação de uma spec, nunca o contrário.
2. **Test-Driven Development (TDD)**: nenhum contrato é implementado antes de existir o teste Foundry correspondente, escrito a partir dos cenários Dado/Quando/Então da spec, e que falhe (red) antes do contrato existir (green). Ver `specs/features/*/test-strategy.md`.
3. **Segurança acima de velocidade**: todo contrato segue checklist de `specs/security-checklist.md` antes de ir a auditoria externa; nenhum contrato vai a mainnet sem auditoria.
4. **Simplicidade no MVP**: a POC resolve o caso de 1 imóvel e 20 investidores. Complexidade (order book, governança on-chain, múltiplos imóveis simultâneos) só entra quando houver evidência de necessidade real.
5. **Rastreabilidade**: todo requisito (`RF-XX`), decisão (`ADR-XXXX`), risco (`RISK-XX`) e item de segurança (`SEC-XX`) tem ID único, citado nas specs e, futuramente, nos nomes dos testes.

## Princípios de compliance

- Nenhuma emissão ou transferência de cota ocorre para uma carteira sem identidade verificada (KYC) registrada on-chain — ver feature `001-identidade-kyc`.
- O projeto opera dentro do marco da Lei 14.478/22 (marco legal de criptoativos no Brasil) e busca enquadramento na Instrução CVM 588 (oferta pública de valores mobiliários / crowdfunding regulado) antes de qualquer captação de investidores de varejo — ver `specs/roadmap.md`, fase "Fundação Jurídica".
- Dados pessoais de KYC (CPF, documentos) nunca são gravados on-chain — apenas o resultado da verificação (claim assinada por um Trusted Issuer). Ver ADR-0006.

## Papéis

| Papel | Responsabilidade |
|---|---|
| Product/Founder | Aprova specs de negócio (`spec.md`) e prioriza roadmap |
| Tech Lead | Aprova specs técnicas (`plan.md`, `contracts/*.md`) e ADRs |
| Compliance/Jurídico | Aprova specs com impacto regulatório (feature 001, ADR-0006) |
| Auditor externo | Valida `security-checklist.md` antes do deploy em mainnet |

## Definition of Done de uma spec

Uma spec (`spec.md` de feature ou `contracts/*.md`) só é considerada `approved` quando:
- Todo requisito tem pelo menos um cenário Dado/Quando/Então sem ambiguidade.
- Todo contrato listado tem responsabilidades, interface esperada, invariantes e riscos de segurança documentados.
- Toda dependência entre features/contratos está explícita.
- Não há pergunta em aberto bloqueante sem dono e prazo (ver tracker em `specs/roadmap.md`).

## Non-goals explícitos da POC

Fora de escopo para as 16 semanas da POC (podem virar specs futuras, mas não bloqueiam a POC):
- Múltiplos imóveis simultâneos (a `PropertyFactory` é desenhada para suportar, mas a POC roda com 1 imóvel).
- Marketplace com order book, leilão ou AMM — a POC usa listagem a preço fixo.
- Oráculo automatizado de valor de aluguel — o valor é lançado manualmente pelo gestor da SPE.
- Governança on-chain (DAO, votação de cotistas).
- Operação cross-chain.
- Wallet não-custodial com account abstraction — a POC usa carteira custodial gerenciada pela plataforma para não exigir conhecimento técnico do investidor (ver slide 4).
