-- AlterTable
ALTER TABLE "transaction" ADD COLUMN     "templateId" TEXT;

-- CreateTable
CREATE TABLE "fixed_expense_template" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "dayOfMonth" INTEGER NOT NULL,
    "startMonth" INTEGER NOT NULL,
    "startYear" INTEGER NOT NULL,
    "endMonth" INTEGER,
    "endYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "fixed_expense_template_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fixed_expense_template_userId_idx" ON "fixed_expense_template"("userId");

-- CreateIndex
CREATE INDEX "transaction_templateId_idx" ON "transaction"("templateId");

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "fixed_expense_template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_expense_template" ADD CONSTRAINT "fixed_expense_template_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
