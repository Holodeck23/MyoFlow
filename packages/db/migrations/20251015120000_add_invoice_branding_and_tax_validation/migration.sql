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

    -- Rename any camelCase columns created by earlier iterations of this migration
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Therapist'
          AND column_name = 'invoice_logo_url'
    ) AND EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Therapist'
          AND column_name = 'invoiceLogoUrl'
    ) THEN
        ALTER TABLE "Therapist" RENAME COLUMN "invoiceLogoUrl" TO "invoice_logo_url";
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Therapist'
          AND column_name = 'invoice_display_preference'
    ) AND EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Therapist'
          AND column_name = 'invoiceDisplayPreference'
    ) THEN
        ALTER TABLE "Therapist" RENAME COLUMN "invoiceDisplayPreference" TO "invoice_display_preference";
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Therapist'
          AND column_name = 'invoice_thank_you_message'
    ) AND EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Therapist'
          AND column_name = 'invoiceThankYouMessage'
    ) THEN
        ALTER TABLE "Therapist" RENAME COLUMN "invoiceThankYouMessage" TO "invoice_thank_you_message";
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Therapist'
          AND column_name = 'tax_validation_completed'
    ) AND EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Therapist'
          AND column_name = 'taxValidationCompleted'
    ) THEN
        ALTER TABLE "Therapist" RENAME COLUMN "taxValidationCompleted" TO "tax_validation_completed";
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Therapist'
          AND column_name = 'tax_validated_at'
    ) AND EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Therapist'
          AND column_name = 'taxValidatedAt'
    ) THEN
        ALTER TABLE "Therapist" RENAME COLUMN "taxValidatedAt" TO "tax_validated_at";
    END IF;
END $$;

-- Ensure the expected snake_case columns exist
ALTER TABLE "Therapist"
    ADD COLUMN IF NOT EXISTS "invoice_logo_url" TEXT;

ALTER TABLE "Therapist"
    ADD COLUMN IF NOT EXISTS "invoice_display_preference" "InvoiceDisplayPreference";

ALTER TABLE "Therapist"
    ALTER COLUMN "invoice_display_preference" SET DEFAULT 'NAME';

UPDATE "Therapist"
SET "invoice_display_preference" = 'NAME'
WHERE "invoice_display_preference" IS NULL;

ALTER TABLE "Therapist"
    ALTER COLUMN "invoice_display_preference" SET NOT NULL;

ALTER TABLE "Therapist"
    ADD COLUMN IF NOT EXISTS "invoice_thank_you_message" TEXT;

ALTER TABLE "Therapist"
    ADD COLUMN IF NOT EXISTS "tax_validation_completed" BOOLEAN;

UPDATE "Therapist"
SET "tax_validation_completed" = false
WHERE "tax_validation_completed" IS NULL;

ALTER TABLE "Therapist"
    ALTER COLUMN "tax_validation_completed" SET DEFAULT false;

ALTER TABLE "Therapist"
    ALTER COLUMN "tax_validation_completed" SET NOT NULL;

ALTER TABLE "Therapist"
    ADD COLUMN IF NOT EXISTS "tax_validated_at" TIMESTAMP(3);
