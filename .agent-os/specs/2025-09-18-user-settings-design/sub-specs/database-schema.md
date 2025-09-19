# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-09-18-user-settings-design/spec.md

> Created: 2025-09-18
> Version: 1.0.0

## Schema Changes

### Existing Table Extensions

#### Therapist Table Extensions
```sql
-- Add settings-related columns to existing Therapist table
ALTER TABLE "Therapist" ADD COLUMN IF NOT EXISTS
  -- Profile completion tracking
  profile_completion_score INTEGER DEFAULT 0 CHECK (profile_completion_score >= 0 AND profile_completion_score <= 100),
  settings_last_updated TIMESTAMP DEFAULT NOW(),
  settings_version INTEGER DEFAULT 1,

  -- Business information
  business_name TEXT,
  business_type TEXT, -- 'sole_proprietorship', 'gmbh', 'partnership', 'other'
  business_registration_number TEXT, -- Austrian Firmenbuchnummer
  chamber_of_commerce_number TEXT, -- WKO number

  -- Austrian tax compliance
  vat_number TEXT, -- Austrian UID number (ATUxxxxxxxx)
  vat_registered BOOLEAN DEFAULT false,
  kleinunternehmer_status BOOLEAN DEFAULT true,
  current_year_revenue DECIMAL(10,2) DEFAULT 0.00,
  tax_advisor_name TEXT,
  tax_advisor_email TEXT,
  tax_advisor_phone TEXT,

  -- Professional credentials summary
  primary_qualification TEXT,
  qualification_authority TEXT, -- 'WKO', 'BMG', 'Regional Authority'
  license_number TEXT,
  license_expiry_date DATE,

  -- Public profile settings
  public_booking_enabled BOOLEAN DEFAULT false,
  public_profile_slug TEXT UNIQUE,
  public_profile_description TEXT,
  business_hours_display TEXT,

  -- Notification preferences
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  appointment_reminders BOOLEAN DEFAULT true,
  tax_threshold_alerts BOOLEAN DEFAULT true,
  compliance_warnings BOOLEAN DEFAULT true,

  -- System preferences
  preferred_language TEXT DEFAULT 'de' CHECK (preferred_language IN ('de', 'en')),
  timezone TEXT DEFAULT 'Europe/Vienna',
  currency_format TEXT DEFAULT 'EUR',
  date_format TEXT DEFAULT 'DD.MM.YYYY',

  -- Business address (if different from personal)
  business_address_line1 TEXT,
  business_address_line2 TEXT,
  business_city TEXT,
  business_postal_code TEXT,
  business_state TEXT, -- Austrian Bundesland
  business_country TEXT DEFAULT 'AT',
  business_coordinates POINT, -- PostGIS for geographic calculations

  -- Contact information
  business_phone TEXT,
  business_email TEXT,
  website_url TEXT,

  -- Integration preferences
  accounting_software TEXT, -- 'BMD', 'RZL', 'DATEV', 'Manual', 'Other'
  export_format_preference TEXT DEFAULT 'CSV',
  auto_export_enabled BOOLEAN DEFAULT false,

  -- Constraints and indexes
  CONSTRAINT valid_postal_code_at CHECK (business_postal_code ~ '^[1-9]\d{3}$' OR business_postal_code IS NULL),
  CONSTRAINT valid_vat_number CHECK (vat_number ~ '^ATU\d{8}$' OR vat_number IS NULL),
  CONSTRAINT valid_email_format CHECK (business_email ~ '^[^@]+@[^@]+\.[^@]+$' OR business_email IS NULL);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_therapist_vat_number ON "Therapist"(vat_number);
CREATE INDEX IF NOT EXISTS idx_therapist_public_slug ON "Therapist"(public_profile_slug);
CREATE INDEX IF NOT EXISTS idx_therapist_business_coordinates ON "Therapist" USING GIST (business_coordinates);
```

### New Settings Tables

