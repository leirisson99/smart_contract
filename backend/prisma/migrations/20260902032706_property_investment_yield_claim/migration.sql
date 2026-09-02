-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "propertyTokenAddress" TEXT NOT NULL,
    "dividendDistributorAddress" TEXT NOT NULL,
    "imagemUrl" TEXT,
    "rendimentoEstimadoAnual" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'EM_CAPTACAO',
    "valorMinimoInvestimento" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investment" (
    "id" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "cotas" INTEGER NOT NULL,
    "valorPago" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Investment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YieldClaim" (
    "id" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "cicloId" INTEGER NOT NULL,
    "valor" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "YieldClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Property_propertyTokenAddress_key" ON "Property"("propertyTokenAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Property_dividendDistributorAddress_key" ON "Property"("dividendDistributorAddress");

-- CreateIndex
CREATE UNIQUE INDEX "YieldClaim_investorId_propertyId_cicloId_key" ON "YieldClaim"("investorId", "propertyId", "cicloId");

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "Investor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YieldClaim" ADD CONSTRAINT "YieldClaim_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "Investor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YieldClaim" ADD CONSTRAINT "YieldClaim_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
