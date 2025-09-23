-- CreateEnum
DO $$ BEGIN
 CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'INCOMPLETE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerified" TIMESTAMP(6);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerificationToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "password" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordResetExpires" TIMESTAMP(6);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordResetToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(6) DEFAULT (now() + '30 days'::interval);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "trialStarted" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_user_email_verification" ON "User"("emailVerificationToken");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_user_password_reset" ON "User"("passwordResetToken");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_user_subscription_status" ON "User"("subscriptionStatus");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_user_trial_ends" ON "User"("trialEndsAt");