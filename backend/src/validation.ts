import type { ZodError } from "zod";

/** Junta as mensagens de um ZodError num unico texto para o corpo `{ error }` de um 400. */
export function mensagemErroZod(erro: ZodError): string {
  return erro.issues.map((issue) => issue.message).join("; ");
}
