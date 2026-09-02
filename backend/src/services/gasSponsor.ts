import { createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { config } from "../config.js";
import { chain, publicClient } from "../chain.js";
import { erc20Abi } from "../abi/ERC20.js";
import { mockErc20Abi } from "../abi/MockERC20.js";

/**
 * Carteiras custodiais sao geradas do zero (`walletCustody.createCustodialWallet`)
 * e nunca recebem ETH de ninguem - sem saldo de gas, o investidor nao
 * conseguiria assinar nem uma unica transacao propria (`comprarCotas`,
 * `claim`), quebrando a promessa de "sem conhecimento tecnico" do slide 4.
 * O backend "patrocina" o gas a partir de uma conta propria dedicada
 * (GAS_SPONSOR_PRIVATE_KEY), transferindo um valor fixo sempre que o saldo
 * da carteira do investidor cair abaixo de um limiar minimo.
 */
const GAS_TOPUP_AMOUNT = parseEther("0.05");
const GAS_TOPUP_THRESHOLD = parseEther("0.01");

const sponsorAccount = privateKeyToAccount(config.gasSponsorPrivateKey);
const sponsorWallet = createWalletClient({ account: sponsorAccount, chain, transport: http(config.rpcUrl) });

export async function garantirGasParaCarteira(wallet: `0x${string}`): Promise<void> {
  const saldo = await publicClient.getBalance({ address: wallet });
  if (saldo >= GAS_TOPUP_THRESHOLD) return;

  const hash = await sponsorWallet.sendTransaction({ to: wallet, value: GAS_TOPUP_AMOUNT });
  await publicClient.waitForTransactionReceipt({ hash });
}

/**
 * Mesmo problema do gas de ETH acima, mas para a moeda de pagamento: a
 * carteira custodial nasce sem nenhum saldo de `moedaPagamento`, e ainda nao
 * existe nenhum gateway real para o investidor adquiri-la (RISK-08 segue em
 * aberto). Isso so funciona porque `moedaPagamento` hoje e sempre o
 * `MockERC20` de teste, cujo `mint` e publico (sem controle de acesso) - o
 * dia que a moeda real for definida, esta funcao deixa de fazer sentido e
 * deve ser substituida pelo fluxo real de aquisicao.
 */
export async function garantirSaldoMoedaTeste(
  moedaPagamento: `0x${string}`,
  wallet: `0x${string}`,
  valorNecessario: bigint,
): Promise<void> {
  const saldo = (await publicClient.readContract({
    address: moedaPagamento,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [wallet],
  })) as bigint;
  if (saldo >= valorNecessario) return;

  const faltante = valorNecessario - saldo;
  const hash = await sponsorWallet.writeContract({
    address: moedaPagamento,
    abi: mockErc20Abi,
    functionName: "mint",
    args: [wallet, faltante],
  });
  await publicClient.waitForTransactionReceipt({ hash });
}
