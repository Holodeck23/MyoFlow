# Spec: CSV Accounting Exports

**Created:** October 16, 2025
**Status:** Draft
**Priority:** Medium
**Estimated Effort:** 2-3 days
**Assignee:** Codex

---

## Executive Summary

Enable Austrian therapists to export their invoice and payment data to their tax advisor's accounting software (BMD, RZL, DATEV) with a single click. The CSV export library is already implemented (`packages/lib/src/csv-export.ts`) and the database foundation exists (`ExportConfiguration` model). This spec covers the **remaining 40%**: API endpoints, settings UI, and scheduled/manual export workflows.

**Value Proposition:**
- **Tax Compliance:** Seamless integration with Austrian tax advisors' workflows
- **Time Savings:** Eliminate manual data entry for end-of-month accounting
- **Professional Credibility:** Support industry-standard formats (BMD, RZL, DATEV)
- **Revenue Enablement:** Critical feature for converting TEST → PRODUCTION accounts

---

## Problem Statement

### Current State
1. ✅ **CSV generation logic** exists with 3 Austrian accounting formats
2. ✅ **ExportConfiguration model** in database for storing export preferences
3. ❌ **No API endpoints** to generate/download exports
4. ❌ **No UI** in settings for configuring export preferences
5. ❌ **No scheduled exports** or automated delivery

### User Pain Points

**For Therapists:**
- "I spend 3 hours every month manually entering invoices into my tax advisor's software"
- "My tax advisor wants a specific CSV format (BMD) but I don't know how to generate it"
- "I forgot to export last month's data and now I'm scrambling before the deadline"

**For Tax Advisors (Secondary Users):**
- "Therapists send me inconsistent data formats that don't import cleanly"
- "I waste time cleaning up CSV files with missing fields or wrong date formats"
- "I need the data broken down by VAT rate for accurate tax filing"

---

## User Stories

### Story 1: Tax Advisor Onboarding
**As a** newly registered therapist
**I want to** configure my accounting export settings during onboarding
**So that** I can easily share data with my tax advisor from day one

**Acceptance Criteria:**
- [ ] Settings page includes "Accounting Exports" section
- [ ] Can select target system (BMD/RZL/DATEV/CSV Generic)
- [ ] Can configure export frequency (manual, monthly, quarterly)
- [ ] Can set date range (e.g., "Current month", "Previous month", "Custom range")
- [ ] Can preview export before downloading
- [ ] Configuration is saved in `ExportConfiguration` table

---

### Story 2: Monthly Export Workflow
**As a** practicing therapist
**I want to** generate a CSV export of last month's invoices with one click
**So that** I can send it to my tax advisor before the 15th deadline

**Acceptance Criteria:**
- [ ] Dashboard shows "Export for Tax Advisor" widget
- [ ] Widget displays last export date and next scheduled export
- [ ] "Generate Export" button triggers API call
- [ ] Download starts immediately with correct filename format
- [ ] Export includes all SENT and PAID invoices from date range
- [ ] DRAFT invoices are excluded (validation enforced)
- [ ] Export tracks `lastRunAt` timestamp in database

---

### Story 3: VAT Breakdown for Tax Filing
**As a** VAT-registered therapist (not Kleinunternehmer)
**I want my** CSV export to include VAT breakdown by rate (10%, 13%, 20%)
**So that** my tax advisor can accurately file my UVA (Umsatzsteuervoranmeldung)

**Acceptance Criteria:**
- [ ] Export includes separate columns for net amount, VAT rate, and VAT amount
- [ ] DATEV format uses correct account codes (8300 for standard revenue, 1776 for VAT)
- [ ] Kleinunternehmer invoices use account 8400 (no VAT)
- [ ] Multi-line invoices are aggregated correctly by VAT rate
- [ ] Export validates that VAT breakdown matches total gross amount

---

### Story 4: Custom Configuration for Multi-System Support
**As a** therapist working with multiple tax advisors (e.g., personal + business)
**I want to** save multiple export configurations
**So that** I can generate different formats without re-configuring each time

**Acceptance Criteria:**
- [ ] Can create multiple named export configurations
- [ ] Each configuration stores: name, target system, date range, filters
- [ ] Settings UI shows list of saved configurations
- [ ] Can set one configuration as "default"
- [ ] Can edit, duplicate, or delete configurations
- [ ] Export history shows which configuration was used

