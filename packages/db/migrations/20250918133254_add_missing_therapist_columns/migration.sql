-- Add missing columns to Therapist table that exist in schema but not in migrations

DO $$
BEGIN
    -- Add businessHours column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Therapist' AND column_name='businessHours') THEN
        ALTER TABLE "Therapist" ADD COLUMN "businessHours" JSONB;
    END IF;

    -- Add certificates column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Therapist' AND column_name='certificates') THEN
        ALTER TABLE "Therapist" ADD COLUMN "certificates" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
    END IF;

    -- Add complianceSettings column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Therapist' AND column_name='complianceSettings') THEN
        ALTER TABLE "Therapist" ADD COLUMN "complianceSettings" JSONB;
    END IF;

    -- Add languagePreference column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Therapist' AND column_name='languagePreference') THEN
        ALTER TABLE "Therapist" ADD COLUMN "languagePreference" TEXT NOT NULL DEFAULT 'de';
    END IF;

    -- Add notificationSettings column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Therapist' AND column_name='notificationSettings') THEN
        ALTER TABLE "Therapist" ADD COLUMN "notificationSettings" JSONB;
    END IF;

    -- Add travelSettings column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Therapist' AND column_name='travelSettings') THEN
        ALTER TABLE "Therapist" ADD COLUMN "travelSettings" JSONB;
    END IF;
END $$;