#### Professional Credentials Management
```sql
CREATE TABLE "TherapistCredentials" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id TEXT NOT NULL REFERENCES "Therapist"(id) ON DELETE CASCADE,

  -- Credential details
  credential_type TEXT NOT NULL CHECK (credential_type IN (
    'professional_license', 'certification', 'qualification',
    'continuing_education', 'specialty_training', 'insurance_approval'
  )),
  credential_name TEXT NOT NULL,
  issuing_authority TEXT NOT NULL,
  credential_number TEXT,

  -- Validity dates
  issue_date DATE,
  expiration_date DATE,
  renewal_required BOOLEAN DEFAULT false,

  -- Status and verification
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended', 'pending')),
  verification_url TEXT,
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('verified', 'unverified', 'pending')),

  -- File attachments (encrypted storage references)
  certificate_file_id TEXT, -- Reference to secure file storage
  certificate_file_name TEXT,
  certificate_file_size INTEGER,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_dates CHECK (expiration_date IS NULL OR issue_date IS NULL OR expiration_date > issue_date),
  CONSTRAINT valid_url CHECK (verification_url ~ '^https?://' OR verification_url IS NULL)
);

-- Indexes for credentials
CREATE INDEX idx_credentials_therapist_id ON "TherapistCredentials"(therapist_id);
CREATE INDEX idx_credentials_expiry ON "TherapistCredentials"(expiration_date) WHERE expiration_date IS NOT NULL;
CREATE INDEX idx_credentials_status ON "TherapistCredentials"(status);
```

#### Travel Configuration
```sql
CREATE TABLE "TravelSettings" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id TEXT UNIQUE NOT NULL REFERENCES "Therapist"(id) ON DELETE CASCADE,

  -- Base location
  base_address_line1 TEXT NOT NULL,
  base_address_line2 TEXT,
  base_city TEXT NOT NULL,
  base_postal_code TEXT NOT NULL CHECK (base_postal_code ~ '^[1-9]\d{3}$'),
  base_coordinates POINT NOT NULL, -- PostGIS for precise calculations

  -- Transport configuration
  transport_method TEXT DEFAULT 'car' CHECK (transport_method IN (
    'car', 'public_transport', 'bicycle', 'walking', 'motorcycle', 'mixed'
  )),
  vehicle_type TEXT, -- 'compact', 'sedan', 'suv', 'electric', etc.

  -- Pricing and costs
  rate_per_km DECIMAL(5,2) DEFAULT 0.42, -- Standard Austrian rate €0.42/km
  minimum_travel_charge DECIMAL(5,2) DEFAULT 5.00,
  hourly_travel_rate DECIMAL(5,2), -- Alternative to per-km pricing
  fuel_cost_per_100km DECIMAL(5,2) DEFAULT 8.00,
  parking_fee_average DECIMAL(4,2) DEFAULT 2.50,

  -- Geographic boundaries
  maximum_travel_distance INTEGER DEFAULT 25, -- kilometers
  service_radius_km INTEGER DEFAULT 20,
  preferred_regions TEXT[], -- Array of preferred Austrian postal code prefixes
  excluded_regions TEXT[], -- Areas to avoid

  -- Time management
  travel_buffer_minutes INTEGER DEFAULT 15,
  minimum_travel_time INTEGER DEFAULT 10, -- minutes
  maximum_travel_time INTEGER DEFAULT 60, -- minutes
  preparation_time INTEGER DEFAULT 5, -- minutes before departure

  -- Route preferences
  avoid_highways BOOLEAN DEFAULT false,
  avoid_tolls BOOLEAN DEFAULT false,
  prefer_shortest_route BOOLEAN DEFAULT false, -- vs fastest route
  traffic_consideration BOOLEAN DEFAULT true,

  -- Emergency and backup
  backup_transport_method TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,

  -- Integration settings
  google_maps_enabled BOOLEAN DEFAULT true,
  route_optimization BOOLEAN DEFAULT false,
  real_time_traffic BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_rates CHECK (rate_per_km >= 0 AND minimum_travel_charge >= 0),
  CONSTRAINT valid_distances CHECK (maximum_travel_distance > 0 AND service_radius_km > 0),
  CONSTRAINT valid_times CHECK (travel_buffer_minutes >= 0 AND minimum_travel_time >= 0)
);

-- Indexes for travel settings
CREATE INDEX idx_travel_therapist_id ON "TravelSettings"(therapist_id);
CREATE INDEX idx_travel_coordinates ON "TravelSettings" USING GIST (base_coordinates);
```