---

### Story 5: Scheduled Exports (Future: Post-MVP)
**As a** therapist with a regular monthly workflow
**I want** exports to be generated automatically on the 1st of each month
**So that** I never miss the tax advisor deadline

**Acceptance Criteria (Deferred to Phase 2):**
- [ ] Can enable scheduled exports with cron expression
- [ ] System sends email with CSV attachment on schedule
- [ ] Email notification includes export summary (invoice count, total revenue)
- [ ] Failed exports trigger alert notification
- [ ] Can configure recipient email (therapist or tax advisor)

---

## Scope

### In Scope (This Spec)
1. **API Endpoints:**
   - `POST /api/exports/accounting/generate` - Generate and download CSV
   - `GET /api/exports/accounting/history` - List past exports
   - `POST /api/exports/accounting/preview` - Preview export data without downloading

2. **Settings UI:**
   - New "Accounting Exports" tab in Settings
   - Export configuration form (target system, date range, filters)
   - Export history table with download links
   - "Generate Export" action button

3. **Export Enhancements:**
   - Add payment status to export (PENDING/SETTLED/FAILED)
   - Include payment date and method (STRIPE/MANUAL)
   - Add therapist metadata (VAT number, IBAN) to export headers

4. **Validation & Error Handling:**
   - Validate invoices before export (no DRAFT invoices)
   - Check for missing required fields (client name, invoice number)
   - Handle edge cases (zero invoices in date range)
   - Proper error messages for malformed configurations

### Out of Scope (Future Phases)
- Automated scheduled exports (cron jobs)
- Email delivery of exports
- XML export formats (e.g., UBL for e-Rechnung)
- Integration with accounting software APIs (beyond CSV)
- Multi-currency support (only EUR for now)
- Historical data migration/import

---

## Technical Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                      Settings UI Layer                       │
│  - AccountingExportsTab.tsx                                  │
│  - ExportConfigurationForm.tsx                               │
│  - ExportHistoryTable.tsx                                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ fetch() API calls
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                      API Routes Layer                        │
│  - /api/exports/accounting/generate/route.ts                │
│  - /api/exports/accounting/history/route.ts                 │
│  - /api/exports/accounting/preview/route.ts                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Imports CSV export functions
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                   CSV Export Library                         │
│  - @myoflow/lib/csv-export (already exists)                 │
│    - exportToBMD()                                           │
│    - exportToRZL()                                           │
│    - exportToDATEV()                                         │
│    - validateInvoiceForExport()                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Queries invoice + payment data
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                      Database Layer                          │
│  - Invoice (existing)                                        │
│  - Payment (existing)                                        │
│  - ExportConfiguration (existing)                            │
│  - ExportLog (NEW - tracks export history)                  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**Manual Export Workflow:**
1. User selects date range and target system in Settings UI
2. Frontend calls `POST /api/exports/accounting/preview` to validate
3. API queries invoices within date range with payment status
4. CSV export library generates formatted CSV string
5. Preview modal shows first 10 rows + validation warnings
6. User clicks "Download Export"
7. Frontend calls `POST /api/exports/accounting/generate`
8. API logs export in `ExportLog` table
9. Response includes CSV as attachment with Content-Disposition header
10. Browser triggers file download with correct filename

---

## Database Schema Extensions

### New Model: ExportLog

```prisma
model ExportLog {
  id              String   @id @default(cuid())
  therapistId     String
  configurationId String?  // Reference to ExportConfiguration if used
  exportType      ExportType
  targetSystem    ExportTargetSystem
  dateRangeStart  DateTime
  dateRangeEnd    DateTime
  invoiceCount    Int
  totalRevenueCents Int
  exportedAt      DateTime @default(now())
  fileSize        Int      // in bytes
  fileName        String
  downloadCount   Int      @default(0)
  lastDownloadAt  DateTime?

  Therapist       Therapist @relation(fields: [therapistId], references: [id], onDelete: Cascade)
  Configuration   ExportConfiguration? @relation(fields: [configurationId], references: [id], onDelete: SetNull)

  @@index([therapistId, exportedAt])
  @@index([exportedAt])
}
```

