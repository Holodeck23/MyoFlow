# Spec Requirements Document

> Spec: Invoice Safety & Customization
> Created: 2025-10-05
> Status: Planning

## Overview

MyoFlow's invoice system currently generates tax-compliant PDFs with Austrian regulatory compliance (Kleinunternehmer support, VAT breakdowns, SEPA QR codes). However, before professional tax validation, the system needs enhanced safety measures, customization options, and transparency features to help therapists understand what's validated versus what requires professional review.

This spec introduces six interconnected safety and customization features:

1. **Invoice Branding Settings** - Allow therapists to upload logos, customize display preferences, and add personalized messages to invoices
2. **Smart VAT Rate Warnings** - Contextual warnings when therapists select non-standard VAT rates for therapy services
3. **Revenue Threshold Monitoring** - Automatic tracking of annual revenue against the €55,000 Kleinunternehmer threshold
4. **Compliance Dashboard** - Visual checklist showing what's professionally validated versus pending review
5. **Enhanced Invoice Validation** - Pre-generation checks with draft watermarks and readiness scoring
6. **Disclaimers & Transparency** - Clear legal notices tracking professional validation status

**Problem Statement:**
- Therapists may unknowingly generate non-compliant invoices without professional tax review
- No visual customization options for invoice branding (logo, colors, messages)
- System doesn't warn when therapists select inappropriate VAT rates for therapy services
- No automatic tracking of revenue approaching Kleinunternehmer threshold (€55k)
- Lack of transparency about what's been professionally validated
- Invoices appear fully validated even when they haven't been reviewed by tax professionals

## User Stories

**As a therapist**, I want to:
- Upload my practice logo and have it appear on invoices
- Customize invoice appearance (logo vs. name display, thank you messages)
- See warnings when selecting non-standard VAT rates for therapy services
- Monitor my annual revenue progress toward the €55k Kleinunternehmer threshold
- Know which invoice features have been professionally validated by a tax advisor
- See clear disclaimers on invoices generated before professional validation
- Understand my compliance status at a glance via dashboard widgets

**As a tax advisor**, I want to:
- Review and validate invoice settings before therapist uses them in production
- Mark specific features as "validated" after professional review
- See audit trails of when validation occurred and by whom

**As MyoFlow (platform)**, we want to:
- Reduce risk of therapists generating non-compliant invoices
- Provide transparency about validation status
- Educate therapists about tax compliance through contextual warnings
- Maintain professional standards while offering customization

## Spec Scope

### 1. Invoice Branding Settings (Settings Page)

**UI Components:**
- New "Invoice Branding" section in Settings page
- Logo upload widget (max 2MB, PNG/JPG/SVG)
- Display preference selector:
  - `LOGO` - Show logo only
  - `NAME` - Show business name only (current default)
  - `BOTH` - Show logo + business name
- Brand color picker (optional, for future use in invoice headers)
- Custom thank you message field (max 500 characters)
- Preview panel showing live invoice header mockup

**Database Schema:**
```prisma
model Therapist {
  // ... existing fields
  invoiceLogoUrl          String?
  invoiceDisplayPreference InvoiceDisplayPreference @default(NAME)
  invoiceThankYouMessage  String?
  taxValidationStatus     Boolean @default(false)
  taxValidatedAt          DateTime?
  taxValidatedBy          String? // Reference to validating user/advisor
}

enum InvoiceDisplayPreference {
  LOGO
  NAME
  BOTH
}
```

**API Endpoints:**
```
PUT /api/settings/invoice-branding
- Update logo, display preference, thank you message
- Validates image dimensions (max 800x200px) and file size
- Returns updated therapist settings

POST /api/upload/invoice-logo
- Handles logo upload to storage (AWS S3/Vercel Blob)
- Returns secure URL for logo
```

**PDF Generation Changes:**
- Modify `packages/lib/src/pdf-generator.ts` to include logo image tag when `invoiceLogoUrl` exists
- Apply display preference logic in invoice header HTML
- Insert thank you message above payment terms section

### 2. Smart VAT Rate Warnings

**UI Components:**
- Service creation/edit form enhancement
- Inline warning banner when selecting non-standard VAT rates for therapy services
- Educational tooltip explaining standard rates for Austrian therapy practices

**Logic:**
```typescript
// Therapy services (MASSAGE category) typically use:
// - KLEINUNTERNEHMER (0%) - Most common for new therapists
// - UST_20 (20%) - Standard rate when VAT-registered

// Warning triggers:
if (service.category === 'MASSAGE' && service.vatRate === 'UST_10') {
  // Show warning: "10% reduced rate is unusual for massage therapy.
  // Standard rates are 0% (Kleinunternehmer) or 20% (VAT-registered).
  // Consult your tax advisor before using this rate."
}
```

