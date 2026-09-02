import { parseEther } from "viem";
import { prisma } from "../src/db/client.js";

/**
 * Popula a tabela `Property` (metadados off-chain) com um imovel ja
 * deployado localmente via `projeto_imobiliaria/script/DeployPropertyPipeline.s.sol`.
 * Upsert por `propertyTokenAddress` para poder rodar de novo sem duplicar,
 * util depois de reiniciar a Anvil (que nao persiste estado) e redeployar.
 *
 * Uso: PROPERTY_TOKEN_ADDRESS=0x... DIVIDEND_DISTRIBUTOR_ADDRESS=0x... npm run seed-property
 */
async function main() {
  const propertyTokenAddress = process.env.PROPERTY_TOKEN_ADDRESS;
  const dividendDistributorAddress = process.env.DIVIDEND_DISTRIBUTOR_ADDRESS;
  if (!propertyTokenAddress || !dividendDistributorAddress) {
    throw new Error("PROPERTY_TOKEN_ADDRESS e DIVIDEND_DISTRIBUTOR_ADDRESS sao obrigatorios em env");
  }

  const imagemUrl =
    process.env.IMAGEM_URL ??
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=800&auto=format&fit=crop";
  const rendimentoEstimadoAnual = Number(process.env.RENDIMENTO_ESTIMADO_ANUAL ?? "0.085");
  const valorMinimoInvestimento = process.env.VALOR_MINIMO_INVESTIMENTO_WEI ?? parseEther("500").toString();

  const property = await prisma.property.upsert({
    where: { propertyTokenAddress },
    create: { propertyTokenAddress, dividendDistributorAddress, imagemUrl, rendimentoEstimadoAnual, valorMinimoInvestimento },
    update: { dividendDistributorAddress, imagemUrl, rendimentoEstimadoAnual, valorMinimoInvestimento },
  });

  console.log(`Property ${property.id} (${propertyTokenAddress}) seedada com sucesso.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
