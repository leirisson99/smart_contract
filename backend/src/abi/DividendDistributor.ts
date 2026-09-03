import dividendDistributorArtifact from "../../../projeto_imobiliaria/out/DividendDistributor.sol/DividendDistributor.json" with { type: "json" };

export const dividendDistributorAbi = dividendDistributorArtifact.abi;

/** Bytecode do contrato (nao so a interface) - usado por `adminChain.ts` para deployar um `DividendDistributor` novo a cada imovel criado pelo painel administrativo (005). */
export const dividendDistributorBytecode = dividendDistributorArtifact.bytecode.object as `0x${string}`;