**Why This Model?**
- Track export history for audit trail
- Enable "Download again" functionality without regenerating
- Support analytics (most popular export formats, export frequency)
- Future: Integrate with scheduled export jobs

### Updated Model: ExportConfiguration

```prisma
// Add relation to ExportLog
model ExportConfiguration {
  // ... existing fields ...
  ExportLogs ExportLog[]  // ← NEW
}

// Add relation to Therapist
model Therapist {
  // ... existing fields ...
  ExportLogs ExportLog[]  // ← NEW
}
```

---

## API Specifications

See `sub-specs/api-spec.md` for detailed endpoint documentation.

---

## UI/UX Design

### Settings > Accounting Exports Tab

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ Accounting Exports                                      │
│ Export your invoices to your tax advisor's software    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ [Configuration Section]                                 │
│   Target System:  [ BMD ▼ ]                            │
│   Date Range:     [ Previous Month ▼ ]                 │
│   Status Filter:  ☑ SENT  ☑ PAID  ☐ DRAFT             │
│                                                         │
│   [ Preview Export ]  [ Generate & Download ]          │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ [Export History Table]                                  │
│   Date       | Format | Invoices | Revenue | Download  │
│   ---------- | ------ | -------- | ------- | --------  │
│   Oct 1 2025 | BMD    | 23       | €2,450  | ⬇         │
│   Sep 1 2025 | BMD    | 19       | €2,100  | ⬇         │
│   Aug 1 2025 | DATEV  | 21       | €2,300  | ⬇         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Interaction Details:**
- "Preview Export" button opens modal showing first 10 CSV rows
- Validation warnings displayed above preview (e.g., "3 draft invoices excluded")
- "Generate & Download" triggers file download with Austrian date format filename
- Export history table shows last 10 exports, sorted by date descending
- Download icon (⬇) re-downloads previous export without regeneration

---

## Austrian Compliance Requirements

### Overview of Austrian Accounting Standards

Based on research of Austrian tax advisor (Steuerberater) requirements in 2025:

**Monthly VAT Returns (UVA):** Due on the 15th of the second month following the reporting period
**Export Frequency:** Monthly recommended for consistent tax advisor workflows
**Official Audit Format:** SAF-T Austria (XML) - not required for monthly exchanges, only on-demand audits
**Practical Formats:** BMD, RZL (DATEV-compatible), DATEV CSV for regular monthly data exchange

---

### BMD Format (Market Leader in Austria)

**About BMD:** Austria's leading accounting software used by most Steuerberater firms.

**Technical Specifications:**
- **Separator:** Semicolon (`;`)
- **Encoding:** UTF-8 with BOM (or ASCII/ANSI for compatibility)
- **Date Format:** `dd.MM.yyyy` (German format)
- **Decimal Separator:** Comma (`,`) for amounts
- **Quote Handling:** Double-quotes for text fields with special characters

**Required Fields (CSV Header Names):**
- `satzart` - Record type (e.g., "RG" for invoice)
- `gkonto` - General ledger account (revenue account)
- `steuercode` - Tax code (AT/EU/DIV differentiation)
- `buchcode` - Posting code
- `rechnungsnummer` - Invoice number
- `rechnungsdatum` - Invoice date (dd.MM.yyyy format)
- `kunde` - Client name
- `kundenadresse` - Client address
- `bruttobetrag` - Gross amount (with comma as decimal)
- `status` - Invoice status
- `kleinunternehmer` - Kleinunternehmer flag ("Ja"/"Nein")

**BMD Integration Notes:**
- Offers DATEV interface (optional purchase) for standardized imports
- Supports custom CSV mapping via configuration
- Standard Kontorahmen 03 and 04 commonly used for account codes

---

### RZL Format (Popular with Small Practices)

**About RZL:** 40-year-old Austrian accounting software for Steuerberater, designed for tax advisors and payroll processors.

**Technical Specifications:**
- **Separator:** Semicolon (`;`)
- **Encoding:** ASCII/ANSI format (German character set)
- **Column Names:** Abbreviated format:
  - `RE_NR` - Invoice number
  - `RE_DATUM` - Invoice date (dd.MM.yyyy)
  - `KUNDE` - Client name
  - `ADRESSE` - Client address
  - `BRUTTO_EUR` - Gross amount in euros
  - `STATUS` - Invoice status
  - `KU_STATUS` - Kleinunternehmer status (1 = yes, 0 = no)
