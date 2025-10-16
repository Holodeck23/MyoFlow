-- Create AccountType enum
CREATE TYPE "AccountType" AS ENUM ('TEST', 'PRODUCTION', 'ADMIN', 'DEV');

-- Add accountType column to User with default TEST
ALTER TABLE "User"
  ADD COLUMN "accountType" "AccountType" NOT NULL DEFAULT 'TEST';

-- Create ArchivedData table for storing serialized test data
CREATE TABLE "ArchivedData" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "note" TEXT,
  "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ArchivedData_pkey" PRIMARY KEY ("id")
);

-- Indexes to support lookups and archival operations
CREATE INDEX "idx_archived_data_user" ON "ArchivedData"("userId");
CREATE INDEX "idx_archived_data_archived_at" ON "ArchivedData"("archivedAt");
CREATE INDEX "idx_user_account_type" ON "User"("accountType");

-- Link archived data back to user accounts
ALTER TABLE "ArchivedData"
  ADD CONSTRAINT "ArchivedData_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Promote existing administrator roles to the ADMIN account type
UPDATE "User"
SET "accountType" = 'ADMIN'
WHERE "role" IN ('SUPER_ADMIN', 'SUPPORT', 'FINANCE');
