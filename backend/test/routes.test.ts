import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../src/db/client.js";

vi.mock("../src/services/trustedIssuerSigner.js", () => ({
  emitirClaimOnChain: vi.fn(async () => "0xrouteclaim"),
}));

import { buildServer } from "../src/server.js";

describe("fluxo HTTP de onboarding + KYC", () => {
  const app = buildServer();

  beforeEach(async () => {
    await prisma.kycSubmission.deleteMany();
    await prisma.investor.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it("cadastra investidor, submete KYC aprovado e reflete o status via GET", async () => {
    const signup = await app.inject({
      method: "POST",
      url: "/investors",
      payload: { fullName: "Maria Investidora", cpf: "11122233344" },
    });
    expect(signup.statusCode).toBe(201);
    const { investorId, walletAddress } = signup.json();
    expect(walletAddress).toMatch(/^0x[0-9a-fA-F]{40}$/);

    const submit = await app.inject({
      method: "POST",
      url: `/investors/${investorId}/kyc`,
      payload: { forceResult: "APPROVED" },
    });
    expect(submit.statusCode).toBe(202);

    await vi.waitFor(async () => {
      const status = await app.inject({ method: "GET", url: `/investors/${investorId}/kyc` });
      expect(status.json().status).toBe("APPROVED");
    });

    const final = await app.inject({ method: "GET", url: `/investors/${investorId}/kyc` });
    expect(final.json().claimTxHash).toBe("0xrouteclaim");
  });

  it("reprova e permite reenvio de documentos", async () => {
    const signup = await app.inject({
      method: "POST",
      url: "/investors",
      payload: { fullName: "Joao Reprovado", cpf: "99988877766" },
    });
    const { investorId } = signup.json();

    await app.inject({
      method: "POST",
      url: `/investors/${investorId}/kyc`,
      payload: { forceResult: "REJECTED" },
    });
    await vi.waitFor(async () => {
      const status = await app.inject({ method: "GET", url: `/investors/${investorId}/kyc` });
      expect(status.json().status).toBe("REJECTED");
    });

    const resubmit = await app.inject({
      method: "POST",
      url: `/investors/${investorId}/kyc`,
      payload: { forceResult: "APPROVED" },
    });
    expect(resubmit.statusCode).toBe(202);
  });

  it("bloqueia nova submissao enquanto a atual nao foi reprovada", async () => {
    const signup = await app.inject({
      method: "POST",
      url: "/investors",
      payload: { fullName: "Ana Duplicada", cpf: "55566677788" },
    });
    const { investorId } = signup.json();

    await app.inject({
      method: "POST",
      url: `/investors/${investorId}/kyc`,
      payload: { forceResult: "APPROVED" },
    });
    const second = await app.inject({
      method: "POST",
      url: `/investors/${investorId}/kyc`,
      payload: { forceResult: "APPROVED" },
    });
    expect(second.statusCode).toBe(409);
  });
});
