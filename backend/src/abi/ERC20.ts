/**
 * ABI minima de um ERC-20 padrao, usada para aprovar a moeda de pagamento
 * (`PropertyToken.moedaPagamento`) antes de `comprarCotas`. Escrita a mao (nao
 * copiada de um artifact) porque a moeda real ainda e uma decisao de negocio
 * em aberto (RISK-08, docs/PENDENCIAS.md) - qualquer ERC-20 padrao funciona,
 * incluindo o MockERC20 usado em dev/teste.
 */
export const erc20Abi = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;