**No API Changes Required** - Pure client-side validation warning

### 3. Revenue Threshold Monitoring

**Dashboard Widget:**
- Prominent card showing:
  - Current year revenue (€ amount)
  - Percentage of €55,000 threshold
  - Visual progress bar with color coding:
    - Green: 0-70% (€0-€38,500)
    - Yellow: 70-90% (€38,500-€49,500)
    - Red: 90%+ (€49,500+)
  - Warning message when approaching threshold
  - Link to tax compliance settings

**API Endpoint:**
```
GET /api/compliance/revenue-status
- Calculate sum of current year invoice totals (status: SENT or PAID)
- Return: { currentYearRevenue, thresholdPercentage, threshold, isApproaching }
- Cache results for 24 hours using therapist.annualGrossCents/annualGrossCachedAt
```

**Database Usage:**
```typescript
// Leverage existing Therapist fields:
// - annualGrossCents (cache current year revenue)
// - annualGrossCachedAt (timestamp of last calculation)

// Query:
const currentYear = new Date().getFullYear()
const invoices = await prisma.invoice.findMany({
  where: {
    therapistId: therapist.id,
    status: { in: ['SENT', 'PAID'] },
    createdAt: {
      gte: new Date(currentYear, 0, 1),
      lt: new Date(currentYear + 1, 0, 1)
    }
  }
})
const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalGrossCents, 0)
```

### 4. Compliance Dashboard

**New Settings Tab: "Tax Compliance"**

**Checklist Items:**
- ✅ Professional tax validation completed
- ✅ Invoice branding configured
- ✅ VAT rates reviewed for all services
- ✅ Revenue threshold monitoring enabled
- ✅ Tax advisor contact information provided
- ⚠️ Pending items marked with warning icons

**Visual Design:**
- Material Design cards with status indicators
- Green checkmarks for validated items
- Yellow warning icons for pending items
- Red alerts for critical missing information
- "Get Professional Help" CTA linking to tax advisor resources

**API Endpoint:**
```
GET /api/compliance/checklist
- Return compliance status object:
  {
    taxValidated: boolean
    taxValidatedAt: DateTime | null
    invoiceBrandingConfigured: boolean
    vatRatesReviewed: boolean
    revenueMonitoringActive: boolean
    taxAdvisorConfigured: boolean
    readinessScore: number (0-100)
  }
```

### 5. Enhanced Invoice Validation

**Pre-Generation Checks:**
```typescript
interface InvoiceValidation {
  canGenerate: boolean
  warnings: string[]
  errors: string[]
  readinessScore: number
}

// Check before PDF generation:
- Client address present for invoices >€400
- Valid IBAN if bank details configured
- Service has valid VAT rate
- Tax validation status
- Logo exists if display preference is LOGO or BOTH
```

**Draft Watermark:**
- Add diagonal "ENTWURF" (DRAFT) watermark to invoices with status=DRAFT
- Semi-transparent gray text across invoice body
- Watermark removed when invoice status changes to SENT

**PDF Generation Changes:**
```css
/* Add to invoice HTML when status === 'DRAFT' */
.watermark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-45deg);
  font-size: 120pt;
  color: rgba(0, 0, 0, 0.05);
  font-weight: bold;
  pointer-events: none;
  z-index: 1000;
}
```

### 6. Disclaimers & Transparency

**Invoice Footer Addition:**
When `therapist.taxValidationStatus === false`:

```html
<div class="validation-disclaimer">
  <strong>⚠️ Wichtiger Hinweis zur Steuerberatung:</strong><br>
  Diese Rechnung wurde mit MyoFlow erstellt und folgt den gesetzlichen Anforderungen nach bestem Wissen.
  Die steuerliche Korrektheit wurde noch nicht von einem Steuerberater geprüft.
  Bei Fragen zur steuerlichen Behandlung wenden Sie sich bitte an einen Steuerberater.

  <div style="margin-top: 5px; font-size: 8pt;">
    <strong>Tax Advisory Notice:</strong> This invoice was generated using MyoFlow software and follows
    legal requirements to the best of our knowledge. Tax correctness has not been validated by a
    professional tax advisor. Please consult a tax professional for tax-related questions.
  </div>
</div>
```

When `therapist.taxValidationStatus === true`:

```html
<div class="validation-badge">
  ✓ Steuerlich geprüft am ${formatDate(therapist.taxValidatedAt)}
  durch ${therapist.taxValidatedBy}
</div>
```

**Settings Page Indicator:**
- Prominent banner at top of settings showing validation status
- Green banner: "Your invoice settings were professionally validated on [date]"
- Yellow banner: "Your invoice settings haven't been validated by a tax professional yet"
- CTA: "Mark as Validated" button (requires confirmation + audit log entry)

