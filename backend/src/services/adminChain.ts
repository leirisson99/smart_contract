import { createWalletClient, http, parseEventLogs } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { config } from "../config.js";
import { chain, publicClient } from "../chain.js";
import { propertyFactoryAbi } from "../abi/PropertyFactory.js";
import { propertyTokenAbi } from "../abi/PropertyToken.js";
import { dividendDistributorAbi, dividendDistributorBytecode } from "../abi/DividendDistributor.js";
import { erc20Abi } from "../abi/ERC20.js";
import { garantirSaldoMoedaTeste } from "./gasSponsor.js";

/**
 * Carteira do gestor da SPE (feature 005) - detem `PLATFORM_ADMIN_ROLE` na
 * `PropertyFactory` (concedida a quem a deployou, ver
 * `projeto_imobiliaria/script/DeployPropertyPipeline.s.sol`) e, por
 * consequencia, `DEFAULT_ADMIN_ROLE`/`PLATFORM_ADMIN_ROLE` em todo
 * `PropertyToken` que cria (`PropertyToken.inicializar` concede esses papeis
 * a quem chamou `criarImovel`) e `GESTOR_ROLE` em todo `DividendDistributor`
 * que deploya (concedida a `msg.sender` no construtor). Uma unica chave
 * cobre as tres acoes do painel administrativo.
 */
const gestorAccount = privateKeyToAccount(config.gestorPrivateKey);
const gestorWallet = createWalletClient({ account: gestorAccount, chain, transport: http(config.rpcUrl) });

/** Mesmo problema de `marketplaceChain.TransacaoRevertidaError`: `writeContract`/`deployContract` nao simulam antes de enviar. */
export class TransacaoRevertidaError extends Error {
  constructor(hash: `0x${string}`) {
    super(`transacao ${hash} revertida on-chain`);
  }
}

async function aguardarSucesso(hash: `0x${string}`) {
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status === "reverted") throw new TransacaoRevertidaError(hash);
  return receipt;
}

export type ImovelCriadoOnChain = {
  propertyTokenAddress: `0x${string}`;
  dividendDistributorAddress: `0x${string}`;
  txHashCriacao: `0x${string}`;
  txHashDistributor: `0x${string}`;
};

/**
 * Cria um novo imovel de ponta a ponta (RF-25): aciona
 * `PropertyFactory.criarImovel`, deploya o `DividendDistributor` dedicado do
 * imovel (nao existe uma Factory para ele - deploy direto, mesmo padrao de
 * `DeployPropertyPipeline.s.sol`) e concede `SNAPSHOT_ROLE` a ele no
 * `PropertyToken` recem-criado, para que possa tirar snapshot a cada
 * deposito de rendimento.
 */
export async function criarImovelOnChain(
  params: {
    nome: string;
    valorTotal: bigint;
    numeroCotas: bigint;
  },
  /**
   * Chamado apos cada transacao confirmar, para que o chamador (rota
   * /admin/imoveis) persista o progresso incrementalmente - se a transacao
   * seguinte falhar, os enderecos ja obtidos nao ficam perdidos so na
   * memoria (ver `PropertyCreationAttempt`).
   */
  onProgress?: (progresso: Partial<ImovelCriadoOnChain>) => Promise<void> | void,
): Promise<ImovelCriadoOnChain> {
  const hash = await gestorWallet.writeContract({
    address: config.propertyFactoryAddress,
    abi: propertyFactoryAbi,
    functionName: "criarImovel",
    args: [params.nome, params.valorTotal, params.numeroCotas],
  });
  const receipt = await aguardarSucesso(hash);

  const [evento] = parseEventLogs({ abi: propertyFactoryAbi, eventName: "ImovelCriado", logs: receipt.logs }) as unknown as {
    args: { propertyToken: `0x${string}` };
  }[];
  if (!evento) throw new Error("evento ImovelCriado nao encontrado no recibo de PropertyFactory.criarImovel");
  const propertyTokenAddress = evento.args.propertyToken;
  await onProgress?.({ propertyTokenAddress, txHashCriacao: hash });

  const deployHash = await gestorWallet.deployContract({
    abi: dividendDistributorAbi,
    bytecode: dividendDistributorBytecode,
    args: [propertyTokenAddress],
  });
  const deployReceipt = await aguardarSucesso(deployHash);
  const dividendDistributorAddress = deployReceipt.contractAddress;
  if (!dividendDistributorAddress) {
    throw new Error("deploy do DividendDistributor nao retornou endereco de contrato");
  }
  await onProgress?.({ propertyTokenAddress, dividendDistributorAddress, txHashCriacao: hash, txHashDistributor: deployHash });

  const snapshotRole = (await publicClient.readContract({
    address: propertyTokenAddress,
    abi: propertyTokenAbi,
    functionName: "SNAPSHOT_ROLE",
  })) as `0x${string}`;
  const grantHash = await gestorWallet.writeContract({
    address: propertyTokenAddress,
    abi: propertyTokenAbi,
    functionName: "grantRole",
    args: [snapshotRole, dividendDistributorAddress],
  });
  await aguardarSucesso(grantHash);

  return { propertyTokenAddress, dividendDistributorAddress, txHashCriacao: hash, txHashDistributor: deployHash };
}

export type RendimentoDepositadoOnChain = {
  idCiclo: bigint;
  txHash: `0x${string}`;
};

/**
 * Deposita o rendimento mensal do imovel (RF-25), acionando
 * `DividendDistributor.depositarRendimento`. Mesma sequencia
 * approve+deposito ja exercitada manualmente em
 * `test/property-flow.e2e.test.ts` e no extinto `scripts/deposit-yield.ts` -
 * a diferenca e que aqui a carteira do gestor tambem e financiada com a
 * moeda de teste via `garantirSaldoMoedaTeste` (mesmo mecanismo usado para
 * as carteiras custodiais dos investidores), ja que o `MockERC20` nao faz
 * nenhum mint inicial para ninguem.
 */
export async function depositarRendimentoOnChain(params: {
  dividendDistributorAddress: `0x${string}`;
  valor: bigint;
}): Promise<RendimentoDepositadoOnChain> {
  const moedaPagamento = (await publicClient.readContract({
    address: params.dividendDistributorAddress,
    abi: dividendDistributorAbi,
    functionName: "moedaPagamento",
  })) as `0x${string}`;

  await garantirSaldoMoedaTeste(moedaPagamento, gestorAccount.address, params.valor);

  const approveHash = await gestorWallet.writeContract({
    address: moedaPagamento,
    abi: erc20Abi,
    functionName: "approve",
    args: [params.dividendDistributorAddress, params.valor],
  });
  await aguardarSucesso(approveHash);

  const hash = await gestorWallet.writeContract({
    address: params.dividendDistributorAddress,
    abi: dividendDistributorAbi,
    functionName: "depositarRendimento",
    args: [params.valor],
  });
  const receipt = await aguardarSucesso(hash);

  const [evento] = parseEventLogs({
    abi: dividendDistributorAbi,
    eventName: "RendimentoDepositado",
    logs: receipt.logs,
  }) as unknown as { args: { idCiclo: bigint } }[];
  if (!evento) throw new Error("evento RendimentoDepositado nao encontrado no recibo de DividendDistributor.depositarRendimento");

  return { idCiclo: evento.args.idCiclo, txHash: hash };
}
