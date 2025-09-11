-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "netCents" INTEGER,
ADD COLUMN     "performanceDate" TIMESTAMP(3),
ADD COLUMN     "tender" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "vatCents" INTEGER,
ADD COLUMN     "vatRate" DECIMAL(5,4);

-- CreateIndex
CREATE INDEX "Invoice_therapistId_performanceDate_idx" ON "Invoice"("therapistId", "performanceDate");
