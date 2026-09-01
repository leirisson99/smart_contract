import { prisma } from "../db/client.js";
import { emitirClaimOnChain } from "./trustedIssuerSigner.js";

export type KycWebhookInput = {
  providerReference: string;
  result: "APPROVED" | "REJECTED";
  reason?: string;
};

/**
 * Processa o resultado de uma submissao de KYC vindo do provedor (mock ou
 * real). Usado tanto pela rota POST /webhooks/kyc/mock quanto pelo callback
 * interno do MockKycProvider, garantindo o mesmo caminho de idempotencia
 * para as duas origens.
 *
 * A transicao PENDING -> PROCESSING/REJECTED e feita com um update
 * condicional (`updateMany` filtrando `status: "PENDING"`) para que uma
 * chamada duplicada do webhook (retry do provedor) nunca emita a claim
 * on-chain duas vezes.
 */
export async function processKycWebhookResult(input: KycWebhookInput): Promise<void> {
  const submission = await prisma.kycSubmission.findFirst({
    where: { providerReference: input.providerReference },
  });
  if (!submission) return;

  const claimed = await prisma.kycSubmission.updateMany({
    where: { id: submission.id, status: "PENDING" },
    data:
      input.result === "APPROVED"
        ? { status: "PROCESSING" }
        : { status: "REJECTED", rejectionReason: input.reason },
  });
  if (claimed.count === 0) return;
  if (input.result === "REJECTED") return;

  const investor = await prisma.investor.findUniqueOrThrow({ where: { id: submission.investorId } });
  const claimTxHash = await emitirClaimOnChain(investor.walletAddress as `0x${string}`);
  await prisma.kycSubmission.update({
    where: { id: submission.id },
    data: { status: "APPROVED", claimTxHash },
  });
}
