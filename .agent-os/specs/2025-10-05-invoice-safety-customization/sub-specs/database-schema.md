# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-10-05-invoice-safety-customization/spec.md

> Created: 2025-10-05
> Version: 1.0.0

## Schema Changes

### 1. Therapist Model Updates

**New Fields:**
```prisma
model Therapist {
  // ... existing fields ...

  // Invoice Branding & Customization
  invoiceLogoUrl            String?                   @map("invoice_logo_url")
  invoiceDisplayPreference  InvoiceDisplayPreference  @default(NAME) @map("invoice_display_preference")
  invoiceThankYouMessage    String?                   @map("invoice_thank_you_message")

  // Tax Validation Tracking
  taxValidationStatus       Boolean                   @default(false) @map("tax_validation_status")
  taxValidatedAt            DateTime?                 @map("tax_validated_at") @db.Timestamp(6)
  taxValidatedBy            String?                   @map("tax_validated_by")

  // ... existing fields (annualGrossCents, annualGrossCachedAt already exist) ...
}
```

**Field Descriptions:**

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `invoiceLogoUrl` | String | Yes | null | URL to uploaded practice logo (stored in Vercel Blob/S3) |
| `invoiceDisplayPreference` | Enum | No | NAME | How to display branding in invoice header (LOGO, NAME, BOTH) |
| `invoiceThankYouMessage` | String | Yes | null | Custom message shown on invoices (max 500 chars) |
| `taxValidationStatus` | Boolean | No | false | Whether invoice settings have been professionally validated |
| `taxValidatedAt` | DateTime | Yes | null | Timestamp when validation occurred |
| `taxValidatedBy` | String | Yes | null | Name/email of validator (tax advisor or admin) |

**Existing Fields Used (No Changes):**

| Field | Type | Current Usage | New Usage |
|-------|------|---------------|-----------|
| `annualGrossCents` | Int | Cached annual revenue | Cache for revenue threshold calculation |
| `annualGrossCachedAt` | DateTime? | Cache timestamp | TTL check for revenue calculation (24hr) |

### 2. New Enum: InvoiceDisplayPreference

```prisma
enum InvoiceDisplayPreference {
  LOGO  // Show uploaded logo only (hide business name)
  NAME  // Show business name only (current default behavior)
  BOTH  // Show logo above business name
}
```

**Usage:**
- Controls invoice header rendering in PDF generation
- Default: `NAME` (preserves current behavior for existing users)
- Fallback: If `LOGO` selected but no logoUrl exists, renders business name

### 3. Database Indexes

**Existing Indexes (Already Support New Features):**
```sql
-- Revenue calculation query uses existing index
CREATE INDEX idx_invoice_therapist_created ON Invoice(therapistId, createdAt);

-- Tax validation lookup (covered by primary key)
-- No additional index needed for taxValidationStatus (boolean column)
```

**No New Indexes Required:**
- Logo URL: Not queried (only loaded with therapist record)
- Display preference: Not used in WHERE clauses
- Thank you message: Not queried independently
- Tax validation fields: Loaded with therapist record, no filtering

## Migrations

### Migration File: `add_invoice_customization.sql`

```sql
-- Migration: Add invoice customization and tax validation fields
-- Created: 2025-10-05

BEGIN;

-- 1. Create new enum for invoice display preference
CREATE TYPE "InvoiceDisplayPreference" AS ENUM ('LOGO', 'NAME', 'BOTH');

-- 2. Add invoice branding columns to Therapist table
ALTER TABLE "Therapist"
  ADD COLUMN "invoice_logo_url" TEXT,
  ADD COLUMN "invoice_display_preference" "InvoiceDisplayPreference" NOT NULL DEFAULT 'NAME',
  ADD COLUMN "invoice_thank_you_message" TEXT;

-- 3. Add tax validation columns to Therapist table
ALTER TABLE "Therapist"
  ADD COLUMN "tax_validation_status" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "tax_validated_at" TIMESTAMP(6),
  ADD COLUMN "tax_validated_by" TEXT;

-- 4. Add comments for documentation
COMMENT ON COLUMN "Therapist"."invoice_logo_url" IS 'URL to uploaded practice logo for invoices';
COMMENT ON COLUMN "Therapist"."invoice_display_preference" IS 'How to display branding in invoice header';
COMMENT ON COLUMN "Therapist"."invoice_thank_you_message" IS 'Custom thank you message for invoices (max 500 chars)';
COMMENT ON COLUMN "Therapist"."tax_validation_status" IS 'Whether invoice settings have been professionally validated';
COMMENT ON COLUMN "Therapist"."tax_validated_at" IS 'Timestamp when tax validation occurred';
COMMENT ON COLUMN "Therapist"."tax_validated_by" IS 'Name/email of person who validated settings';

COMMIT;
```

### Rollback Migration: `rollback_invoice_customization.sql`

