# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-09-07-therapist-profile-settings/spec.md

> Created: 2025-09-07
> Version: 1.0.0

## Schema Changes

### Extend Existing Therapist Model

Add new columns to the existing `Therapist` table to support business profile information and settings:

```sql
-- Business Information Fields
ALTER TABLE "Therapist" ADD COLUMN "businessName" TEXT;
ALTER TABLE "Therapist" ADD COLUMN "businessAddress" TEXT;
ALTER TABLE "Therapist" ADD COLUMN "businessPhone" TEXT;
ALTER TABLE "Therapist" ADD COLUMN "businessEmail" TEXT;
ALTER TABLE "Therapist" ADD COLUMN "businessWebsite" TEXT;

-- Austrian Compliance Fields
ALTER TABLE "Therapist" ADD COLUMN "uidNumber" TEXT;
ALTER TABLE "Therapist" ADD COLUMN "chamberRegistration" TEXT;
ALTER TABLE "Therapist" ADD COLUMN "invoiceFooter" TEXT;

-- Practice Preferences
ALTER TABLE "Therapist" ADD COLUMN "defaultReminderDays" INTEGER DEFAULT 1;
ALTER TABLE "Therapist" ADD COLUMN "enableEmailReminders" BOOLEAN DEFAULT true;
ALTER TABLE "Therapist" ADD COLUMN "enableSmsReminders" BOOLEAN DEFAULT false;

-- Profile Management
ALTER TABLE "Therapist" ADD COLUMN "profileCompletedAt" TIMESTAMP;
ALTER TABLE "Therapist" ADD COLUMN "updatedAt" TIMESTAMP DEFAULT NOW();
```

### New Service Rate Template Model

Create a new table to store service rate templates for default pricing:

```sql
CREATE TABLE "ServiceRateTemplate" (
  "id" TEXT NOT NULL,
  "therapistId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" "ServiceCategory" NOT NULL,
  "durationMin" INTEGER NOT NULL,
  "priceCents" INTEGER NOT NULL,
  "vatRate" "VatStatus" NOT NULL,
  "description" TEXT,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ServiceRateTemplate_pkey" PRIMARY KEY ("id")
);
```

### Indexes and Constraints

```sql
-- Foreign Key Relationships
ALTER TABLE "ServiceRateTemplate" ADD CONSTRAINT "ServiceRateTemplate_therapistId_fkey" 
    FOREIGN KEY ("therapistId") REFERENCES "Therapist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Performance Indexes
CREATE INDEX "ServiceRateTemplate_therapistId_category_active_idx" 
    ON "ServiceRateTemplate"("therapistId", "category", "active");

CREATE INDEX "ServiceRateTemplate_therapistId_isDefault_idx" 
    ON "ServiceRateTemplate"("therapistId", "isDefault");

-- Data Integrity Constraints
ALTER TABLE "Therapist" ADD CONSTRAINT "Therapist_uidNumber_format_check" 
    CHECK ("uidNumber" IS NULL OR "uidNumber" ~ '^ATU[0-9]{8}$');

ALTER TABLE "Therapist" ADD CONSTRAINT "Therapist_businessEmail_format_check" 
    CHECK ("businessEmail" IS NULL OR "businessEmail" ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$');

ALTER TABLE "ServiceRateTemplate" ADD CONSTRAINT "ServiceRateTemplate_priceCents_positive_check" 
    CHECK ("priceCents" > 0);

ALTER TABLE "ServiceRateTemplate" ADD CONSTRAINT "ServiceRateTemplate_durationMin_positive_check" 
    CHECK ("durationMin" > 0);
```

## Prisma Schema Updates

Update the `schema.prisma` file to reflect these changes:

```prisma
model Therapist {
  id                   String               @id @default(cuid())
  userId               String               @unique
  slug                 String               @unique
  designation          TherapistDesignation
  vatStatus            VatStatus
  kleinunternehmer     Boolean              @default(true)
  annualGrossCents     Int                  @default(0)
  annualGrossCachedAt  DateTime?
  iban                 String?
  brandColor           String?
  logoUrl              String?
  
  // New Business Information Fields
  businessName         String?
  businessAddress      String?
  businessPhone        String?
  businessEmail        String?
  businessWebsite      String?
  
  // New Austrian Compliance Fields
  uidNumber           String?
  chamberRegistration String?
  invoiceFooter       String?
  
  // New Practice Preferences
  defaultReminderDays  Int                 @default(1)
  enableEmailReminders Boolean             @default(true)
  enableSmsReminders   Boolean             @default(false)
  
  // New Profile Management
  profileCompletedAt   DateTime?
  createdAt            DateTime            @default(now())
  updatedAt            DateTime            @updatedAt
  
  // Existing Relations
  User                 User                @relation(fields: [userId], references: [id])
  Locations            Location[]
  Clients              Client[]
  Services             Service[]
  Appointments         Appointment[]
  BusinessHours        BusinessHours[]
  BlockedTimes         BlockedTime[]
  Invoices             Invoice[]
  Vouchers             Voucher[]
  Products             Product[]
  Orders               Order[]
  Consents             Consent[]
  Notes                Note[]
  Affiliates           Affiliate[]
  AuditLogs            AuditLog[]
  
  // New Relations
  ServiceRateTemplates ServiceRateTemplate[]
}

model ServiceRateTemplate {
  id           String          @id @default(cuid())
  therapistId  String
  name         String
  category     ServiceCategory
  durationMin  Int
  priceCents   Int
  vatRate      VatStatus
  description  String?
  isDefault    Boolean         @default(false)
  active       Boolean         @default(true)
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
  
  Therapist    Therapist       @relation(fields: [therapistId], references: [id], onDelete: Cascade)
  
  @@index([therapistId, category, active])
  @@index([therapistId, isDefault])
}
```

