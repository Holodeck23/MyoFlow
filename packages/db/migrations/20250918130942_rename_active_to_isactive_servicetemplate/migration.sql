-- Rename 'active' column to 'isActive' in ServiceRateTemplate table

-- Drop existing index on old column name
DROP INDEX IF EXISTS "ServiceRateTemplate_therapistId_category_active_idx";

-- Rename the column
ALTER TABLE "ServiceRateTemplate" RENAME COLUMN "active" TO "isActive";

-- Recreate index with new column name
CREATE INDEX "ServiceRateTemplate_therapistId_category_isActive_idx" ON "ServiceRateTemplate"("therapistId", "category", "isActive");