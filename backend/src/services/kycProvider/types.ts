export type KycSubmissionInput = {
  investorId: string;
  cpf: string;
  forceResult?: "APPROVED" | "REJECTED";
};

export type KycSubmissionResult = {
  providerReference: string;
};

/**
 * Interface que qualquer provedor de KYC (mock ou real - Didit/Sumsub/idwall,
 * ver docs/PENDENCIAS.md) deve implementar. O provedor real e uma decisao de
 * negocio ainda pendente; esta interface permite trocar a implementacao sem
 * mexer nas rotas.
 */
export interface KycProvider {
  readonly name: string;
  submit(input: KycSubmissionInput): Promise<KycSubmissionResult>;
}
