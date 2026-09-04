import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../src/db/client.js";
import { buildServer } from "../src/server.js";
import { isVerifiedOnChain } from "../src/services/trustedIssuerSigner.js";

/**
 * Teste end-to-end real: exige Anvil rodando em RPC_URL com o
 * IdentityRegistry deployado (ver projeto_imobiliaria/broadcast/...31337) e
 * o Trusted Issuer do backend ja registrado (`npm run grant-trusted-issuer`).
 * Roda so com RUN_E2E=1 para nao quebrar `npm test` em maquinas sem a chain
 * local no ar.
 */
const shouldRun = process.env.RUN_E2E === "1";

describe.skipIf(!shouldRun)("fluxo KYC end-to-end contra Anvil local", () => {
  const app = buildServer();

  beforeEach(async () => {
    await prisma.kycSubmission.deleteMany();
    await prisma.investor.deleteMany();
  });

  it("emite a claim on-chain e isVerified passa a retornar true", async () => {
    const signup = await app.inject({
      method: "POST",
      url: "/investors",
      payload: { fullName: "Investidor E2E", email: "investidor-e2e@teste.local", cpf: "12312312312" },
    });
    const { walletAddress } = signup.json();
    const sid = signup.cookies.find((c) => c.name === "sid")?.value;

    expect(await isVerifiedOnChain(walletAddress)).toBe(false);

    await app.inject({
      method: "POST",
      url: "/kyc",
      cookies: { sid: sid as string },
      payload: { forceResult: "APPROVED" },
    });

    await vi.waitFor(
      async () => {
        expect(await isVerifiedOnChain(walletAddress)).toBe(true);
      },
      { timeout: 10000 },
    );
  });
});