- **Quote Handling:** Double-quote escaping (`""` for literal quotes)

**RZL Integration Notes:**
- Supports DATEV format imports natively
- Data export per §§ 131 and 132 BAO (Austrian tax code)
- May require Excel preprocessing for monthly standardization
- Interface supports external CSV via RZL data interface

---

### DATEV Format (German/Austrian Standard)

**About DATEV:** German accounting software standard widely adopted by Austrian Steuerberater for monthly data exchange.

**Technical Specifications:**
- **Separator:** Semicolon (`;`)
- **Encoding:** UTF-8 or ANSI (German character set)
- **Date Format:** `ddMMyyyy` (no separators, e.g., "01102025")
- **Decimal Separator:** Comma (`,`) for amounts
- **Strictest Validation:** Exact column order and data types enforced

**Required CSV Columns (in order):**
1. `Umsatz (ohne Soll/Haben-Kz)` - Transaction amount
2. `Soll/Haben-Kennzeichen` - Debit/Credit indicator (S/H)
3. `WKZ Umsatz` - Currency code (EUR)
4. `Kurs` - Exchange rate (empty for EUR)
5. `Basis-Umsatz` - Base amount
6. `WKZ Basis-Umsatz` - Base currency
7. `Konto` - Account number (revenue account)
8. `Gegenkonto (ohne BU-Schlüssel)` - Contra account
9. `BU-Schlüssel` - Posting key (VAT code)
10. `Belegdatum` - Document date (ddMMyyyy)
11. `Belegfeld 1` - Document field 1 (invoice number)
12. `Belegfeld 2` - Document field 2 (client name)
13. `Skonto` - Discount (usually empty)
14. `Buchungstext` - Posting text (description)

**Account Mapping (SKR03/SKR04 Standard):**
- `8300` - Operating revenue (with VAT)
- `8400` - Operating revenue, Kleinunternehmer (no VAT)
- `1776` - VAT liability account (for VAT-registered)

**BU-Schlüssel (Tax Codes):**
- `19` - 20% VAT (Austrian standard rate)
- `10` - 10% VAT (reduced rate, e.g., accommodation)
- `07` - 13% VAT (special rate)
- Empty - Kleinunternehmer (no VAT)

**DATEV Integration Notes:**
- Requires consultant number and client number (configurable)
- Standard Kontorahmen 03 and 04 most common in Austria
- Validation programs available after free registration
- Fixed time periods (full months) recommended for consistency

---

### SAF-T Austria (Official Audit Format)

**About SAF-T:** Standard Audit File for Tax - OECD-developed XML format mandated by Austrian Ministry of Finance (BMF).

**When Required:**
- Not required for regular monthly exchanges
- Only on-demand during tax authority audits
- Taxpayers must be prepared to generate on request

**Technical Specifications:**
- **Format:** XML (not CSV)
- **Schema:** Specified by XSD schema file from BMF
- **Content:** General ledger, inventories, AR, AP, assets
- **Introduced:** March 2009 in Austria

**Scope for This Spec:**
- **Out of scope** for Phase 1 (CSV focus for monthly tax advisor exchange)
- **Future enhancement** for Phase 3 when audit compliance features are added

---

### CSV Generic Format (Fallback Option)

**About Generic CSV:** Simple comma-separated format for tax advisors using custom/legacy systems.

**Technical Specifications:**
- **Separator:** Comma (`,`) or semicolon (`;`) - user configurable
- **Encoding:** UTF-8 with BOM
- **Date Format:** Configurable (dd.MM.yyyy or ISO 8601)
- **Headers:** English or German field names

**Fields:**
- Invoice Number, Invoice Date, Client Name, Client Address
- Gross Amount, Net Amount, VAT Amount, VAT Rate
- Kleinunternehmer Flag, Payment Status, Payment Date

**Use Cases:**
- Tax advisors with custom Excel workflows
- Small practices without BMD/RZL/DATEV
- Backup format for testing/validation

---

## Implementation Plan

### Phase 1: CSV Library Updates (Day 1 Morning)

**Update existing `packages/lib/src/csv-export.ts` with research findings:**

