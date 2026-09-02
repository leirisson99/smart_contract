import type { FastifyInstance } from "fastify";
import { prisma } from "../db/client.js";
import { decryptSecret } from "../services/walletCustody.js";
import { isVerifiedOnChain } from "../services/trustedIssuerSigner.js";
import { balanceOfOnChain, lerImovelOnChain } from "../services/propertyChain.js";
import {
  cancelarOnChain,
  comprarOnChain,
  lerListagemOnChain,
  listagensAtivasPorTokenOnChain,
  listarOnChain,
  TransacaoRevertidaError,
  type ListagemOnChain,
} from "../services/marketplaceChain.js";
import { garantirGasParaCarteira, garantirSaldoMoedaTeste } from "../services/gasSponsor.js";

const ENDERECO_ZERO = "0x0000000000000000000000000000000000000000";

/** Compara enderecos ignorando caixa - o RPC nao garante checksum EIP-55 no retorno de `readContract`. */
function mesmoEndereco(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

async function serializeListagem(
  idListagem: bigint,
  listagem: ListagemOnChain,
  property: { id: string },
  investidorAtualWallet: string | undefined,
) {
  const [imovel, vendedor] = await Promise.all([
    lerImovelOnChain(listagem.propertyToken),
    prisma.investor.findFirst({ where: { walletAddress: { equals: listagem.vendedor, mode: "insensitive" } } }),
  ]);

  return {
    id: idListagem.toString(),
    imovelId: property.id,
    imovelNome: imovel.nome,
    vendedorNome: vendedor?.fullName ?? "Investidor",
    cotas: Number(listagem.quantidadeDisponivel),
    precoPorCota: listagem.precoPorCota.toString(),
    status: "ativa",
    criadaPeloUsuarioAtual:
      investidorAtualWallet !== undefined && mesmoEndereco(listagem.vendedor, investidorAtualWallet),
  };
}

export async function marketplaceRoutes(app: FastifyInstance) {
  app.get("/listagens", async (request) => {
    const { investorId } = request.query as { investorId?: string };
    const investidorAtual = investorId ? await prisma.investor.findUnique({ where: { id: investorId } }) : null;

    const properties = await prisma.property.findMany();
    const listagensPorImovel = await Promise.all(
      properties.map(async (property) => {
        const ids = await listagensAtivasPorTokenOnChain(property.propertyTokenAddress as `0x${string}`);
        return Promise.all(
          ids.map(async (id) => {
            const listagem = await lerListagemOnChain(id);
            return serializeListagem(id, listagem, property, investidorAtual?.walletAddress);
          }),
        );
      }),
    );
    return listagensPorImovel.flat();
  });

  app.post("/listagens", async (request, reply) => {
    const body = request.body as
      | { investorId?: string; imovelId?: string; cotas?: number; precoPorCota?: string }
      | undefined;

    if (
      !body?.investorId ||
      !body?.imovelId ||
      !body?.cotas ||
      !Number.isInteger(body.cotas) ||
      body.cotas <= 0 ||
      !body?.precoPorCota
    ) {
      return reply
        .code(400)
        .send({ error: "investorId, imovelId, cotas (inteiro positivo) e precoPorCota sao obrigatorios" });
    }

    const investor = await prisma.investor.findUnique({ where: { id: body.investorId } });
    if (!investor) {
      return reply.code(404).send({ error: "investidor nao encontrado" });
    }

    const property = await prisma.property.findUnique({ where: { id: body.imovelId } });
    if (!property) {
      return reply.code(404).send({ error: "imovel nao encontrado" });
    }

    const propertyTokenAddress = property.propertyTokenAddress as `0x${string}`;
    const cotas = BigInt(body.cotas);
    const saldo = await balanceOfOnChain(propertyTokenAddress, investor.walletAddress as `0x${string}`);
    if (saldo < cotas) {
      return reply.code(400).send({ codigo: "SALDO_INSUFICIENTE" });
    }

    const investorPrivateKey = decryptSecret(investor.walletKeyEnc) as `0x${string}`;

    let idListagem: bigint;
    try {
      await garantirGasParaCarteira(investor.walletAddress as `0x${string}`);
      const resultado = await listarOnChain({
        vendedorPrivateKey: investorPrivateKey,
        propertyTokenAddress,
        quantidade: cotas,
        precoPorCota: BigInt(body.precoPorCota),
      });
      idListagem = resultado.idListagem;
    } catch (err) {
      request.log.error({ err }, "falha ao executar Marketplace.listar on-chain");
      return reply.code(502).send({ codigo: "ERRO_DESCONHECIDO" });
    }

    const imovel = await lerImovelOnChain(propertyTokenAddress);
    return reply.code(201).send({
      id: idListagem.toString(),
      imovelId: property.id,
      imovelNome: imovel.nome,
      vendedorNome: investor.fullName,
      cotas: body.cotas,
      precoPorCota: body.precoPorCota,
      status: "ativa",
      criadaPeloUsuarioAtual: true,
    });
  });

  app.post("/listagens/:id/comprar", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { investorId?: string } | undefined;
    if (!body?.investorId) {
      return reply.code(400).send({ error: "investorId e obrigatorio" });
    }

    const investor = await prisma.investor.findUnique({ where: { id: body.investorId } });
    if (!investor) {
      return reply.code(404).send({ error: "investidor nao encontrado" });
    }

    let idListagem: bigint;
    try {
      idListagem = BigInt(id);
    } catch {
      return reply.code(404).send({ codigo: "LISTAGEM_NAO_ENCONTRADA" });
    }

    const listagem = await lerListagemOnChain(idListagem);
    if (!listagem.ativa) {
      if (mesmoEndereco(listagem.vendedor, ENDERECO_ZERO)) {
        return reply.code(404).send({ codigo: "LISTAGEM_NAO_ENCONTRADA" });
      }
      return reply.code(409).send({ codigo: "LISTAGEM_JA_VENDIDA" });
    }

    // RNF-16: checagem otimista de UX (evita gastar gas numa tx que reverteria).
    // O enforcement real e o ComplianceModule on-chain (SEC-08).
    const kycAprovado = await isVerifiedOnChain(investor.walletAddress as `0x${string}`);
    if (!kycAprovado) {
      return reply.code(403).send({ codigo: "SEM_KYC" });
    }

    const property = await prisma.property.findFirst({
      where: { propertyTokenAddress: { equals: listagem.propertyToken, mode: "insensitive" } },
    });
    if (!property) {
      return reply.code(404).send({ codigo: "LISTAGEM_NAO_ENCONTRADA" });
    }

    const imovel = await lerImovelOnChain(listagem.propertyToken);
    const valorTotal = listagem.precoPorCota * listagem.quantidadeDisponivel;
    const investorPrivateKey = decryptSecret(investor.walletKeyEnc) as `0x${string}`;

    try {
      await garantirGasParaCarteira(investor.walletAddress as `0x${string}`);
      await garantirSaldoMoedaTeste(imovel.moedaPagamento, investor.walletAddress as `0x${string}`, valorTotal);
      const txHash = await comprarOnChain({
        compradorPrivateKey: investorPrivateKey,
        moedaPagamento: imovel.moedaPagamento,
        idListagem,
        quantidade: listagem.quantidadeDisponivel,
        valorTotal,
      });

      // Registrada no mesmo ledger `Investment` de 002 (nao so compra
      // primaria) - portfolio.ts (003) usa esse ledger para saber quais
      // imoveis consultar e para somar "valor investido"; sem este registro,
      // uma cota adquirida so no mercado secundario nunca apareceria no
      // portfolio do comprador, mesmo com saldo correto on-chain.
      await prisma.investment.create({
        data: {
          investorId: investor.id,
          propertyId: property.id,
          cotas: Number(listagem.quantidadeDisponivel),
          valorPago: valorTotal.toString(),
          txHash,
        },
      });

      return reply.send({ txHash });
    } catch (err) {
      // SEC-04: se a listagem foi comprada/cancelada por outra requisicao
      // entre a leitura otimista acima e o envio da transacao, `comprar`
      // reverte on-chain (`aguardarSucesso` traduz isso em
      // `TransacaoRevertidaError` em vez de reportar sucesso indevido) - o
      // mesmo codigo de uma listagem que ja estava inativa desde o inicio.
      if (err instanceof TransacaoRevertidaError) {
        return reply.code(409).send({ codigo: "LISTAGEM_JA_VENDIDA" });
      }
      request.log.error({ err }, "falha ao executar Marketplace.comprar on-chain");
      return reply.code(502).send({ codigo: "ERRO_DESCONHECIDO" });
    }
  });

  app.post("/listagens/:id/cancelar", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { investorId?: string } | undefined;
    if (!body?.investorId) {
      return reply.code(400).send({ error: "investorId e obrigatorio" });
    }

    const investor = await prisma.investor.findUnique({ where: { id: body.investorId } });
    if (!investor) {
      return reply.code(404).send({ error: "investidor nao encontrado" });
    }

    let idListagem: bigint;
    try {
      idListagem = BigInt(id);
    } catch {
      return reply.code(404).send({ codigo: "LISTAGEM_NAO_ENCONTRADA" });
    }

    const listagem = await lerListagemOnChain(idListagem);
    if (!listagem.ativa) {
      return reply.code(404).send({ codigo: "LISTAGEM_NAO_ENCONTRADA" });
    }
    if (!mesmoEndereco(listagem.vendedor, investor.walletAddress)) {
      return reply.code(403).send({ error: "listagem nao pertence a este investidor" });
    }

    const investorPrivateKey = decryptSecret(investor.walletKeyEnc) as `0x${string}`;
    try {
      await garantirGasParaCarteira(investor.walletAddress as `0x${string}`);
      const txHash = await cancelarOnChain({ vendedorPrivateKey: investorPrivateKey, idListagem });
      return reply.send({ txHash });
    } catch (err) {
      request.log.error({ err }, "falha ao executar Marketplace.cancelar on-chain");
      return reply.code(502).send({ codigo: "ERRO_DESCONHECIDO" });
    }
  });
}