## Out of Scope

**Not Included in This Spec:**
- Actual tax advisor integration (separate future spec)
- Automated tax filing/reporting
- RKSV (Registrierkassenpflicht) implementation - covered in separate spec @.agent-os/specs/2025-09-18-user-settings-design/
- Multi-currency support (future enhancement)
- Invoice template designer (drag-and-drop customization)
- Automated VAT rate detection via AI/ML
- Integration with BMD/RZL accounting systems (covered in ExportConfiguration model)
- Email delivery of invoices (future spec)
- Payment processing integration beyond SEPA QR codes

**Deferred to Future Specs:**
- Advanced logo positioning controls
- Custom invoice templates (multiple template support)
- Client-specific invoice customization
- Automated compliance alerts via email/SMS

## Expected Deliverable

### 1. Database Migration
- Add new fields to Therapist model:
  - `invoiceLogoUrl`
  - `invoiceDisplayPreference`
  - `invoiceThankYouMessage`
  - `taxValidationStatus`
  - `taxValidatedAt`
  - `taxValidatedBy`
- Create `InvoiceDisplayPreference` enum

### 2. API Routes
- `PUT /api/settings/invoice-branding` - Update branding settings
- `POST /api/upload/invoice-logo` - Handle logo uploads
- `GET /api/compliance/revenue-status` - Calculate current year revenue
- `GET /api/compliance/checklist` - Return compliance checklist
- `POST /api/compliance/mark-validated` - Admin/tax advisor validation action

### 3. UI Components
- Settings page: Invoice Branding section (settings-client.tsx)
- Settings page: Tax Compliance Dashboard tab
- Dashboard: Revenue Threshold Widget
- Service form: VAT rate warning component
- Invoice preview: Draft watermark overlay

### 4. PDF Generation Updates
- Logo rendering in invoice header
- Display preference logic (LOGO/NAME/BOTH)
- Thank you message insertion
- Draft watermark rendering
- Validation disclaimer footer

### 5. TypeScript Types
```typescript
// apps/web/types/compliance.ts
export interface RevenueStatus {
  currentYearRevenue: number
  thresholdPercentage: number
  threshold: number
  isApproaching: boolean
  year: number
}

export interface ComplianceChecklist {
  taxValidated: boolean
  taxValidatedAt: Date | null
  invoiceBrandingConfigured: boolean
  vatRatesReviewed: boolean
  revenueMonitoringActive: boolean
  taxAdvisorConfigured: boolean
  readinessScore: number
}

export interface InvoiceValidation {
  canGenerate: boolean
  warnings: string[]
  errors: string[]
  readinessScore: number
}
```

### 6. Tests
- Unit tests for revenue calculation logic
- Integration tests for branding API endpoints
- E2E tests for settings page interactions
- PDF generation tests with logo/watermark rendering
- Validation logic tests

### 7. Documentation
- User guide: Invoice customization walkthrough
- Tax compliance documentation
- API documentation for new endpoints
- Migration guide for existing therapists

## Success Criteria

**Functional Requirements:**
- ✅ Therapists can upload and display logos on invoices
- ✅ System warns when inappropriate VAT rates selected
- ✅ Revenue threshold tracking displays accurate current year totals
- ✅ Compliance dashboard shows validation status clearly
- ✅ Draft invoices display watermark
- ✅ Unvalidated invoices show disclaimer footer
- ✅ Logo upload supports PNG/JPG/SVG up to 2MB
- ✅ Thank you messages appear correctly on PDFs

**Quality Requirements:**
- All TypeScript checks pass (`pnpm typecheck`)
- Zero ESLint warnings (`pnpm lint`)
- Test coverage ≥80% for new features
- PDF generation time remains <2 seconds
- Logo images optimized (<500KB after processing)

**User Experience Requirements:**
- Settings page loads in <1 second
- Logo preview updates in real-time
- Revenue dashboard widget caches data (24hr TTL)
- Warning messages use clear, non-technical language
- Compliance checklist uses intuitive visual indicators

## Spec Documentation

- Tasks: @.agent-os/specs/2025-10-05-invoice-safety-customization/tasks.md
- Technical Specification: @.agent-os/specs/2025-10-05-invoice-safety-customization/sub-specs/technical-spec.md
- API Specification: @.agent-os/specs/2025-10-05-invoice-safety-customization/sub-specs/api-spec.md
- Database Schema: @.agent-os/specs/2025-10-05-invoice-safety-customization/sub-specs/database-schema.md
- Tests Specification: @.agent-os/specs/2025-10-05-invoice-safety-customization/sub-specs/tests.md