1. **BMD Format Enhancement:**
   - Add missing required fields: `satzart`, `gkonto`, `steuercode`, `buchcode`
   - Change header names to German (rechnungsnummer → Rechnungsnummer)
   - Add UTF-8 BOM to encoding
   - Implement quote handling for special characters

2. **DATEV Format Corrections:**
   - Update BU-Schlüssel codes: 07 (13% VAT), 10 (10% VAT), 19 (20% VAT)
   - Add all 14 required columns in exact order
   - Ensure ddMMyyyy date format (no separators)
   - Add consultant/client number support in options

3. **New CSV Generic Export:**
   - Create `exportToGenericCSV()` function
   - Support configurable separator (comma or semicolon)
   - Support configurable date format
   - Include net/VAT breakdown columns

4. **Enhanced Validation:**
   - Update `validateInvoiceForExport()` with Austrian-specific checks
   - Validate client name is not empty
   - Validate VAT calculations match totals
   - Check IBAN format if included
   - Warn for missing payment information

---

### Phase 2: API Layer (Day 1 Afternoon)

1. Create `apps/web/app/api/exports/accounting/generate/route.ts`
2. Create `apps/web/app/api/exports/accounting/history/route.ts`
3. Create `apps/web/app/api/exports/accounting/preview/route.ts`
4. Implement authorization (requireTherapist)
5. Query invoices with payment status
6. Call updated CSV export functions
7. Return CSV as download response with Content-Disposition header
8. Log export in ExportLog table

### Phase 2: Database Migration (Day 1)
1. Create `ExportLog` model in Prisma schema
2. Add relations to `ExportConfiguration` and `Therapist`
3. Generate migration: `npx prisma migrate dev --name add-export-log`
4. Update Prisma client

### Phase 3: Settings UI (Day 2)
1. Create `apps/web/app/dashboard/settings/components/AccountingExportsTab.tsx`
2. Create `ExportConfigurationForm.tsx` component
3. Create `ExportHistoryTable.tsx` component
4. Add "Accounting Exports" tab to settings navigation
5. Wire up form submission to API endpoints
6. Implement preview modal with validation warnings

### Phase 4: Testing & Polish (Day 2-3)
1. Unit tests for API endpoints
2. Integration tests for CSV generation
3. Test all 3 accounting formats (BMD, RZL, DATEV)
4. Edge case testing (no invoices, DRAFT-only, VAT edge cases)
5. Manual QA with real invoice data
6. Documentation updates

---

## Testing Strategy

### Unit Tests
- `apps/web/app/api/exports/accounting/generate/route.test.ts`
  - Test CSV generation for each format
  - Test date range filtering
  - Test status filtering (exclude DRAFT)
  - Test validation errors

- `packages/lib/src/csv-export.test.ts` (already exists?)
  - Test BMD format compliance
  - Test RZL format compliance
  - Test DATEV account code mapping
  - Test Kleinunternehmer vs VAT handling

### Integration Tests
- Test full export workflow (API → CSV → download)
- Test export log creation
- Test re-download from history
- Test preview functionality

### Manual QA Checklist
- [ ] Generate BMD export with 20 invoices
- [ ] Verify German date format (dd.MM.yyyy)
- [ ] Verify amounts use comma as decimal separator
- [ ] Import CSV into BMD (or verify with screenshot)
- [ ] Generate DATEV export with mixed VAT rates
- [ ] Verify account codes (8300, 8400, 1776)
- [ ] Test with Kleinunternehmer-only invoices
- [ ] Test with empty date range (no invoices)
- [ ] Test preview modal shows validation warnings
- [ ] Test export history table shows correct data
- [ ] Test re-download from history works

---

## Success Metrics

### Quantitative
- **Adoption Rate:** 80% of PRODUCTION accounts configure accounting exports within 30 days
- **Export Frequency:** Average 1.2 exports per therapist per month
- **Format Distribution:** BMD 60%, RZL 25%, DATEV 15%
- **Error Rate:** <2% of exports require support intervention

### Qualitative
- **User Feedback:** "This saves me 3 hours every month"
- **Tax Advisor Feedback:** "CSV imports cleanly into our system"
- **Support Tickets:** Zero complaints about incorrect VAT calculations

---

## Risks & Mitigations

