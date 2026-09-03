import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { config } from "../config.js";
import { chain, publicClient } from "../chain.js";
import { propertyTokenAbi } from "../abi/PropertyToken.js";
import { dividendDistributorAbi } from "../abi/DividendDistributor.js";
import { erc20Abi } from "../abi/ERC20.js";

export type ImovelOnChain = {
  nome: string;
  precoPorCota: bigint;
  totalCotas: bigint;
  cotasDisponiveis: bigint;
  totalSupply: bigint;
  moedaPagamento: `0x${string}`;
};

/** Mesmo problema de `marketplaceChain.TransacaoRevertidaError`: `writeContract` nao simula antes de enviar. */
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

/**
 * Le os dados financeiros do imovel direto do PropertyToken (RF-22) - nunca
 * cacheados no banco, para nunca divergir da fonte da verdade (o contrato).
 */
export async function lerImovelOnChain(propertyTokenAddress: `0x${string}`): Promise<ImovelOnChain> {
  const [nome, precoPorCota, totalCotas, cotasDisponiveis, totalSupply, moedaPagamento] = await Promise.all([
    publicClient.readContract({ address: propertyTokenAddress, abi: propertyTokenAbi, functionName: "nome" }),
    publicClient.readContract({ address: propertyTokenAddress, abi: propertyTokenAbi, functionName: "precoPorCota" }),
    publicClient.readContract({ address: propertyTokenAddress, abi: propertyTokenAbi, functionName: "totalCotas" }),
    publicClient.readContract({
      address: propertyTokenAddress,
      abi: propertyTokenAbi,
      functionName: "cotasDisponiveis",
    }),
    publicClient.readContract({ address: propertyTokenAddress, abi: propertyTokenAbi, functionName: "totalSupply" }),
    publicClient.readContract({
      address: propertyTokenAddress,
      abi: propertyTokenAbi,
      functionName: "moedaPagamento",
    }),
  ]);
  return {
    nome: nome as string,
    precoPorCota: precoPorCota as bigint,
    totalCotas: totalCotas as bigint,
    cotasDisponiveis: cotasDisponiveis as bigint,
    totalSupply: totalSupply as bigint,
    moedaPagamento: moedaPagamento as `0x${string}`,
  };
}

export async function balanceOfOnChain(propertyTokenAddress: `0x${string}`, wallet: `0x${string}`): Promise<bigint> {
  return publicClient.readContract({
    address: propertyTokenAddress,
    abi: propertyTokenAbi,
    functionName: "balanceOf",
    args: [wallet],
  }) as Promise<bigint>;
}

/**
 * Assina e envia `comprarCotas` em nome da carteira custodial do investidor
 * (RF-22). `comprarCotas` faz `moedaPagamento.safeTransferFrom(msg.sender,
 * tesouraria, valorPago)` - exige allowance previo do proprio investidor,
 * por isso aprova antes de comprar (duas transacoes, ambas assinadas pela
 * carteira custodial do investidor, nunca pelo backend).
 */
export async function comprarCotasOnChain(params: {
  investorPrivateKey: `0x${string}`;
  propertyTokenAddress: `0x${string}`;
  moedaPagamento: `0x${string}`;
  quantidade: bigint;
  valorPago: bigint;
}): Promise<`0x${string}`> {
  const wallet = walletClientFor(params.investorPrivateKey);

  const approveHash = await wallet.writeContract({
    address: params.moedaPagamento,
    abi: erc20Abi,
    functionName: "approve",
    args: [params.propertyTokenAddress, params.valorPago],
  });
  await aguardarSucesso(approveHash);

  const hash = await wallet.writeContract({
    address: params.propertyTokenAddress,
    abi: propertyTokenAbi,
    functionName: "comprarCotas",
    args: [params.quantidade],
  });
  await aguardarSucesso(hash);
  return hash;
}

// ---- DividendDistributor (feature 003) ----

export async function cicloAtualOnChain(distributorAddress: `0x${string}`): Promise<bigint> {
  return publicClient.readContract({
    address: distributorAddress,
    abi: dividendDistributorAbi,
    functionName: "cicloAtual",
  }) as Promise<bigint>;
}

export async function valorReivindicavelOnChain(
  distributorAddress: `0x${string}`,
  wallet: `0x${string}`,
  idCiclo: bigint,
): Promise<bigint> {
  return publicClient.readContract({
    address: distributorAddress,
    abi: dividendDistributorAbi,
    functionName: "valorReivindicavel",
    args: [wallet, idCiclo],
  }) as Promise<bigint>;
}

/** Reivindica todos os ciclos pendentes do investidor num unico envio (RF-24, caminho feliz). */
export async function claimTodosOnChain(
  distributorAddress: `0x${string}`,
  investorPrivateKey: `0x${string}`,
): Promise<`0x${string}`> {
  const wallet = walletClientFor(investorPrivateKey);
  const hash = await wallet.writeContract({
    address: distributorAddress,
    abi: dividendDistributorAbi,
    functionName: "claimTodos",
  });
  await aguardarSucesso(hash);
  return hash;
}

/** Reivindica um ciclo especifico (RF-24, fallback quando `claimTodos` falha). */
export async function claimCicloOnChain(
  distributorAddress: `0x${string}`,
  investorPrivateKey: `0x${string}`,
  idCiclo: bigint,
): Promise<`0x${string}`> {
  const wallet = walletClientFor(investorPrivateKey);
  const hash = await wallet.writeContract({
    address: distributorAddress,
    abi: dividendDistributorAbi,
    functionName: "claim",
    args: [idCiclo],
  });
  await aguardarSucesso(hash);
  return hash;
}
