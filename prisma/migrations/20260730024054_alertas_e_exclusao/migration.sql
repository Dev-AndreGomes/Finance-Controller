-- CreateTable
CREATE TABLE "fixed_expense_skip" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "templateId" TEXT NOT NULL,

    CONSTRAINT "fixed_expense_skip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fixed_expense_skip_templateId_month_year_key" ON "fixed_expense_skip"("templateId", "month", "year");

-- AddForeignKey
ALTER TABLE "fixed_expense_skip" ADD CONSTRAINT "fixed_expense_skip_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "fixed_expense_template"("id") ON DELETE CASCADE ON UPDATE CASCADE;