### Risk 1: Incorrect VAT Calculations
**Impact:** High - Could cause tax filing errors
**Probability:** Low - VAT logic already tested in invoice generation
**Mitigation:**
- Reuse existing VAT calculation logic from invoice PDF generation
- Add validation step to compare export totals with database totals
- Manual QA with real Austrian therapist data

### Risk 2: Accounting Software Rejection
**Impact:** Medium - Export won't import into BMD/RZL/DATEV
**Probability:** Low - CSV library already implements correct formats
**Mitigation:**
- Test CSV files with trial versions of BMD, RZL, DATEV
- Partner with 1-2 Austrian tax advisors for validation
- Provide export validation tool (checksum, format verification)

### Risk 3: Date Range Edge Cases
**Impact:** Low - Incorrect invoices included/excluded
**Probability:** Medium - Timezone issues, month boundaries
**Mitigation:**
- Use Austrian timezone (Europe/Vienna) for all date calculations
- Display clear date range in export filename
- Add preview step showing which invoices will be included

---

## Dependencies

### Technical
- ✅ `@myoflow/lib/csv-export` library (already exists)
- ✅ `ExportConfiguration` database model (already exists)
- ❌ `ExportLog` database model (new)
- ❌ API endpoints (new)
- ❌ Settings UI components (new)

### External Services
- None (purely local CSV generation)

### Coordination
- **Codex:** API implementation and database migration
- **Gemini:** Settings UI components
- **Jules:** Test coverage and QA
- **Claude:** Final review and documentation

---

## Future Enhancements (Post-MVP)

### Phase 2: Scheduled Exports
- Cron job support via `scheduleCron` field in `ExportConfiguration`
- Email delivery with CSV attachment
- Notification system for failed exports

### Phase 3: Advanced Features
- XML export formats (UBL, FinanzOnline XML)
- Direct API integration with BMD/RZL (if they offer APIs)
- Custom field mapping for bespoke accounting systems
- Multi-year exports for annual tax returns

### Phase 4: Analytics Integration
- Export data to data warehouse for BI
- Revenue forecasting based on export trends
- Tax optimization recommendations

---

## Open Questions

1. **Email Delivery:** Should we enable email delivery in Phase 1 or defer to Phase 2?
   - **Decision:** Defer to Phase 2 (manual download is MVP-sufficient)

2. **Storage:** Should we store generated CSV files for re-download, or regenerate on demand?
   - **Decision:** Store filename reference in `ExportLog`, regenerate on re-download (avoids storage costs)

3. **Payment Integration:** Should exports include payment details (date, method)?
   - **Decision:** Yes - tax advisors need this for cash vs accrual accounting

4. **Multi-Configuration:** Allow saving multiple configurations or just one "default"?
   - **Decision:** Support multiple configurations (common for therapists with multiple businesses)

---

## Documentation Requirements

1. **User Guide:** "How to Export Invoices to Your Tax Advisor"
2. **Tax Advisor Guide:** "Importing MyoFlow Exports into BMD/RZL/DATEV"
3. **API Documentation:** OpenAPI/Swagger specs for export endpoints
4. **Troubleshooting Guide:** Common export errors and resolutions

---

## Acceptance Criteria

**This feature is complete when:**

- [ ] All API endpoints implemented and tested
- [ ] `ExportLog` database model created and migrated
- [ ] Settings UI tab fully functional with form and history
- [ ] All 3 accounting formats (BMD, RZL, DATEV) generate correctly
- [ ] Validation prevents DRAFT invoices from being exported
- [ ] Export history shows last 10 exports with download links
- [ ] Preview modal displays first 10 rows with warnings
- [ ] Manual QA completed with real invoice data
- [ ] Unit and integration tests passing
- [ ] Documentation updated
- [ ] Quality gates pass (typecheck, lint, build)

---

## References

- **Existing CSV Library:** `packages/lib/src/csv-export.ts`
- **Database Model:** `packages/db/schema.prisma` (ExportConfiguration)
- **External Integrations Plan:** `.agent-os/specs/external-integrations-plan.md`
- **Product Roadmap:** `.agent-os/product/roadmap.md` (Phase 2 item)
- **Austrian Tax Compliance:** `.agent-os/specs/2025-09-07-invoice-pdf-austrian-compliance/spec.md`

---

**Last Updated:** October 16, 2025
**Next Review:** After Phase 1 API implementation
