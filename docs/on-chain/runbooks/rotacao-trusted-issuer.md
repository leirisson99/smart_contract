---
status: approved
owner: tech-lead
last_updated: 2026-08-21
---

# Runbook — Rotação de chave do Trusted Issuer (`SEC-11`)

Cobre a parte técnica/operacional de `SEC-11` ([security-checklist.md](../security-checklist.md)): o que fazer
quando a chave de um provedor de KYC (Trusted Issuer) é — ou pode ter sido — comprometida. Complementa a
contenção on-chain já implementada e testada em `IdentityRegistry` (`removerTrustedIssuer`,
`adicionarTrustedIssuer`, múltiplos issuers simultâneos).

> Este runbook fecha a parte de **processo** de `SEC-11`. A parte de **custódia** (a chave do provedor real
> viver em hardware wallet/multisig) só pode ser executada depois que um provedor de KYC for contratado — ver
> bloqueio em [`PENDENCIAS.md`](../../PENDENCIAS.md). Até lá, deploys locais/testnet usam um Trusted Issuer mock
> (uma EOA de teste), o que não afeta a validade deste processo.

## Pré-requisitos permanentes (antes de operar com um provedor real)

- **A chave do Trusted Issuer nunca deve ser uma EOA hot wallet em produção.** Ela deve estar em hardware
  wallet (ex.: Ledger) e, para o `PLATFORM_ADMIN_ROLE` (quem pode adicionar/remover issuers), atrás de um
  multisig (ex.: Gnosis Safe, threshold sugerido 2-de-3 ou 3-de-5 conforme o número de signatários da
  plataforma) implantado na mesma rede do `IdentityRegistry` (Polygon).
- O endereço do multisig — não uma EOA individual — é quem deve receber `PLATFORM_ADMIN_ROLE` no deploy
  (`IdentityRegistry.constructor` concede o papel a `msg.sender`; ou usar
  `grantRole`/`revokeRole` logo após o deploy para transferir do deployer para o multisig).
- Monitoramento: alertar (ex.: via Etherscan/Polygonscan watch ou serviço de monitoramento on-chain) em toda
  emissão do evento `TrustedIssuerAdicionado`/`TrustedIssuerRemovido` e em toda `ClaimEmitida` fora do volume
  esperado — sinal precoce de uso indevido da chave.

## Gatilho

Qualquer um dos sinais abaixo inicia este runbook:
- Suspeita ou confirmação de vazamento da chave privada do provedor de KYC (ex.: laptop comprometido,
  vazamento de segredo em CI, funcionário desligado com acesso à chave).
- Volume anômalo de `ClaimEmitida` para o issuer em questão (possível emissão fraudulenta de KYC).
- Solicitação do próprio provedor (ex.: eles detectaram o comprometimento do lado deles).

## Passo a passo — contenção imediata

1. **Revogar o issuer comprometido on-chain**, via `PLATFORM_ADMIN_ROLE` (multisig):
   ```
   cast send $IDENTITY_REGISTRY_ADDRESS "removerTrustedIssuer(address)" $ISSUER_COMPROMETIDO \
     --rpc-url $RPC_URL --private-key $ADMIN_KEY
   ```
   Efeito imediato: o endereço não pode mais chamar `emitirClaim`. **Claims já emitidas por ele continuam
   válidas** (`IdentityRegistry.isVerified` não reavalia o issuer retroativamente — ver
   `contracts/identity-registry.md`) — isso é intencional (não trava todos os investidores já verificados),
   mas significa que o passo 2 é obrigatório, não opcional.
2. **Auditar as claims emitidas pelo issuer comprometido** desde a janela de tempo suspeita: consultar os
   eventos `ClaimEmitida(carteira, topico, issuer)` filtrados por esse `issuer` (via indexador/subgraph ou
   `cast logs`). Cada claim suspeita de ter sido emitida fraudulentamente deve ser revogada individualmente:
   ```
   cast send $IDENTITY_REGISTRY_ADDRESS "revogarClaim(address,bytes32)" $CARTEIRA $KYC_APPROVED_TOPIC \
     --rpc-url $RPC_URL --private-key $ADMIN_KEY
   ```
   (`revogarClaim` é permitido ao `PLATFORM_ADMIN_ROLE` mesmo quando o issuer original não é mais o chamador.)
3. **Comunicar o incidente** ao provedor de KYC (para que revogue/rotacione a chave do lado dele) e, se algum
   investidor real teve a claim revogada por suspeita de fraude, à equipe de suporte/operação para tratamento
   caso a caso (a revogação não confisca cotas já compradas — só bloqueia novas entradas/transferências
   enquanto o KYC não for reemitido).

## Passo a passo — rotação (emitir a nova chave)

4. Provisionar a nova chave do provedor (hardware wallet do lado deles), seguindo o pré-requisito permanente
   acima.
5. **Adicionar o novo endereço como Trusted Issuer**, via multisig:
   ```
   cast send $IDENTITY_REGISTRY_ADDRESS "adicionarTrustedIssuer(address)" $NOVO_ISSUER \
     --rpc-url $RPC_URL --private-key $ADMIN_KEY
   ```
   Não há downtime: `IdentityRegistry` suporta múltiplos Trusted Issuers simultâneos (`RISK-03`), então o
   passo 5 pode acontecer antes ou depois do passo 1 sem bloquear novos cadastros — em geral, adicionar o
   novo issuer primeiro minimiza a janela sem verificação de KYC disponível.
6. Confirmar com `trustedIssuers()` (view) que a lista reflete o estado esperado (issuer comprometido fora,
   novo issuer dentro).

## Pós-incidente

- Registrar o incidente (data, issuer afetado, claims revogadas, tempo até contenção) — não em
  `PENDENCIAS.md`/`PROGRESS.md` (histórico de execução do projeto), mas no canal/ferramenta de gestão de
  incidentes da operação, uma vez definida (fora do escopo deste pacote técnico).
- Reforçar com o provedor de KYC o processo de custódia da chave, se a causa raiz for operacional do lado
  deles.

## Ferramentas alternativas ao `cast`

Qualquer client que assine transações a partir do multisig (Gnosis Safe UI, `forge script` com
`--ledger`/`--trezor`) serve igualmente — os comandos `cast send` acima assumem uma chave local só para
ilustrar a chamada; em produção a assinatura deve vir do fluxo do multisig/hardware wallet, nunca de uma
chave privada em texto puro num `.env`.