#### Service Rate Templates
```sql
CREATE TABLE "ServiceRateTemplates" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id TEXT NOT NULL REFERENCES "Therapist"(id) ON DELETE CASCADE,

  -- Service details
  service_name TEXT NOT NULL,
  service_category TEXT NOT NULL CHECK (service_category IN (
    'massage', 'physiotherapy', 'manual_therapy', 'wellness',
    'rehabilitation', 'prevention', 'consultation', 'other'
  )),
  service_description TEXT,
  service_code TEXT, -- Internal reference code

  -- Pricing structure
  base_price DECIMAL(6,2) NOT NULL CHECK (base_price >= 0),
  currency TEXT DEFAULT 'EUR',
  pricing_type TEXT DEFAULT 'fixed' CHECK (pricing_type IN ('fixed', 'hourly', 'package')),

  -- Duration and scheduling
  default_duration_minutes INTEGER NOT NULL CHECK (default_duration_minutes > 0),
  minimum_duration_minutes INTEGER,
  maximum_duration_minutes INTEGER,
  duration_increment INTEGER DEFAULT 15, -- minute increments

  -- Austrian tax configuration
  vat_rate DECIMAL(4,2) DEFAULT 20.00 CHECK (vat_rate >= 0 AND vat_rate <= 100),
  vat_included BOOLEAN DEFAULT true,
  kleinunternehmer_exempt BOOLEAN DEFAULT false,

  -- Travel and location
  home_visit_available BOOLEAN DEFAULT true,
  travel_included BOOLEAN DEFAULT false,
  travel_surcharge DECIMAL(5,2) DEFAULT 0.00,
  maximum_travel_for_service INTEGER, -- km limit for this service

  -- Package deal options
  package_sessions INTEGER, -- for multi-session packages
  package_discount_percent DECIMAL(4,2) DEFAULT 0,
  package_validity_days INTEGER, -- how long package is valid

  -- Availability and constraints
  requires_qualification TEXT, -- required credential for this service
  minimum_age_requirement INTEGER,
  maximum_age_recommendation INTEGER,
  contraindications TEXT[], -- array of medical contraindications

  -- Insurance and billing
  insurance_eligible BOOLEAN DEFAULT false,
  insurance_code TEXT, -- ÖGK or private insurance code
  prescription_required BOOLEAN DEFAULT false,

  -- Public booking
  public_booking_enabled BOOLEAN DEFAULT true,
  online_payment_accepted BOOLEAN DEFAULT false,
  advance_booking_required_hours INTEGER DEFAULT 24,
  cancellation_hours_notice INTEGER DEFAULT 24,

  -- Service status
  active BOOLEAN DEFAULT true,
  archived BOOLEAN DEFAULT false,
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_until DATE,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,
  usage_count INTEGER DEFAULT 0,

  -- Constraints
  CONSTRAINT valid_duration_range CHECK (
    minimum_duration_minutes IS NULL OR maximum_duration_minutes IS NULL OR
    minimum_duration_minutes <= default_duration_minutes AND
    default_duration_minutes <= maximum_duration_minutes
  ),
  CONSTRAINT valid_effective_dates CHECK (effective_until IS NULL OR effective_from <= effective_until),
  CONSTRAINT valid_package_config CHECK (
    (package_sessions IS NULL AND package_discount_percent = 0 AND package_validity_days IS NULL) OR
    (package_sessions > 1 AND package_discount_percent >= 0 AND package_validity_days > 0)
  )
);

-- Indexes for service rates
CREATE INDEX idx_service_rates_therapist_id ON "ServiceRateTemplates"(therapist_id);
CREATE INDEX idx_service_rates_category ON "ServiceRateTemplates"(service_category);
CREATE INDEX idx_service_rates_active ON "ServiceRateTemplates"(active) WHERE active = true;
CREATE INDEX idx_service_rates_public ON "ServiceRateTemplates"(public_booking_enabled) WHERE public_booking_enabled = true;
```

