---
status: approved
owner: time-fundador
last_updated: 2026-08-17
---

# Glossário

| Termo | Definição |
|---|---|
| **SPE** | Sociedade de Propósito Específico — entidade jurídica constituída para deter a propriedade do imóvel piloto e emitir as cotas tokenizadas. |
| **CVM 588** | Instrução da Comissão de Valores Mobiliários que regula ofertas públicas de valores mobiliários por meio de plataformas eletrônicas (crowdfunding de investimento). Referência regulatória para a oferta das cotas. |
| **Lei 14.478/22** | Marco legal de criptoativos no Brasil; define prestadoras de serviços de ativos virtuais e supervisão pelo Banco Central. |
| **ERC-3643 (T-REX)** | Padrão de token para security tokens/RWA (Real World Assets), sucessor de facto do ERC-1400. Inclui Identity Registry on-chain e módulos de Compliance pluggáveis. Ver ADR-0001. |
| **ONCHAINID** | Identidade digital on-chain associada a uma carteira, usada pelo padrão ERC-3643 para armazenar claims de verificação. |
| **Identity Registry** | Contrato que mantém o registro de quais carteiras possuem identidade verificada (claims válidas). Ver feature `001-identidade-kyc`. |
| **Trusted Issuer** | Entidade autorizada a emitir claims de verificação (ex.: provedor de KYC) que o Identity Registry aceita como válidas. |
| **Claim** | Atestado assinado por um Trusted Issuer sobre uma identidade (ex.: "KYC aprovado", "residente no Brasil"), registrado on-chain sem expor dados pessoais. |
| **Compliance Module** | Contrato que decide se uma transferência de token é permitida, com base em regras de negócio (KYC, limite de holders, lockup). |
| **Cota** | Fração tokenizada da propriedade do imóvel — no exemplo do pitch, 1 cota = R$10.000, 1.000 cotas por imóvel de R$10M. |
| **Mercado secundário** | Ambiente onde investidores compram/vendem cotas entre si após a emissão primária. Ver feature `004-mercado-secundario`. |
| **Snapshot** | Registro do saldo de tokens de cada holder em um momento específico, usado para calcular distribuição de rendimentos de forma justa mesmo com transferências entre ciclos. |
| **Pull-payment** | Padrão onde o beneficiário precisa ativamente reivindicar (`claim`) um pagamento, em vez do contrato enviar (`push`) automaticamente — evita ataques de negação de serviço (DoS). Ver ADR-0004. |
| **RWA** | Real World Assets — ativos do mundo real (imóveis, recebíveis, commodities) representados on-chain. |
| **KYC** | Know Your Customer — processo de verificação de identidade do investidor (CPF, documento). |
| **POC** | Proof of Concept — piloto de 16 semanas com 1 imóvel e 20 investidores, conforme `specs/roadmap.md`. |
