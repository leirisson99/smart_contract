import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../src/db/client.js";
import { createCustodialWallet, decryptSecret, encryptSecret } from "../src/services/walletCustody.js";
import { gerarCodigoOtp, gerarSegredoOtp } from "../src/services/hotp.js";
import { buildServer } from "../src/server.js";

async function createInvestor(email: string) {
  const wallet = createCustodialWallet();
  return prisma.investor.create({
    data: {
      fullName: "Investidor Teste",
      email,
      cpfEncrypted: encryptSecret("12345678900"),
      walletAddress: wallet.address,
      walletKeyEnc: wallet.walletKeyEnc,
      otpSecretEnc: encryptSecret(gerarSegredoOtp()),
    },
  });
}

/** Le o estado HOTP atual do investidor no banco e recalcula o codigo esperado - sem depender de capturar o e-mail enviado. */
async function codigoEsperadoAtual(investorId: string): Promise<string> {
  const investor = await prisma.investor.findUniqueOrThrow({ where: { id: investorId } });
  return gerarCodigoOtp(decryptSecret(investor.otpSecretEnc), investor.otpCounter);
}

describe("login por HOTP (feature 006-autenticacao-investidor)", () => {
  const app = buildServer();
  let contadorIp = 0;

  // POST /auth/otp/solicitar tem rate-limit por IP (5/min, alem do cooldown
  // de 60s por e-mail) - com um unico `app` compartilhado pelo describe (mesmo
  // padrao dos outros arquivos de teste), todo `app.inject` sem `remoteAddress`
  // cairia no mesmo IP e os testes se contaminariam entre si. Cada teste usa
  // um IP simulado proprio para isolar o rate-limit; o teste de cooldown
  // reusa o mesmo IP nas suas duas chamadas de proposito (testa o cooldown
  // por e-mail, nao o rate-limit por IP).
  function proximoIp(): string {
    contadorIp += 1;
    return `10.0.0.${contadorIp}`;
  }

  beforeEach(async () => {
    vi.useRealTimers();
    await prisma.investorSession.deleteMany();
    await prisma.kycSubmission.deleteMany();
    await prisma.investor.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /investors ja autentica no cadastro (Set-Cookie na propria resposta 201)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/investors",
      payload: { fullName: "Nova Investidora", email: "nova@teste.local", cpf: "11122233344" },
    });
    expect(res.statusCode).toBe(201);
    const sid = res.cookies.find((c) => c.name === "sid");
    expect(sid).toBeTruthy();

    const me = await app.inject({ method: "GET", url: "/auth/me", cookies: { sid: sid!.value } });
    expect(me.statusCode).toBe(200);
    expect(me.json().email).toBe("nova@teste.local");
  });

  it("rejeita cadastro com e-mail duplicado", async () => {
    await createInvestor("duplicado@teste.local");
    const res = await app.inject({
      method: "POST",
      url: "/investors",
      payload: { fullName: "Outro", email: "duplicado@teste.local", cpf: "99988877766" },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().codigo).toBe("EMAIL_JA_CADASTRADO");
  });

  it("solicitar -> verificar emite sessao valida (GET /auth/me)", async () => {
    const investor = await createInvestor("login@teste.local");

    const solicitar = await app.inject({
      method: "POST",
      url: "/auth/otp/solicitar",
      remoteAddress: proximoIp(),
      payload: { email: investor.email },
    });
    expect(solicitar.statusCode).toBe(202);

    const codigo = await codigoEsperadoAtual(investor.id);
    const verificar = await app.inject({
      method: "POST",
      url: "/auth/otp/verificar",
      payload: { email: investor.email, codigo },
    });
    expect(verificar.statusCode).toBe(200);
    expect(verificar.json().investorId).toBe(investor.id);
    const sid = verificar.cookies.find((c) => c.name === "sid");
    expect(sid).toBeTruthy();

    const me = await app.inject({ method: "GET", url: "/auth/me", cookies: { sid: sid!.value } });
    expect(me.statusCode).toBe(200);
    expect(me.json().investorId).toBe(investor.id);
  });

  it("responde 202 identico para e-mail nao cadastrado (anti-enumeracao)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/otp/solicitar",
      remoteAddress: proximoIp(),
      payload: { email: "fantasma@teste.local" },
    });
    expect(res.statusCode).toBe(202);
    expect(res.json()).toEqual({ ok: true });
  });

  it("rejeita codigo errado com CODIGO_INVALIDO e incrementa tentativas", async () => {
    const investor = await createInvestor("errado@teste.local");
    await app.inject({ method: "POST", url: "/auth/otp/solicitar", remoteAddress: proximoIp(), payload: { email: investor.email } });

    const res = await app.inject({
      method: "POST",
      url: "/auth/otp/verificar",
      payload: { email: investor.email, codigo: "000000" },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().codigo).toBe("CODIGO_INVALIDO");

    const atualizado = await prisma.investor.findUniqueOrThrow({ where: { id: investor.id } });
    expect(atualizado.otpAttempts).toBe(1);
  });

  it("bloqueia apos exceder o limite de tentativas (LIMITE_TENTATIVAS_EXCEDIDO)", async () => {
    const investor = await createInvestor("tentativas@teste.local");
    await app.inject({ method: "POST", url: "/auth/otp/solicitar", remoteAddress: proximoIp(), payload: { email: investor.email } });

    for (let i = 0; i < 5; i += 1) {
      await app.inject({ method: "POST", url: "/auth/otp/verificar", payload: { email: investor.email, codigo: "000000" } });
    }

    const codigoCorreto = await codigoEsperadoAtual(investor.id);
    const res = await app.inject({
      method: "POST",
      url: "/auth/otp/verificar",
      payload: { email: investor.email, codigo: codigoCorreto },
    });
    expect(res.statusCode).toBe(429);
    expect(res.json().codigo).toBe("LIMITE_TENTATIVAS_EXCEDIDO");
  });

  it("rejeita codigo expirado (CODIGO_EXPIRADO)", async () => {
    const investor = await createInvestor("expirado@teste.local");
    await app.inject({ method: "POST", url: "/auth/otp/solicitar", remoteAddress: proximoIp(), payload: { email: investor.email } });
    const codigo = await codigoEsperadoAtual(investor.id);

    await prisma.investor.update({ where: { id: investor.id }, data: { otpCodeExpiresAt: new Date(Date.now() - 1000) } });

    const res = await app.inject({ method: "POST", url: "/auth/otp/verificar", payload: { email: investor.email, codigo } });
    expect(res.statusCode).toBe(401);
    expect(res.json().codigo).toBe("CODIGO_EXPIRADO");
  });

  it("um codigo ja verificado com sucesso nao pode ser reusado (replay)", async () => {
    const investor = await createInvestor("replay@teste.local");
    await app.inject({ method: "POST", url: "/auth/otp/solicitar", remoteAddress: proximoIp(), payload: { email: investor.email } });
    const codigo = await codigoEsperadoAtual(investor.id);

    const primeira = await app.inject({ method: "POST", url: "/auth/otp/verificar", payload: { email: investor.email, codigo } });
    expect(primeira.statusCode).toBe(200);

    const segunda = await app.inject({ method: "POST", url: "/auth/otp/verificar", payload: { email: investor.email, codigo } });
    expect(segunda.statusCode).toBe(401);
    expect(segunda.json().codigo).toBe("CODIGO_INVALIDO");
  });

  it("pedir um novo codigo invalida implicitamente o anterior ainda nao usado", async () => {
    const investor = await createInvestor("reenvio@teste.local");
    const ip = proximoIp();
    await app.inject({ method: "POST", url: "/auth/otp/solicitar", remoteAddress: ip, payload: { email: investor.email } });
    const codigoAntigo = await codigoEsperadoAtual(investor.id);

    // Cooldown de 60s entre solicitacoes - zera otpLastRequestedAt para simular passagem de tempo sem depender de fake timers no Fastify.
    await prisma.investor.update({ where: { id: investor.id }, data: { otpLastRequestedAt: null } });
    await app.inject({ method: "POST", url: "/auth/otp/solicitar", remoteAddress: ip, payload: { email: investor.email } });

    const res = await app.inject({
      method: "POST",
      url: "/auth/otp/verificar",
      payload: { email: investor.email, codigo: codigoAntigo },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().codigo).toBe("CODIGO_INVALIDO");
  });

  it("respeita o cooldown entre solicitacoes (LIMITE_SOLICITACOES_EXCEDIDO)", async () => {
    const investor = await createInvestor("cooldown@teste.local");
    const ip = proximoIp();
    await app.inject({ method: "POST", url: "/auth/otp/solicitar", remoteAddress: ip, payload: { email: investor.email } });

    const res = await app.inject({ method: "POST", url: "/auth/otp/solicitar", remoteAddress: ip, payload: { email: investor.email } });
    expect(res.statusCode).toBe(429);
    expect(res.json().codigo).toBe("LIMITE_SOLICITACOES_EXCEDIDO");
  });

  it("GET /auth/me sem cookie retorna SESSAO_INVALIDA", async () => {
    const res = await app.inject({ method: "GET", url: "/auth/me" });
    expect(res.statusCode).toBe(401);
    expect(res.json().codigo).toBe("SESSAO_INVALIDA");
  });

  it("POST /auth/logout revoga a sessao - GET /auth/me deixa de funcionar depois", async () => {
    const investor = await createInvestor("logout@teste.local");
    await app.inject({ method: "POST", url: "/auth/otp/solicitar", remoteAddress: proximoIp(), payload: { email: investor.email } });
    const codigo = await codigoEsperadoAtual(investor.id);
    const verificar = await app.inject({ method: "POST", url: "/auth/otp/verificar", payload: { email: investor.email, codigo } });
    const cookies = { sid: verificar.cookies.find((c) => c.name === "sid")!.value };

    const logout = await app.inject({ method: "POST", url: "/auth/logout", cookies });
    expect(logout.statusCode).toBe(200);

    const me = await app.inject({ method: "GET", url: "/auth/me", cookies });
    expect(me.statusCode).toBe(401);
  });
});
