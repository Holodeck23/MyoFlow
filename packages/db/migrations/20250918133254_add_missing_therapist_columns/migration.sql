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

    -- Add missing ServiceRateTemplate columns
    -- Add isKleinunternehmer column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ServiceRateTemplate' AND column_name='isKleinunternehmer') THEN
        ALTER TABLE "ServiceRateTemplate" ADD COLUMN "isKleinunternehmer" BOOLEAN NOT NULL DEFAULT false;
    END IF;

    -- Add metadata column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ServiceRateTemplate' AND column_name='metadata') THEN
        ALTER TABLE "ServiceRateTemplate" ADD COLUMN "metadata" JSONB;
    END IF;

    -- Add travelRateCents column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ServiceRateTemplate' AND column_name='travelRateCents') THEN
        ALTER TABLE "ServiceRateTemplate" ADD COLUMN "travelRateCents" INTEGER;
    END IF;
END $$;