import { OTP } from "otplib";

/**
 * Login do investidor (feature 006-autenticacao-investidor) usa HOTP puro
 * (RFC 4226, contador) via otplib em vez de reimplementar o truncamento
 * dinamico do RFC a mao - facil de errar sutilmente nos detalhes (offset dos
 * 4 bits baixos do ultimo byte do HMAC, mascara de 31 bits, modulo 10^digitos).
 * `counterTolerance: 0` (sem janela de look-ahead) porque quem gera o
 * desafio e o proprio servidor (nunca um app autenticador independente) -
 * nao ha desvio de contador possivel entre gerar e verificar.
 */
const otp = new OTP({ strategy: "hotp" });

/** Gera um novo segredo HOTP (Base32, formato esperado pelo otplib) para um investidor - gerado uma unica vez, no cadastro. */
export function gerarSegredoOtp(): string {
  return otp.generateSecret();
}

/** Calcula o codigo do contador atual - nunca armazenado, sempre recalculado a partir de segredo+contador no momento do envio/verificacao. */
export function gerarCodigoOtp(secretoBase32: string, counter: number): Promise<string> {
  return otp.generate({ secret: secretoBase32, counter });
}

/** Verifica um codigo recebido contra o HOTP esperado para aquele contador. */
export async function codigoOtpValido(secretoBase32: string, counter: number, codigoRecebido: string): Promise<boolean> {
  const resultado = await otp.verify({ secret: secretoBase32, token: codigoRecebido, counter, counterTolerance: 0 });
  return resultado.valid;
}
