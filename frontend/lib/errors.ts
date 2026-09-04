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
  | "ROLE_INVALIDA"
  | "ERRO_DESCONHECIDO"
  // feature 006-autenticacao-investidor (login por HOTP)
  | "EMAIL_INVALIDO"
  | "EMAIL_JA_CADASTRADO"
  | "CODIGO_INVALIDO"
  | "CODIGO_EXPIRADO"
  | "LIMITE_SOLICITACOES_EXCEDIDO"
  | "LIMITE_TENTATIVAS_EXCEDIDO"
  | "SESSAO_INVALIDA";

const MENSAGENS: Record<CodigoErro, string> = {
  SEM_KYC: "Sua verificação de identidade precisa ser concluída antes de investir.",
  KYC_REPROVADO: "Sua verificação de identidade não foi aprovada. Entre em contato com o suporte.",
  COTAS_INSUFICIENTES: "Não há cotas suficientes disponíveis para essa quantidade.",
  VALOR_MINIMO_NAO_ATINGIDO: "A quantidade escolhida está abaixo do investimento mínimo.",
  LISTAGEM_JA_VENDIDA: "Essa listagem já foi vendida para outro investidor.",
  LISTAGEM_NAO_ENCONTRADA: "Essa listagem não está mais disponível.",
  SALDO_INSUFICIENTE: "Você não possui cotas suficientes para criar essa listagem.",
  ROLE_INVALIDA: "Acesso restrito ao gestor da plataforma.",
  ERRO_DESCONHECIDO: "Não foi possível concluir a ação. Tente novamente em instantes.",
  EMAIL_INVALIDO: "Informe um e-mail válido.",
  EMAIL_JA_CADASTRADO: "Já existe um cadastro com esse e-mail. Faça login em vez de se cadastrar novamente.",
  CODIGO_INVALIDO: "Código incorreto. Confira o e-mail e tente novamente.",
  CODIGO_EXPIRADO: "Esse código expirou. Solicite um novo.",
  LIMITE_SOLICITACOES_EXCEDIDO: "Aguarde um minuto antes de pedir um novo código.",
  LIMITE_TENTATIVAS_EXCEDIDO: "Muitas tentativas incorretas. Solicite um novo código.",
  SESSAO_INVALIDA: "Sua sessão expirou. Faça login novamente.",
};

export class ApiError extends Error {
  codigo: CodigoErro;
  status?: number;

  constructor(codigo: CodigoErro, status?: number) {
    super(codigo);
    this.codigo = codigo;
    this.status = status;
  }
}

export function traduzirErro(erro: unknown): string {
  if (erro instanceof ApiError) {
    return MENSAGENS[erro.codigo] ?? MENSAGENS.ERRO_DESCONHECIDO;
  }
  return MENSAGENS.ERRO_DESCONHECIDO;
}
