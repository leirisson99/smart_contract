/**
 * RF-32: toda mensagem de erro que chega do backend/contrato é traduzida
 * para linguagem não-técnica antes de ser exibida.
 */
export type CodigoErro =
  | "SEM_KYC"
  | "KYC_REPROVADO"
  | "COTAS_INSUFICIENTES"
  | "VALOR_MINIMO_NAO_ATINGIDO"
  | "LISTAGEM_JA_VENDIDA"
  | "LISTAGEM_NAO_ENCONTRADA"
  | "SALDO_INSUFICIENTE"
  | "ERRO_DESCONHECIDO";

const MENSAGENS: Record<CodigoErro, string> = {
  SEM_KYC: "Sua verificação de identidade precisa ser concluída antes de investir.",
  KYC_REPROVADO: "Sua verificação de identidade não foi aprovada. Entre em contato com o suporte.",
  COTAS_INSUFICIENTES: "Não há cotas suficientes disponíveis para essa quantidade.",
  VALOR_MINIMO_NAO_ATINGIDO: "A quantidade escolhida está abaixo do investimento mínimo.",
  LISTAGEM_JA_VENDIDA: "Essa listagem já foi vendida para outro investidor.",
  LISTAGEM_NAO_ENCONTRADA: "Essa listagem não está mais disponível.",
  SALDO_INSUFICIENTE: "Você não possui cotas suficientes para criar essa listagem.",
  ERRO_DESCONHECIDO: "Não foi possível concluir a ação. Tente novamente em instantes.",
};

export class ApiError extends Error {
  codigo: CodigoErro;

  constructor(codigo: CodigoErro) {
    super(codigo);
    this.codigo = codigo;
  }
}

export function traduzirErro(erro: unknown): string {
  if (erro instanceof ApiError) {
    return MENSAGENS[erro.codigo] ?? MENSAGENS.ERRO_DESCONHECIDO;
  }
  return MENSAGENS.ERRO_DESCONHECIDO;
}
