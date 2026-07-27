-- AlterTable
ALTER TABLE "transaction" ADD COLUMN     "installmentGroupId" TEXT,
ADD COLUMN     "installmentNumber" INTEGER,
ADD COLUMN     "installmentTotal" INTEGER;

-- CreateIndex
CREATE INDEX "transaction_installmentGroupId_idx" ON "transaction"("installmentGroupId");