#### Austrian Tax Compliance Tracking
```sql
CREATE TABLE "TaxComplianceSettings" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id TEXT UNIQUE NOT NULL REFERENCES "Therapist"(id) ON DELETE CASCADE,

  -- VAT registration details
  vat_registration_date DATE,
  vat_registration_authority TEXT,
  vat_return_frequency TEXT CHECK (vat_return_frequency IN ('monthly', 'quarterly', 'annual')),
  next_vat_return_due DATE,

  -- Kleinunternehmer tracking
  kleinunternehmer_start_date DATE,
  kleinunternehmer_threshold DECIMAL(10,2) DEFAULT 55000.00,
  current_year_revenue DECIMAL(10,2) DEFAULT 0.00,
  previous_year_revenue DECIMAL(10,2),
  threshold_breach_date DATE,
  threshold_warning_sent BOOLEAN DEFAULT false,

  -- Tax rates configuration
  default_vat_rate DECIMAL(4,2) DEFAULT 20.00,
  reduced_vat_rate DECIMAL(4,2) DEFAULT 10.00,
  exempt_vat_rate DECIMAL(4,2) DEFAULT 0.00,

  -- Austrian business compliance
  business_registration_type TEXT CHECK (business_registration_type IN (
    'gewerbeschein', 'neue_selbststaendige', 'freiberufler', 'land_forstwirtschaft'
  )),
  social_insurance_number TEXT,
  wko_membership_number TEXT,
  health_insurance_provider TEXT, -- 'ÖGK', 'SVS', etc.

  -- Legal notice configuration
  legal_notice_template TEXT,
  kleinunternehmer_notice TEXT DEFAULT 'Kleinunternehmer gem. § 6 Abs. 1 Z 27 UStG',
  invoice_footer_text TEXT,
  terms_and_conditions_url TEXT,

  -- Compliance monitoring
  last_compliance_check TIMESTAMP DEFAULT NOW(),
  compliance_status TEXT DEFAULT 'compliant' CHECK (compliance_status IN (
    'compliant', 'warning', 'breach', 'unknown'
  )),
  compliance_notes TEXT,

  -- Alert preferences
  threshold_alert_percentage INTEGER DEFAULT 80, -- alert at 80% of threshold
  quarterly_review_reminder BOOLEAN DEFAULT true,
  annual_tax_return_reminder BOOLEAN DEFAULT true,
  vat_return_reminder_days INTEGER DEFAULT 7,

  -- Professional advisor
  tax_advisor_firm TEXT,
  tax_advisor_contact_person TEXT,
  tax_advisor_phone TEXT,
  tax_advisor_email TEXT,
  tax_advisor_address TEXT,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_threshold CHECK (kleinunternehmer_threshold > 0),
  CONSTRAINT valid_revenue CHECK (current_year_revenue >= 0 AND previous_year_revenue >= 0),
  CONSTRAINT valid_vat_rates CHECK (
    default_vat_rate >= 0 AND reduced_vat_rate >= 0 AND exempt_vat_rate >= 0
  ),
  CONSTRAINT valid_alert_percentage CHECK (threshold_alert_percentage BETWEEN 50 AND 100)
);

-- Index for tax compliance
CREATE INDEX idx_tax_compliance_therapist_id ON "TaxComplianceSettings"(therapist_id);
CREATE INDEX idx_tax_compliance_status ON "TaxComplianceSettings"(compliance_status);
```