```sql
-- Rollback: Remove invoice customization fields
-- Created: 2025-10-05

BEGIN;

-- 1. Remove columns from Therapist table
ALTER TABLE "Therapist"
  DROP COLUMN "invoice_logo_url",
  DROP COLUMN "invoice_display_preference",
  DROP COLUMN "invoice_thank_you_message",
  DROP COLUMN "tax_validation_status",
  DROP COLUMN "tax_validated_at",
  DROP COLUMN "tax_validated_by";

-- 2. Drop enum type
DROP TYPE "InvoiceDisplayPreference";

COMMIT;
```

### Data Migration Considerations

**No Data Backfill Required:**
- All new fields have safe defaults or are nullable
- Existing therapists automatically get:
  - `invoiceDisplayPreference = 'NAME'` (preserves current behavior)
  - `taxValidationStatus = false` (correct - not yet validated)
  - All other fields = null (correct default state)

**Post-Migration Verification:**
```sql
-- Verify migration applied correctly
SELECT
  COUNT(*) as total_therapists,
  COUNT(invoice_logo_url) as therapists_with_logo,
  COUNT(CASE WHEN invoice_display_preference = 'NAME' THEN 1 END) as using_name_display,
  COUNT(CASE WHEN tax_validation_status = true THEN 1 END) as validated_therapists
FROM "Therapist";

-- Expected results:
-- - total_therapists: All existing + new therapists
-- - therapists_with_logo: 0 (no logos uploaded yet)
-- - using_name_display: 100% of therapists (default)
-- - validated_therapists: 0 (no validations yet)
```

## Schema Validation

### Prisma Schema Validation Rules

```typescript
// packages/db/schema.prisma

model Therapist {
  // Invoice branding constraints
  invoiceLogoUrl String? @map("invoice_logo_url")
  // ✓ Nullable - therapists without logo can still generate invoices
  // ✓ No length constraint - URLs can vary in length
  // ✓ No format validation in schema - handled in application layer

  invoiceDisplayPreference InvoiceDisplayPreference @default(NAME) @map("invoice_display_preference")
  // ✓ Non-nullable with default - always has a valid value
  // ✓ Enum constraint - only accepts LOGO, NAME, or BOTH

  invoiceThankYouMessage String? @map("invoice_thank_you_message")
  // ✓ Nullable - optional feature
  // ✓ No length constraint in database - enforced in application (500 chars max)

  taxValidationStatus Boolean @default(false) @map("tax_validation_status")
  // ✓ Non-nullable with default - always has a valid value
  // ✓ Boolean type - simple true/false flag

  taxValidatedAt DateTime? @map("tax_validated_at") @db.Timestamp(6)
  // ✓ Nullable - only set when validation occurs
  // ✓ Timestamp with microsecond precision

  taxValidatedBy String? @map("tax_validated_by")
  // ✓ Nullable - only set when validation occurs
  // ✓ Stores validator name/email for audit trail
}
```

### Application-Layer Validation

**Invoice Branding Settings API:**
```typescript
import { z } from 'zod'

const InvoiceBrandingSchema = z.object({
  logoUrl: z.string().url().nullable().optional()
    .refine(url => !url || url.startsWith('https://'), {
      message: 'Logo URL must use HTTPS in production'
    }),

  displayPreference: z.enum(['LOGO', 'NAME', 'BOTH']).optional(),

  thankYouMessage: z.string().max(500).nullable().optional()
    .refine(msg => !msg || msg.trim().length > 0, {
      message: 'Thank you message cannot be empty whitespace'
    })
})
```

**Tax Validation API:**
```typescript
const TaxValidationSchema = z.object({
  validatedBy: z.string().email()
    .or(z.string().min(3).max(100)), // Email or name

  notes: z.string().max(1000).optional()
})
```

## Database Performance Impact

### Query Performance Analysis

**New Queries Introduced:**

1. **Revenue Calculation:**
   ```sql
   SELECT SUM(totalGrossCents) as revenue
   FROM Invoice
   WHERE therapistId = $1
     AND status IN ('SENT', 'PAID')
     AND createdAt >= $2
     AND createdAt < $3;

   -- Performance:
   -- - Uses existing index: idx_invoice_therapist_created
   -- - Expected execution time: <50ms for 1000 invoices
   -- - Cached in Therapist table (24hr TTL)
   ```

2. **Therapist Settings Fetch:**
   ```sql
   SELECT
     invoiceLogoUrl,
     invoiceDisplayPreference,
     invoiceThankYouMessage,
     taxValidationStatus,
     taxValidatedAt,
     taxValidatedBy
   FROM Therapist
   WHERE id = $1;

   -- Performance:
   -- - Primary key lookup (instant)
   -- - No joins required
   -- - Expected execution time: <5ms
   ```

3. **Compliance Checklist:**
   ```sql
   SELECT
     t.taxValidationStatus,
     t.taxValidatedAt,
     t.invoiceLogoUrl,
     t.invoiceThankYouMessage,
     t.annualGrossCachedAt,
     COUNT(s.id) as service_count
   FROM Therapist t
   LEFT JOIN Service s ON s.therapistId = t.id
   WHERE t.id = $1
   GROUP BY t.id;

   -- Performance:
   -- - Join with Service table (lightweight)
   -- - Expected execution time: <20ms
   ```

