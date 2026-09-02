import { config } from "../src/config.js";
import { emitirClaimOnChain, isVerifiedOnChain } from "../src/services/trustedIssuerSigner.js";

/**
 * Emite a claim KYC_APPROVED para o proprio endereco do `Marketplace`
 * (MARKETPLACE_ADDRESS) - sem isso o contrato nao consegue receber/manter
 * cotas em escrow, ja que toda transferencia de `PropertyToken` passa pelo
 * mesmo `ComplianceModule.canTransfer` da emissao primaria (ver comentario em
 * `projeto_imobiliaria/src/Marketplace.sol`). Passo de deploy local, roda uma
 * vez por Anvil (que nao persiste estado entre reinicios).
 */
async function main() {
  const jaVerificado = await isVerifiedOnChain(config.marketplaceAddress);
  if (jaVerificado) {
    console.log(`Marketplace ${config.marketplaceAddress} ja possui claim KYC_APPROVED.`);
    return;
  }

  const hash = await emitirClaimOnChain(config.marketplaceAddress);
  console.log(`Claim KYC_APPROVED emitida para o Marketplace ${config.marketplaceAddress} (tx ${hash})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
