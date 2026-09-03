import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../src/db/client.js";
import { config } from "../src/config.js";
import { createCustodialWallet, encryptSecret } from "../src/services/walletCustody.js";

vi.mock("../src/services/trustedIssuerSigner.js", () => ({
  emitirClaimOnChain: vi.fn(async () => "0xwebhookclaim"),
}));

import { buildServer } from "../src/server.js";

const WEBHOOK_HEADERS = { "x-kyc-webhook-secret": config.kycWebhookSecret };

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
  await prisma.kycSubmission.create({
    data: { investorId: investor.id, status: "PENDING", provider: "mock", providerReference },
  });
  return investor;
}

describe("POST /webhooks/kyc/mock", () => {
  const app = buildServer();

  beforeEach(async () => {
    vi.clearAllMocks();
    await prisma.kycSubmission.deleteMany();
    await prisma.investor.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it("rejeita sem o header x-kyc-webhook-secret", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/webhooks/kyc/mock",
      payload: { providerReference: "ref-sem-header", result: "APPROVED" },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().codigo).toBe("SEGREDO_INVALIDO");
  });

  it("rejeita com um segredo incorreto (nao deixa forcar aprovacao de KYC de outrem)", async () => {
    await createInvestorWithSubmission("ref-segredo-errado");

    const res = await app.inject({
      method: "POST",
      url: "/webhooks/kyc/mock",
      headers: { "x-kyc-webhook-secret": "segredo-errado" },
      payload: { providerReference: "ref-segredo-errado", result: "APPROVED" },
    });
    expect(res.statusCode).toBe(403);

    const submission = await prisma.kycSubmission.findFirst({ where: { providerReference: "ref-segredo-errado" } });
    expect(submission?.status).toBe("PENDING");
  });

  it("aceita com o segredo correto e processa o resultado", async () => {
    await createInvestorWithSubmission("ref-segredo-certo");

    const res = await app.inject({
      method: "POST",
      url: "/webhooks/kyc/mock",
      headers: WEBHOOK_HEADERS,
      payload: { providerReference: "ref-segredo-certo", result: "APPROVED" },
    });
    expect(res.statusCode).toBe(200);

    const submission = await prisma.kycSubmission.findFirst({ where: { providerReference: "ref-segredo-certo" } });
    expect(submission?.status).toBe("APPROVED");
  });
});
