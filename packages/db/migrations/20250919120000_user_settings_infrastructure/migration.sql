-- User Settings Infrastructure Migration
--
-- IMPORTANT: PostGIS Extension Setup Required
-- ===========================================
-- This migration requires the PostGIS extension for geographic calculations.
-- However, CREATE EXTENSION postgis; requires superuser privileges and is not
-- supported in CI environments or managed PostgreSQL services.
--
-- FOR PRODUCTION DEPLOYMENT:
-- 1. Manually enable PostGIS extension before running this migration:
--    CREATE EXTENSION IF NOT EXISTS postgis;
-- 2. Ensure the database user has appropriate permissions
-- 3. Verify PostGIS is available: SELECT PostGIS_Version();
--
-- FOR DEVELOPMENT:
-- Run this command as a superuser before migrations:
-- CREATE EXTENSION IF NOT EXISTS postgis;
--
-- The following migration creates tables and enums without PostGIS dependency.
-- Geographic calculations will use standard DOUBLE PRECISION for latitude/longitude.

-- New enum types
DO $$ BEGIN
  CREATE TYPE "PricingMode" AS ENUM ('NET', 'GROSS');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CredentialType" AS ENUM (
    'PROFESSIONAL_LICENSE',
    'CERTIFICATION',
    'QUALIFICATION',
    'CONTINUING_EDUCATION',
    'SPECIALIZATION',
    'INSURANCE_APPROVAL'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CredentialStatus" AS ENUM ('ACTIVE', 'EXPIRING', 'EXPIRED', 'SUSPENDED', 'PENDING');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CredentialVerificationStatus" AS ENUM ('VERIFIED', 'UNVERIFIED', 'PENDING');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TransportMethod" AS ENUM ('CAR', 'PUBLIC_TRANSPORT', 'BICYCLE', 'WALKING', 'MOTORCYCLE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "Locale" AS ENUM ('DE', 'EN');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "Currency" AS ENUM ('EUR');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ExportType" AS ENUM ('ACCOUNTING_EXPORT', 'DATA_BACKUP', 'CUSTOM_REPORT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ExportTargetSystem" AS ENUM ('BMD', 'RZL', 'DATEV', 'CSV_GENERIC', 'CUSTOM');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Therapist table extensions
ALTER TABLE "Therapist"
  ADD COLUMN IF NOT EXISTS profile_completion_score INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS settings_last_updated TIMESTAMP,
  ADD COLUMN IF NOT EXISTS settings_version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS public_profile_slug TEXT,
  ADD COLUMN IF NOT EXISTS public_profile_description TEXT,
  ADD COLUMN IF NOT EXISTS business_type TEXT,
  ADD COLUMN IF NOT EXISTS business_registration_number TEXT,
  ADD COLUMN IF NOT EXISTS tax_advisor_name TEXT,
  ADD COLUMN IF NOT EXISTS tax_advisor_email TEXT,
  ADD COLUMN IF NOT EXISTS tax_advisor_phone TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Therapist_public_profile_slug_key"
  ON "Therapist"(public_profile_slug)
  WHERE public_profile_slug IS NOT NULL;

-- Service rate template enhancements
ALTER TABLE "ServiceRateTemplate"
  ADD COLUMN IF NOT EXISTS pricing_mode "PricingMode" NOT NULL DEFAULT 'NET',
  ADD COLUMN IF NOT EXISTS travel_included BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_participants INTEGER,
  ADD COLUMN IF NOT EXISTS default_location_id TEXT,
  ADD COLUMN IF NOT EXISTS booking_notes TEXT;

ALTER TABLE "ServiceRateTemplate"
  ADD CONSTRAINT service_rate_template_default_location_fkey
  FOREIGN KEY (default_location_id) REFERENCES "Location"(id)
  ON DELETE SET NULL;

-- Professional credential management
CREATE TABLE IF NOT EXISTS "TherapistCredential" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id TEXT NOT NULL REFERENCES "Therapist"(id) ON DELETE CASCADE,
  credential_type "CredentialType" NOT NULL,
  title TEXT NOT NULL,
  issuing_authority TEXT NOT NULL,
  credential_number TEXT,
  specialization TEXT,
  issue_date DATE,
  expiration_date DATE,
  renewal_required BOOLEAN NOT NULL DEFAULT false,
  status "CredentialStatus" NOT NULL DEFAULT 'ACTIVE',
  verification_url TEXT,
  verification_status "CredentialVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
  document_storage_key TEXT,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT credential_valid_dates CHECK (expiration_date IS NULL OR issue_date IS NULL OR expiration_date > issue_date)
);

CREATE INDEX IF NOT EXISTS idx_credentials_therapist_id ON "TherapistCredential"(therapist_id);
CREATE INDEX IF NOT EXISTS idx_credentials_status ON "TherapistCredential"(status);
CREATE INDEX IF NOT EXISTS idx_credentials_expiration ON "TherapistCredential"(expiration_date);
CREATE UNIQUE INDEX IF NOT EXISTS "TherapistCredential_therapist_id_title_key" ON "TherapistCredential"(therapist_id, title);

