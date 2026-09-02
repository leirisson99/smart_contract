import { createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { config } from "../config.js";
import { chain, publicClient } from "../chain.js";

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