#### Export Configuration
```sql
CREATE TABLE "ExportConfigurations" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id TEXT NOT NULL REFERENCES "Therapist"(id) ON DELETE CASCADE,

  -- Export type and target
  export_type TEXT NOT NULL CHECK (export_type IN (
    'accounting_export', 'backup_export', 'tax_report', 'statistics', 'client_data'
  )),
  target_system TEXT NOT NULL CHECK (target_system IN (
    'BMD_NTCS', 'RZL', 'DATEV', 'Excel', 'CSV_Generic', 'JSON', 'XML'
  )),
  configuration_name TEXT NOT NULL,

  -- File format settings
  file_format TEXT DEFAULT 'CSV' CHECK (file_format IN ('CSV', 'Excel', 'JSON', 'XML', 'TXT')),
  encoding TEXT DEFAULT 'UTF-8',
  delimiter TEXT DEFAULT ';',
  quote_character TEXT DEFAULT '"',
  date_format TEXT DEFAULT 'DD.MM.YYYY',
  decimal_separator TEXT DEFAULT ',',
  thousands_separator TEXT DEFAULT '.',

  -- Field mapping configuration (JSON)
  field_mappings JSONB NOT NULL DEFAULT '{}',
  required_fields TEXT[] DEFAULT ARRAY[]::TEXT[],
  optional_fields TEXT[] DEFAULT ARRAY[]::TEXT[],
  calculated_fields JSONB DEFAULT '{}',

  -- Austrian compliance
  include_vat_breakdown BOOLEAN DEFAULT true,
  include_kleinunternehmer_notice BOOLEAN DEFAULT true,
  currency_code TEXT DEFAULT 'EUR',
  tax_period_format TEXT DEFAULT 'quarterly',

  -- Filtering and selection
  date_range_type TEXT DEFAULT 'current_month' CHECK (date_range_type IN (
    'current_month', 'current_quarter', 'current_year', 'custom_range', 'all_time'
  )),
  include_draft_invoices BOOLEAN DEFAULT false,
  include_cancelled_invoices BOOLEAN DEFAULT false,
  client_filter_criteria JSONB DEFAULT '{}',

  -- Automation settings
  auto_export_enabled BOOLEAN DEFAULT false,
  export_frequency TEXT CHECK (export_frequency IN ('daily', 'weekly', 'monthly', 'quarterly') OR export_frequency IS NULL),
  export_time TIME DEFAULT '09:00:00',
  email_export_to TEXT[],

  -- File storage
  output_directory TEXT,
  filename_template TEXT DEFAULT '[therapist_name]_[export_type]_[date].[extension]',
  overwrite_existing BOOLEAN DEFAULT false,
  archive_old_exports BOOLEAN DEFAULT true,

  -- Security and encryption
  encrypt_export BOOLEAN DEFAULT false,
  encryption_password_required BOOLEAN DEFAULT false,
  password_hint TEXT,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_export_at TIMESTAMP,
  export_count INTEGER DEFAULT 0,
  last_export_status TEXT,
  last_export_error TEXT,

  -- Constraints
  CONSTRAINT valid_email_list CHECK (
    email_export_to IS NULL OR
    array_length(email_export_to, 1) IS NULL OR
    (email_export_to && ARRAY(SELECT unnest(email_export_to) WHERE unnest ~ '^[^@]+@[^@]+\.[^@]+$'))
  ),
  CONSTRAINT valid_filename_template CHECK (filename_template ~ '\[date\]' AND filename_template ~ '\[extension\]')
);

-- Indexes for export configurations
CREATE INDEX idx_export_config_therapist_id ON "ExportConfigurations"(therapist_id);
CREATE INDEX idx_export_config_type ON "ExportConfigurations"(export_type, target_system);
CREATE INDEX idx_export_config_auto ON "ExportConfigurations"(auto_export_enabled) WHERE auto_export_enabled = true;
```

## Migrations

### Initial Settings Migration
```sql
-- Migration: 20250918_add_user_settings_tables.sql

BEGIN;

-- Add PostGIS extension if not exists (for geographic calculations)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Execute all table creations and modifications from above
-- (Include all the CREATE TABLE and ALTER TABLE statements)

-- Seed default data for existing therapists
INSERT INTO "TravelSettings" (therapist_id, base_address_line1, base_city, base_postal_code, base_coordinates)
SELECT
  id,
  COALESCE(address, 'Hauptstraße 1'),
  COALESCE(city, 'Linz'),
  COALESCE(postal_code, '4020'),
  ST_Point(14.2858, 48.3069) -- Linz coordinates as default
FROM "Therapist"
WHERE id NOT IN (SELECT therapist_id FROM "TravelSettings");

-- Create default service rate templates for existing therapists
INSERT INTO "ServiceRateTemplates" (therapist_id, service_name, service_category, base_price, default_duration_minutes)
SELECT
  id,
  'Klassische Massage',
  'massage',
  80.00,
  60
FROM "Therapist"
WHERE id NOT IN (SELECT DISTINCT therapist_id FROM "ServiceRateTemplates");

-- Initialize tax compliance settings
INSERT INTO "TaxComplianceSettings" (therapist_id, kleinunternehmer_start_date)
SELECT
  id,
  CURRENT_DATE
FROM "Therapist"
WHERE id NOT IN (SELECT therapist_id FROM "TaxComplianceSettings");

-- Create default export configuration
INSERT INTO "ExportConfigurations" (therapist_id, export_type, target_system, configuration_name, field_mappings)
SELECT
  id,
  'accounting_export',
  'CSV_Generic',
  'Standard Export',
  '{"invoice_number": "Rechnungsnummer", "date": "Datum", "client_name": "Kunde", "amount": "Betrag"}'::jsonb
FROM "Therapist"
WHERE id NOT IN (SELECT DISTINCT therapist_id FROM "ExportConfigurations");

COMMIT;
```