-- Travel settings
CREATE TABLE IF NOT EXISTS "TravelSettings" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id TEXT UNIQUE NOT NULL REFERENCES "Therapist"(id) ON DELETE CASCADE,
  base_address_line1 TEXT NOT NULL,
  base_address_line2 TEXT,
  base_city TEXT NOT NULL,
  base_postal_code TEXT NOT NULL,
  base_state TEXT,
  base_country TEXT NOT NULL DEFAULT 'Austria',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  service_radius_km INTEGER NOT NULL DEFAULT 20,
  maximum_travel_distance_km INTEGER,
  transport_method "TransportMethod" NOT NULL DEFAULT 'CAR',
  rate_per_km_cents INTEGER NOT NULL DEFAULT 42,
  minimum_travel_charge_cents INTEGER NOT NULL DEFAULT 500,
  travel_buffer_minutes INTEGER NOT NULL DEFAULT 15,
  daily_travel_budget_minutes INTEGER,
  preferred_transport_notes TEXT,
  preferred_regions TEXT[],
  excluded_regions TEXT[],
  avoid_highways BOOLEAN NOT NULL DEFAULT false,
  avoid_tolls BOOLEAN NOT NULL DEFAULT false,
  real_time_traffic BOOLEAN NOT NULL DEFAULT true,
  backup_transport_method TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_postal_code CHECK (base_postal_code ~ '^[1-9]\d{3}$'),
  CONSTRAINT valid_radius CHECK (service_radius_km > 0)
);

CREATE INDEX IF NOT EXISTS idx_travel_settings_postal ON "TravelSettings"(base_postal_code, base_city);

-- Tax compliance settings
CREATE TABLE IF NOT EXISTS "TaxComplianceSettings" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id TEXT UNIQUE NOT NULL REFERENCES "Therapist"(id) ON DELETE CASCADE,
  vat_number TEXT,
  vat_registered BOOLEAN NOT NULL DEFAULT false,
  kleinunternehmer_active BOOLEAN NOT NULL DEFAULT true,
  kleinunternehmer_threshold_cents INTEGER NOT NULL DEFAULT 5500000,
  current_year_revenue_cents INTEGER NOT NULL DEFAULT 0,
  revenue_year INTEGER,
  kleinunternehmer_start TIMESTAMP,
  kleinunternehmer_end TIMESTAMP,
  legal_notice_template TEXT,
  tax_advisor_name TEXT,
  tax_advisor_email TEXT,
  tax_advisor_phone TEXT,
  vat_registration_date TIMESTAMP,
  revenue_last_calculated_at TIMESTAMP,
  rksv_enabled BOOLEAN NOT NULL DEFAULT false,
  cash_register_id TEXT,
  signature_device_id TEXT,
  rksv_notes TEXT,
  last_rksv_audit_at TIMESTAMP,
  next_rksv_audit_due TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_vat_number CHECK (vat_number IS NULL OR vat_number ~ '^ATU\d{8}$')
);

CREATE INDEX IF NOT EXISTS idx_tax_settings_vat ON "TaxComplianceSettings"(vat_number);
CREATE INDEX IF NOT EXISTS idx_tax_settings_therapist ON "TaxComplianceSettings"(therapist_id);

-- User preferences
CREATE TABLE IF NOT EXISTS "UserPreferences" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id TEXT UNIQUE NOT NULL REFERENCES "Therapist"(id) ON DELETE CASCADE,
  language "Locale" NOT NULL DEFAULT 'DE',
  timezone TEXT NOT NULL DEFAULT 'Europe/Vienna',
  currency "Currency" NOT NULL DEFAULT 'EUR',
  date_format TEXT NOT NULL DEFAULT 'DD.MM.YYYY',
  number_format TEXT NOT NULL DEFAULT '1.234,56',
  appointment_reminder_days INTEGER NOT NULL DEFAULT 1,
  enable_email_notifications BOOLEAN NOT NULL DEFAULT true,
  enable_sms_notifications BOOLEAN NOT NULL DEFAULT false,
  enable_compliance_alerts BOOLEAN NOT NULL DEFAULT true,
  enable_travel_alerts BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Export configurations
CREATE TABLE IF NOT EXISTS "ExportConfiguration" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id TEXT NOT NULL REFERENCES "Therapist"(id) ON DELETE CASCADE,
  export_type "ExportType" NOT NULL,
  target_system "ExportTargetSystem" NOT NULL,
  configuration_name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  schedule_cron TEXT,
  field_mappings JSONB,
  last_run_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_export_configuration_target ON "ExportConfiguration"(therapist_id, target_system);
CREATE INDEX IF NOT EXISTS idx_export_configuration_default ON "ExportConfiguration"(therapist_id, is_default);
CREATE UNIQUE INDEX IF NOT EXISTS "ExportConfiguration_unique_name" ON "ExportConfiguration"(therapist_id, target_system, configuration_name);
