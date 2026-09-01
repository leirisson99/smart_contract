import { createHash } from "node:crypto";
import { v4 as uuidv4 } from "uuid";
import type { KycProvider, KycSubmissionInput, KycSubmissionResult } from "./types.js";

export type MockWebhookCallback = (input: {
  providerReference: string;
  result: "APPROVED" | "REJECTED";
  reason?: string;
}) => Promise<void>;

/**
 * Provedor de KYC mock para a POC (nenhum provedor real foi contratado -
 * docs/PENDENCIAS.md). Decide aprovado/reprovado de forma deterministica
 * (ultimo digito do hash do CPF) a menos que `forceResult` seja informado,
 * e dispara o callback de forma assincrona para simular o comportamento real
 * de um provedor (submit -> processamento -> webhook).
 */
export class MockKycProvider implements KycProvider {
  readonly name = "mock";

  constructor(
    private readonly onCallback: MockWebhookCallback,
    private readonly delayMs = 50,
  ) {}

  async submit(input: KycSubmissionInput): Promise<KycSubmissionResult> {
    const providerReference = uuidv4();
    const result = input.forceResult ?? this.decideDeterministically(input.cpf);

    setTimeout(() => {
      void this.onCallback({
        providerReference,
        result,
        reason: result === "REJECTED" ? "documento ilegivel (simulado)" : undefined,
      });
    }, this.delayMs);

    return { providerReference };
  }

  private decideDeterministically(cpf: string): "APPROVED" | "REJECTED" {
    const digest = createHash("sha256").update(cpf).digest();
    return digest[digest.length - 1] % 10 === 0 ? "REJECTED" : "APPROVED";
  }
}
