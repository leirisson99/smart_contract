import { createWalletClient, http, parseEventLogs } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { config } from "../config.js";
import { chain, publicClient } from "../chain.js";
import { marketplaceAbi } from "../abi/Marketplace.js";
import { propertyTokenAbi } from "../abi/PropertyToken.js";
import { erc20Abi } from "../abi/ERC20.js";

export type ListagemOnChain = {
  vendedor: `0x${string}`;
  propertyToken: `0x${string}`;
  quantidadeDisponivel: bigint;
  precoPorCota: bigint;
  ativa: boolean;
};

/**
 * `writeContract` da viem nao simula antes de enviar - uma chamada que
 * reverte (ex.: SEC-04, duas compras concorrentes sobre a mesma listagem)
 * ainda assim e minerada, e `waitForTransactionReceipt` retorna normalmente
 * com `status: "reverted"` em vez de lancar. Sem checar isso explicitamente,
 * o caller trataria a transacao revertida como sucesso.
 */
export class TransacaoRevertidaError extends Error {
  constructor(hash: `0x${string}`) {
    super(`transacao ${hash} revertida on-chain`);
  }
}

function walletClientFor(privateKey: `0x${string}`) {
  return createWalletClient({ account: privateKeyToAccount(privateKey), chain, transport: http(config.rpcUrl) });
}

async function aguardarSucesso(hash: `0x${string}`) {
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status === "reverted") throw new TransacaoRevertidaError(hash);
  return receipt;
}

export async function listagensAtivasPorTokenOnChain(propertyTokenAddress: `0x${string}`): Promise<bigint[]> {
  return publicClient.readContract({
    address: config.marketplaceAddress,
    abi: marketplaceAbi,
    functionName: "listagensAtivasPorToken",
    args: [propertyTokenAddress],
  }) as Promise<bigint[]>;
}

export async function lerListagemOnChain(idListagem: bigint): Promise<ListagemOnChain> {
  const [vendedor, propertyToken, quantidadeDisponivel, precoPorCota, ativa] = (await publicClient.readContract({
    address: config.marketplaceAddress,
    abi: marketplaceAbi,
    functionName: "listagem",
    args: [idListagem],
  })) as [`0x${string}`, `0x${string}`, bigint, bigint, boolean];
  return { vendedor, propertyToken, quantidadeDisponivel, precoPorCota, ativa };
}

/**
 * Assina `PropertyToken.approve` (escrow) + `Marketplace.listar` em nome da
 * carteira custodial do vendedor (RF-34). `listar` puxa as cotas do vendedor
 * via `transferFrom`, que exige allowance previa - mesmo padrao de
 * approve-antes-de-chamar de `propertyChain.comprarCotasOnChain`. O
 * `idListagem` gerado on-chain nao volta como valor de retorno de uma
 * transacao (so em `eth_call`/simulacao) - extraido do evento
 * `ListagemCriada` no recibo.
 */
export async function listarOnChain(params: {
  vendedorPrivateKey: `0x${string}`;
  propertyTokenAddress: `0x${string}`;
  quantidade: bigint;
  precoPorCota: bigint;
}): Promise<{ idListagem: bigint; txHash: `0x${string}` }> {
  const wallet = walletClientFor(params.vendedorPrivateKey);

  const approveHash = await wallet.writeContract({
    address: params.propertyTokenAddress,
    abi: propertyTokenAbi,
    functionName: "approve",
    args: [config.marketplaceAddress, params.quantidade],
  });
  await aguardarSucesso(approveHash);

  const hash = await wallet.writeContract({
    address: config.marketplaceAddress,
    abi: marketplaceAbi,
    functionName: "listar",
    args: [params.propertyTokenAddress, params.quantidade, params.precoPorCota],
  });
  const receipt = await aguardarSucesso(hash);

  const [evento] = parseEventLogs({ abi: marketplaceAbi, eventName: "ListagemCriada", logs: receipt.logs }) as unknown as {
    args: { idListagem: bigint };
  }[];
  if (!evento) throw new Error("evento ListagemCriada nao encontrado no recibo de Marketplace.listar");

  return { idListagem: evento.args.idListagem, txHash: hash };
}

/**
 * Assina `moedaPagamento.approve` + `Marketplace.comprar` em nome da
 * carteira custodial do comprador (RF-35). `comprar` cobra o valor total da
 * listagem via `safeTransferFrom` (vendedor + taxa da tesouraria), mesmo
 * padrao de approve-antes-de-chamar da compra primaria.
 */
export async function comprarOnChain(params: {
  compradorPrivateKey: `0x${string}`;
  moedaPagamento: `0x${string}`;
  idListagem: bigint;
  quantidade: bigint;
  valorTotal: bigint;
}): Promise<`0x${string}`> {
  const wallet = walletClientFor(params.compradorPrivateKey);

  const approveHash = await wallet.writeContract({
    address: params.moedaPagamento,
    abi: erc20Abi,
    functionName: "approve",
    args: [config.marketplaceAddress, params.valorTotal],
  });
  await aguardarSucesso(approveHash);

  const hash = await wallet.writeContract({
    address: config.marketplaceAddress,
    abi: marketplaceAbi,
    functionName: "comprar",
    args: [params.idListagem, params.quantidade],
  });
  await aguardarSucesso(hash);
  return hash;
}

export async function cancelarOnChain(params: {
  vendedorPrivateKey: `0x${string}`;
  idListagem: bigint;
}): Promise<`0x${string}`> {
  const wallet = walletClientFor(params.vendedorPrivateKey);
  const hash = await wallet.writeContract({
    address: config.marketplaceAddress,
    abi: marketplaceAbi,
    functionName: "cancelar",
    args: [params.idListagem],
  });
  await aguardarSucesso(hash);
  return hash;
}