## Migrations

### Migration File: `add_therapist_profile_settings.sql`

```sql
-- Migration: Add therapist profile settings
-- Created: 2025-09-07

BEGIN;

-- Step 1: Add new columns to Therapist table
ALTER TABLE "Therapist" ADD COLUMN "businessName" TEXT;
ALTER TABLE "Therapist" ADD COLUMN "businessAddress" TEXT;
ALTER TABLE "Therapist" ADD COLUMN "businessPhone" TEXT;
ALTER TABLE "Therapist" ADD COLUMN "businessEmail" TEXT;
ALTER TABLE "Therapist" ADD COLUMN "businessWebsite" TEXT;
ALTER TABLE "Therapist" ADD COLUMN "uidNumber" TEXT;
ALTER TABLE "Therapist" ADD COLUMN "chamberRegistration" TEXT;
ALTER TABLE "Therapist" ADD COLUMN "invoiceFooter" TEXT;
ALTER TABLE "Therapist" ADD COLUMN "defaultReminderDays" INTEGER DEFAULT 1;
ALTER TABLE "Therapist" ADD COLUMN "enableEmailReminders" BOOLEAN DEFAULT true;
ALTER TABLE "Therapist" ADD COLUMN "enableSmsReminders" BOOLEAN DEFAULT false;
ALTER TABLE "Therapist" ADD COLUMN "profileCompletedAt" TIMESTAMP;
ALTER TABLE "Therapist" ADD COLUMN "updatedAt" TIMESTAMP DEFAULT NOW();

-- Step 2: Create ServiceRateTemplate table
CREATE TABLE "ServiceRateTemplate" (
  "id" TEXT NOT NULL,
  "therapistId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" "ServiceCategory" NOT NULL,
  "durationMin" INTEGER NOT NULL,
  "priceCents" INTEGER NOT NULL,
  "vatRate" "VatStatus" NOT NULL,
  "description" TEXT,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ServiceRateTemplate_pkey" PRIMARY KEY ("id")
);

-- Step 3: Add constraints and indexes
ALTER TABLE "ServiceRateTemplate" ADD CONSTRAINT "ServiceRateTemplate_therapistId_fkey" 
    FOREIGN KEY ("therapistId") REFERENCES "Therapist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "ServiceRateTemplate_therapistId_category_active_idx" 
    ON "ServiceRateTemplate"("therapistId", "category", "active");

CREATE INDEX "ServiceRateTemplate_therapistId_isDefault_idx" 
    ON "ServiceRateTemplate"("therapistId", "isDefault");

-- Step 4: Add data validation constraints
ALTER TABLE "Therapist" ADD CONSTRAINT "Therapist_uidNumber_format_check" 
    CHECK ("uidNumber" IS NULL OR "uidNumber" ~ '^ATU[0-9]{8}$');

ALTER TABLE "Therapist" ADD CONSTRAINT "Therapist_businessEmail_format_check" 
    CHECK ("businessEmail" IS NULL OR "businessEmail" ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$');

ALTER TABLE "ServiceRateTemplate" ADD CONSTRAINT "ServiceRateTemplate_priceCents_positive_check" 
    CHECK ("priceCents" > 0);

ALTER TABLE "ServiceRateTemplate" ADD CONSTRAINT "ServiceRateTemplate_durationMin_positive_check" 
    CHECK ("durationMin" > 0);

COMMIT;
```

## Data Integrity and Performance

### Rationale for Schema Design

- **Therapist Model Extension**: Adding fields directly to the existing Therapist table maintains simplicity and avoids unnecessary joins for profile information
- **ServiceRateTemplate Separation**: Creating a separate table allows for flexible rate management and future features like multiple rate templates per therapist
- **Austrian Compliance Validation**: Database-level constraints ensure UID number format compliance and business email validation
- **Performance Optimization**: Strategic indexing on therapistId + category + active for efficient template lookups during invoice creation
- **Data Integrity**: Foreign key cascading ensures cleanup when therapist accounts are deleted, maintaining referential integrity

### Performance Considerations

- Index on `therapistId + category + active` supports common query pattern for fetching active templates by category
- Index on `therapistId + isDefault` enables quick lookup of default templates for each therapist
- CHECK constraints provide data validation at the database level without performance impact on reads
- Separate table for templates allows for efficient querying without bloating the main Therapist table

### Security and Encryption

- Sensitive fields like `uidNumber` and `iban` (existing) will use the established libsodium encryption pattern
- Business contact information follows the same encryption approach as existing client data
- Profile completion timestamps support audit requirements without storing sensitive metadata