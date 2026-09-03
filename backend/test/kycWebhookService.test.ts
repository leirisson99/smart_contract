import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../src/db/client.js";

vi.mock("../src/services/trustedIssuerSigner.js", () => ({
  emitirClaimOnChain: vi.fn(async () => "0xdeadbeef"),
}));

import { emitirClaimOnChain } from "../src/services/trustedIssuerSigner.js";
import { processKycWebhookResult } from "../src/services/kycWebhookService.js";
import { createCustodialWallet, encryptSecret } from "../src/services/walletCustody.js";

async function createInvestorWithSubmission(providerReference: string) {
  const wallet = createCustodialWallet();
  const investor = await prisma.investor.create({
    data: {
      fullName: "Investidor Teste",
      cpfEncrypted: encryptSecret("12345678900"),
      walletAddress: wallet.address,
      walletKeyEnc: wallet.walletKeyEnc,
    },
  });
  const submission = await prisma.kycSubmission.create({
    data: { investorId: investor.id, status: "PENDING", provider: "mock", providerReference },
  });
  return { investor, submission };
}

describe("processKycWebhookResult", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await prisma.kycSubmission.deleteMany();
    await prisma.investor.deleteMany();
  });

  it("aprova e emite claim on-chain", async () => {
    const { submission } = await createInvestorWithSubmission("ref-approved");

    await processKycWebhookResult({ providerReference: "ref-approved", result: "APPROVED" });

    const updated = await prisma.kycSubmission.findUniqueOrThrow({ where: { id: submission.id } });
    expect(updated.status).toBe("APPROVED");
    expect(updated.claimTxHash).toBe("0xdeadbeef");
    expect(emitirClaimOnChain).toHaveBeenCalledTimes(1);
  });

  it("reprova sem chamar a chain", async () => {
    const { submission } = await createInvestorWithSubmission("ref-rejected");

    await processKycWebhookResult({
      providerReference: "ref-rejected",
      result: "REJECTED",
      reason: "documento ilegivel",
    });

    const updated = await prisma.kycSubmission.findUniqueOrThrow({ where: { id: submission.id } });
    expect(updated.status).toBe("REJECTED");
    expect(updated.rejectionReason).toBe("documento ilegivel");
    expect(emitirClaimOnChain).not.toHaveBeenCalled();
  });

  it("e idempotente: webhook duplicado (retry do provedor) nao emite claim duas vezes", async () => {
    await createInvestorWithSubmission("ref-dup");

    await Promise.all([
      processKycWebhookResult({ providerReference: "ref-dup", result: "APPROVED" }),
      processKycWebhookResult({ providerReference: "ref-dup", result: "APPROVED" }),
    ]);

    expect(emitirClaimOnChain).toHaveBeenCalledTimes(1);
  });

  it("ignora providerReference desconhecida (nao quebra em replay/teste externo)", async () => {
    await expect(
      processKycWebhookResult({ providerReference: "nao-existe", result: "APPROVED" }),
    ).resolves.toBeUndefined();
    expect(emitirClaimOnChain).not.toHaveBeenCalled();
  });

  it("volta para REJECTED (nao fica travado em PROCESSING) quando a claim on-chain falha", async () => {
    vi.mocked(emitirClaimOnChain).mockRejectedValueOnce(new Error("rpc indisponivel"));
    const { submission } = await createInvestorWithSubmission("ref-falha-chain");

    await expect(
      processKycWebhookResult({ providerReference: "ref-falha-chain", result: "APPROVED" }),
    ).rejects.toThrow("rpc indisponivel");

    const updated = await prisma.kycSubmission.findUniqueOrThrow({ where: { id: submission.id } });
    expect(updated.status).toBe("REJECTED");
    expect(updated.claimTxHash).toBeNull();
  });
});
