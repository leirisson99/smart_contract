-- AlterTable
-- Banco de dev/test e descartavel (POC, testes ja fazem deleteMany() em
-- beforeEach) - "email" entra direto como NOT NULL UNIQUE em vez de um
-- backfill em duas etapas, decisao documentada em
-- docs/backend/features/006-autenticacao-investidor/plan.md.
ALTER TABLE "Investor" ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "otpSecretEnc" TEXT NOT NULL,
ADD COLUMN     "otpCounter" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "otpConsumedCounter" INTEGER,
ADD COLUMN     "otpCodeExpiresAt" TIMESTAMP(3),
ADD COLUMN     "otpAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "otpLastRequestedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "InvestorSession" (
    "id" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "ip" TEXT,

    CONSTRAINT "InvestorSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Investor_email_key" ON "Investor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "InvestorSession_tokenHash_key" ON "InvestorSession"("tokenHash");

-- CreateIndex
CREATE INDEX "InvestorSession_investorId_revokedAt_idx" ON "InvestorSession"("investorId", "revokedAt");

-- AddForeignKey
ALTER TABLE "InvestorSession" ADD CONSTRAINT "InvestorSession_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "Investor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
