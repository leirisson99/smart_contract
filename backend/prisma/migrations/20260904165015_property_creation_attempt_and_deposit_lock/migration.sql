-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "rendimentoDepositoTravadoEm" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PropertyCreationAttempt" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "valorTotal" TEXT NOT NULL,
    "totalCotas" INTEGER NOT NULL,
    "rendimentoEstimadoAnual" DOUBLE PRECISION NOT NULL,
    "imagemUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "propertyTokenAddress" TEXT,
    "dividendDistributorAddress" TEXT,
    "txHashCriacao" TEXT,
    "txHashDistributor" TEXT,
    "erro" TEXT,
    "propertyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyCreationAttempt_pkey" PRIMARY KEY ("id")
);
