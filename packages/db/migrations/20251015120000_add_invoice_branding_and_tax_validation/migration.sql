-- Add invoice branding and tax validation columns to Therapist

DO $$
BEGIN
    -- Create InvoiceDisplayPreference enum if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        WHERE t.typname = 'InvoiceDisplayPreference'
    ) THEN
        CREATE TYPE "InvoiceDisplayPreference" AS ENUM ('NAME', 'LOGO', 'BOTH');
    END IF;

    -- Add invoiceLogoUrl column
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Therapist'
          AND column_name = 'invoiceLogoUrl'
    ) THEN
        ALTER TABLE "Therapist" ADD COLUMN "invoiceLogoUrl" TEXT;
    END IF;

    -- Add invoiceDisplayPreference column
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Therapist'
          AND column_name = 'invoiceDisplayPreference'
    ) THEN
        ALTER TABLE "Therapist" ADD COLUMN "invoiceDisplayPreference" "InvoiceDisplayPreference" NOT NULL DEFAULT 'NAME';
    END IF;

    -- Add invoiceThankYouMessage column
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Therapist'
          AND column_name = 'invoiceThankYouMessage'
    ) THEN
        ALTER TABLE "Therapist" ADD COLUMN "invoiceThankYouMessage" TEXT;
    END IF;

    -- Add taxValidationCompleted column
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Therapist'
          AND column_name = 'taxValidationCompleted'
    ) THEN
        ALTER TABLE "Therapist" ADD COLUMN "taxValidationCompleted" BOOLEAN NOT NULL DEFAULT false;
    END IF;

    -- Add taxValidatedAt column
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Therapist'
          AND column_name = 'taxValidatedAt'
    ) THEN
        ALTER TABLE "Therapist" ADD COLUMN "taxValidatedAt" TIMESTAMP(6);
    END IF;
END $$;
