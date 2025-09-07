-- AlterTable
ALTER TABLE "Therapist" ADD COLUMN     "businessAddress" TEXT,
ADD COLUMN     "businessEmail" TEXT,
ADD COLUMN     "businessName" TEXT,
ADD COLUMN     "businessPhone" TEXT,
ADD COLUMN     "businessWebsite" TEXT,
ADD COLUMN     "chamberRegistration" TEXT,
ADD COLUMN     "defaultReminderDays" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "enableEmailReminders" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "enableSmsReminders" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "invoiceFooter" TEXT,
ADD COLUMN     "profileCompletedAt" TIMESTAMP(3),
ADD COLUMN     "uidNumber" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "ServiceRateTemplate" (
    "id" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ServiceCategory" NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "vatRate" "VatStatus" NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceRateTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceRateTemplate_therapistId_category_active_idx" ON "ServiceRateTemplate"("therapistId", "category", "active");

-- CreateIndex
CREATE INDEX "ServiceRateTemplate_therapistId_isDefault_idx" ON "ServiceRateTemplate"("therapistId", "isDefault");

-- AddForeignKey
ALTER TABLE "ServiceRateTemplate" ADD CONSTRAINT "ServiceRateTemplate_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "Therapist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