### Data Migration for Existing Users
```sql
-- Migration: 20250918_migrate_existing_settings.sql

BEGIN;

-- Update profile completion scores based on existing data
UPDATE "Therapist" SET
  profile_completion_score = (
    CASE WHEN email IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN phone IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN address IS NOT NULL THEN 15 ELSE 0 END +
    CASE WHEN city IS NOT NULL THEN 15 ELSE 0 END +
    CASE WHEN postal_code IS NOT NULL THEN 15 ELSE 0 END +
    CASE WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN 20 ELSE 0 END +
    CASE WHEN bio IS NOT NULL THEN 15 ELSE 0 END
  ),
  business_name = CASE
    WHEN first_name IS NOT NULL AND last_name IS NOT NULL
    THEN CONCAT(first_name, ' ', last_name, ' - Therapie')
    ELSE 'Praxis für Therapie'
  END,
  business_address_line1 = address,
  business_city = city,
  business_postal_code = postal_code,
  business_phone = phone,
  business_email = email
WHERE profile_completion_score IS NULL OR profile_completion_score = 0;

-- Set geographic coordinates for existing addresses using OpenStreetMap Nominatim
-- (This would typically be done via application logic, not SQL)
UPDATE "TravelSettings"
SET base_coordinates = ST_Point(
  CASE base_postal_code
    WHEN '4020' THEN 14.2858  -- Linz
    WHEN '4040' THEN 14.3208  -- Leonding
    WHEN '4600' THEN 14.0294  -- Wels
    ELSE 14.2858 -- Default to Linz
  END,
  CASE base_postal_code
    WHEN '4020' THEN 48.3069  -- Linz
    WHEN '4040' THEN 48.2684  -- Leonding
    WHEN '4600' THEN 48.1598  -- Wels
    ELSE 48.3069 -- Default to Linz
  END
)
WHERE base_coordinates IS NULL;

COMMIT;
```

### Cleanup and Optimization
```sql
-- Migration: 20250918_settings_optimization.sql

BEGIN;

-- Add missing foreign key constraints with proper cascading
ALTER TABLE "TherapistCredentials"
  ADD CONSTRAINT fk_credentials_therapist
  FOREIGN KEY (therapist_id) REFERENCES "Therapist"(id) ON DELETE CASCADE;

-- Create composite indexes for common queries
CREATE INDEX idx_service_rates_therapist_active ON "ServiceRateTemplates"(therapist_id, active);
CREATE INDEX idx_credentials_therapist_status ON "TherapistCredentials"(therapist_id, status);

-- Add check constraints for data integrity
ALTER TABLE "Therapist"
  ADD CONSTRAINT check_profile_completion
  CHECK (profile_completion_score >= 0 AND profile_completion_score <= 100);

-- Create trigger to update profile completion score automatically
CREATE OR REPLACE FUNCTION update_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
  NEW.profile_completion_score := (
    CASE WHEN NEW.email IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN NEW.phone IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN NEW.business_address_line1 IS NOT NULL THEN 15 ELSE 0 END +
    CASE WHEN NEW.business_city IS NOT NULL THEN 15 ELSE 0 END +
    CASE WHEN NEW.business_postal_code IS NOT NULL THEN 15 ELSE 0 END +
    CASE WHEN NEW.first_name IS NOT NULL AND NEW.last_name IS NOT NULL THEN 20 ELSE 0 END +
    CASE WHEN NEW.bio IS NOT NULL THEN 15 ELSE 0 END
  );
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_profile_completion
  BEFORE UPDATE ON "Therapist"
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_completion();

COMMIT;
```