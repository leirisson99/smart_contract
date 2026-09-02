import type { Imovel, Investidor, Listagem, Portfolio } from "./types";

export const investidorDemo: Investidor = {
  id: "inv-001",
  nome: "Investidor Demo",
  email: "investidor@example.com",
  statusKyc: "pendente",
};

export const imoveis: Imovel[] = [
  {
    id: "imv-001",
    nome: "Edifício Jardins Corporate",
    imagemUrl:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=800&auto=format&fit=crop",
    valorTotal: 10_000_000,
    totalCotas: 1000,
    cotasRestantes: 342,
    precoPorCota: 10_000,
    rendimentoEstimadoAnual: 0.096,
    status: "em_captacao",
    valorMinimoInvestimento: 10_000,
  },
  {
    id: "imv-002",
    nome: "Residencial Vila Madalena",
    imagemUrl:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=800&auto=format&fit=crop",
    valorTotal: 6_500_000,
    totalCotas: 650,
    cotasRestantes: 0,
    precoPorCota: 10_000,
    rendimentoEstimadoAnual: 0.084,
    status: "alugado",
    valorMinimoInvestimento: 10_000,
  },
];

export const portfolioDemo: Portfolio = {
  holdings: [{ imovelId: "imv-002", imovelNome: "Residencial Vila Madalena", cotas: 5, valorInvestido: 50_000 }],
  valorTotalInvestido: 50_000,
  rendimentosRecebidos: [
    {
      id: "rend-001",
      imovelNome: "Residencial Vila Madalena",
      cicloReferencia: "Julho/2026",
      valor: 350.5,
      dataRecebimento: "2026-08-05",
    },
  ],
  rendimentoPendenteClaim: 175.25,
};

export const listagens: Listagem[] = [
  {
    id: "lst-001",
    imovelId: "imv-002",
    imovelNome: "Residencial Vila Madalena",
    vendedorNome: "Maria S.",
    cotas: 2,
    precoPorCota: 10_500,
    status: "ativa",
    criadaPeloUsuarioAtual: false,
  },
];

export const investidoresAdmin: Investidor[] = [
  investidorDemo,
  { id: "inv-002", nome: "Maria Souza", email: "maria@example.com", statusKyc: "aprovado" },
  { id: "inv-003", nome: "João Pereira", email: "joao@example.com", statusKyc: "reprovado" },
];
