import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../src/db/client.js";

vi.mock("../src/services/trustedIssuerSigner.js", () => ({
  emitirClaimOnChain: vi.fn(async () => "0xrouteclaim"),
}));

import { buildServer } from "../src/server.js";

/** POST /investors ja autentica (feature 006) - extrai o cookie de sessao do Set-Cookie da propria resposta de cadastro. */
function cookieDoCadastro(res: { cookies: Array<{ name: string; value: string }> }): { sid: string } {
  const sid = res.cookies.find((c) => c.name === "sid");
  if (!sid) throw new Error("POST /investors nao setou cookie de sessao");
  return { sid: sid.value };
}

let contadorEmail = 0;
function emailUnico(): string {
  contadorEmail += 1;
  return `investidor${contadorEmail}@teste.local`;
}

describe("fluxo HTTP de onboarding + KYC", () => {
  const app = buildServer();

  beforeEach(async () => {
    contadorEmail = 0;
    await prisma.kycSubmission.deleteMany();
    await prisma.investor.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it("cadastra investidor (ja autenticado), submete KYC aprovado e reflete o status via GET", async () => {
    const signup = await app.inject({
      method: "POST",
      url: "/investors",
      payload: { fullName: "Maria Investidora", email: emailUnico(), cpf: "11122233344" },
    });
    expect(signup.statusCode).toBe(201);
    const { walletAddress } = signup.json();
    expect(walletAddress).toMatch(/^0x[0-9a-fA-F]{40}$/);
    const cookies = cookieDoCadastro(signup);

    const submit = await app.inject({
      method: "POST",
      url: "/kyc",
      cookies,
      payload: { forceResult: "APPROVED" },
    });
    expect(submit.statusCode).toBe(202);

    await vi.waitFor(async () => {
      const status = await app.inject({ method: "GET", url: "/kyc", cookies });
      expect(status.json().status).toBe("APPROVED");
    });

    const final = await app.inject({ method: "GET", url: "/kyc", cookies });
    expect(final.json().claimTxHash).toBe("0xrouteclaim");
  });

  it("reprova e permite reenvio de documentos", async () => {
    const signup = await app.inject({
      method: "POST",
      url: "/investors",
      payload: { fullName: "Joao Reprovado", email: emailUnico(), cpf: "99988877766" },
    });
    const cookies = cookieDoCadastro(signup);

    await app.inject({ method: "POST", url: "/kyc", cookies, payload: { forceResult: "REJECTED" } });
    await vi.waitFor(async () => {
      const status = await app.inject({ method: "GET", url: "/kyc", cookies });
      expect(status.json().status).toBe("REJECTED");
    });

    const resubmit = await app.inject({ method: "POST", url: "/kyc", cookies, payload: { forceResult: "APPROVED" } });
    expect(resubmit.statusCode).toBe(202);
  });

  it("bloqueia nova submissao enquanto a atual nao foi reprovada", async () => {
    const signup = await app.inject({
      method: "POST",
      url: "/investors",
      payload: { fullName: "Ana Duplicada", email: emailUnico(), cpf: "55566677788" },
    });
    const cookies = cookieDoCadastro(signup);

    await app.inject({ method: "POST", url: "/kyc", cookies, payload: { forceResult: "APPROVED" } });
    const second = await app.inject({ method: "POST", url: "/kyc", cookies, payload: { forceResult: "APPROVED" } });
    expect(second.statusCode).toBe(409);
  });

  it("rejeita cadastro com e-mail ja usado", async () => {
    const email = emailUnico();
    await app.inject({ method: "POST", url: "/investors", payload: { fullName: "Primeiro", email, cpf: "11111111111" } });
    const segundo = await app.inject({
      method: "POST",
      url: "/investors",
      payload: { fullName: "Segundo", email, cpf: "22222222222" },
    });
    expect(segundo.statusCode).toBe(409);
    expect(segundo.json().codigo).toBe("EMAIL_JA_CADASTRADO");
  });
});
