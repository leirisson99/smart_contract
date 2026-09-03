export type StatusKyc = "pendente" | "aprovado" | "reprovado";

export interface Investidor {
  id: string;
  nome: string;
  /** Nao coletado por `POST /investors` (001) - so existe para o investidor da sessao atual, digitado no cadastro; nunca vem do backend (ver `GET /admin/investidores`, 005). */
  email?: string;
  /** So preenchido por `GET /admin/investidores` (005) - o investidor da sessao atual nao guarda a propria carteira no frontend. */
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
