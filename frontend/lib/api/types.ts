export type StatusKyc = "pendente" | "aprovado" | "reprovado";

export interface Investidor {
  id: string;
  nome: string;
  /** Coletado no cadastro e usado como login (feature 006-autenticacao-investidor, HOTP por e-mail). */
  email?: string;
  /** So preenchido por `GET /auth/me` (006) e `GET /admin/investidores` (005). */
  walletAddress?: string;
  statusKyc: StatusKyc;
}

export type StatusImovel = "em_captacao" | "vendido" | "alugado";

export interface Imovel {
  id: string;
  nome: string;
  imagemUrl: string;
  valorTotal: number;
  totalCotas: number;
  cotasRestantes: number;
  precoPorCota: number;
  rendimentoEstimadoAnual: number;
  status: StatusImovel;
  valorMinimoInvestimento: number;
}

export interface Holding {
  imovelId: string;
  imovelNome: string;
  cotas: number;
  valorInvestido: number;
}

export interface RendimentoRecebido {
  id: string;
  imovelNome: string;
  cicloReferencia: string;
  valor: number;
  dataRecebimento: string;
}

export interface Portfolio {
  holdings: Holding[];
  valorTotalInvestido: number;
  rendimentosRecebidos: RendimentoRecebido[];
  rendimentoPendenteClaim: number;
}

export type StatusListagem = "ativa" | "vendida" | "cancelada";

export interface Listagem {
  id: string;
  imovelId: string;
  imovelNome: string;
  vendedorNome: string;
  cotas: number;
  precoPorCota: number;
  status: StatusListagem;
  criadaPeloUsuarioAtual: boolean;
}
