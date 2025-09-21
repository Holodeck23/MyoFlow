-- Add password field to User table for email/password authentication
-- Migration: add_user_password
-- Date: 2025-09-21

BEGIN;

-- Add password field to User table
ALTER TABLE "User"
ADD COLUMN "password" TEXT;

-- Add email verification fields
ALTER TABLE "User"
ADD COLUMN "emailVerified" TIMESTAMP,
ADD COLUMN "emailVerificationToken" TEXT,
ADD COLUMN "passwordResetToken" TEXT,
ADD COLUMN "passwordResetExpires" TIMESTAMP;

-- Add trial tracking
ALTER TABLE "User"
ADD COLUMN "trialStarted" TIMESTAMP DEFAULT NOW(),
ADD COLUMN "trialEndsAt" TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days'),
ADD COLUMN "subscriptionStatus" TEXT DEFAULT 'trial',
ADD COLUMN "stripeCustomerId" TEXT,
ADD COLUMN "stripeSubscriptionId" TEXT;

-- Add check constraint for subscription status
ALTER TABLE "User"
ADD CONSTRAINT check_subscription_status
CHECK ("subscriptionStatus" IN ('trial', 'active', 'past_due', 'canceled', 'incomplete'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_email_verification ON "User"("emailVerificationToken");
CREATE INDEX IF NOT EXISTS idx_user_password_reset ON "User"("passwordResetToken");
CREATE INDEX IF NOT EXISTS idx_user_subscription_status ON "User"("subscriptionStatus");
CREATE INDEX IF NOT EXISTS idx_user_trial_ends ON "User"("trialEndsAt");

COMMIT;