**Storage Impact:**
- New columns per therapist: ~500 bytes average
- 10,000 therapists: ~5MB additional storage
- Logo URLs: No BLOB storage in DB (external URLs only)
- Negligible impact on database size

**Cache Strategy:**
- Revenue calculation cached in `annualGrossCents` (24hr TTL)
- Reduces database load by 95%+ for revenue threshold widget
- Cache invalidation on invoice create/update

## Testing Data

### Seed Data for Development

```typescript
// packages/db/seed.ts additions

const testTherapists = [
  {
    // Therapist with full branding
    invoiceLogoUrl: 'https://via.placeholder.com/800x200/3b82f6/ffffff?text=Practice+Logo',
    invoiceDisplayPreference: 'BOTH',
    invoiceThankYouMessage: 'Vielen Dank für Ihr Vertrauen! Wir freuen uns auf Ihren nächsten Besuch.',
    taxValidationStatus: true,
    taxValidatedAt: new Date('2025-09-15'),
    taxValidatedBy: 'Tax Advisor Name <advisor@example.com>'
  },
  {
    // Therapist with logo only
    invoiceLogoUrl: 'https://via.placeholder.com/800x200/10b981/ffffff?text=Logo+Only',
    invoiceDisplayPreference: 'LOGO',
    taxValidationStatus: false
  },
  {
    // Therapist with defaults (legacy behavior)
    invoiceDisplayPreference: 'NAME',
    taxValidationStatus: false
  }
]
```

### Test Scenarios

**Scenario 1: New Therapist Signup**
```sql
INSERT INTO "Therapist" (id, userId, slug, designation, vatStatus, kleinunternehmer)
VALUES (gen_random_uuid(), $userId, $slug, 'HEILMASSEUR', 'KLEINUNTERNEHMER', true);

-- Expected defaults:
-- invoiceDisplayPreference: 'NAME'
-- taxValidationStatus: false
-- All other new fields: null
```

**Scenario 2: Logo Upload**
```sql
UPDATE "Therapist"
SET invoice_logo_url = $logoUrl,
    invoice_display_preference = 'LOGO'
WHERE id = $therapistId;
```

**Scenario 3: Tax Validation**
```sql
UPDATE "Therapist"
SET tax_validation_status = true,
    tax_validated_at = NOW(),
    tax_validated_by = $validatorEmail
WHERE id = $therapistId;
```

**Scenario 4: Revenue Calculation Cache**
```sql
UPDATE "Therapist"
SET annual_gross_cents = $calculatedRevenue,
    annual_gross_cached_at = NOW()
WHERE id = $therapistId;
```

## Schema Compatibility

### Backwards Compatibility
- ✅ All new fields have defaults or are nullable
- ✅ Existing queries unchanged
- ✅ PDF generation works with or without new fields
- ✅ No breaking changes to API contracts

### Forward Compatibility
- ✅ Schema supports future enhancements:
  - Multiple logos (add `invoiceLogoUrlSecondary`)
  - Custom colors (add `invoiceBrandColor`)
  - Per-invoice customization (add `Invoice.customLogoUrl`)
  - Multi-language messages (use JSON column)

### Database Constraints

**Constraints Added:**
```sql
-- Enum constraint
ALTER TABLE "Therapist"
  ADD CONSTRAINT check_invoice_display_preference
  CHECK (invoice_display_preference IN ('LOGO', 'NAME', 'BOTH'));

-- Logical constraint (validated at application layer)
-- If taxValidationStatus = true, then taxValidatedAt SHOULD be set
-- (Not enforced at DB level to allow flexibility)
```

**No Foreign Key Constraints:**
- `taxValidatedBy` is free text (could be email or name)
- `invoiceLogoUrl` is external URL (not FK to File table)
- Flexibility for different validation workflows

## Monitoring & Maintenance

### Database Metrics to Monitor

1. **Revenue Calculation Cache Hit Rate:**
   ```sql
   SELECT
     COUNT(CASE WHEN annual_gross_cached_at > NOW() - INTERVAL '24 hours' THEN 1 END)::float /
     COUNT(*)::float * 100 as cache_hit_rate_percent
   FROM "Therapist"
   WHERE annual_gross_cached_at IS NOT NULL;
   ```

2. **Logo Upload Adoption:**
   ```sql
   SELECT
     COUNT(CASE WHEN invoice_logo_url IS NOT NULL THEN 1 END)::float /
     COUNT(*)::float * 100 as adoption_rate_percent
   FROM "Therapist";
   ```

3. **Tax Validation Status:**
   ```sql
   SELECT
     tax_validation_status,
     COUNT(*) as therapist_count
   FROM "Therapist"
   GROUP BY tax_validation_status;
   ```

### Maintenance Tasks

**Weekly:**
- Review revenue cache freshness
- Monitor logo URL accessibility (404 checks)

**Monthly:**
- Analyze thank you message usage
- Review tax validation completion rate

**Quarterly:**
- Audit taxValidatedBy entries for consistency
- Clean up orphaned logo URLs (if storage-linked)
