# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-10-16-csv-accounting-exports/spec.md

> Created: 2025-10-16
> Status: Ready for Implementation

## Tasks

### 1. Update CSV Export Library with Austrian Compliance

- [x] 1.1 Write tests for BMD format enhancements (satzart, gkonto, steuercode, buchcode fields)
- [x] 1.2 Add 4 required BMD fields and capitalize German headers
- [x] 1.3 Implement proper CSV escaping for special characters (ä, ö, ü, ß)
- [x] 1.4 Add UTF-8 BOM support for Excel compatibility
- [x] 1.5 Write tests for DATEV format corrections (BU-Schlüssel codes 07/10/19)
- [x] 1.6 Update DATEV export with all 14 columns in exact order
- [x] 1.7 Fix DATEV date format to ddMMyyyy (no separators)
- [x] 1.8 Write tests for new Generic CSV export function
- [x] 1.9 Create exportToGenericCSV() with configurable separator and date format
- [x] 1.10 Enhance validateInvoiceForExport() with Austrian-specific checks
- [x] 1.11 Add VAT calculation validation (gross vs breakdown mismatch detection)
- [x] 1.12 Verify all CSV library tests pass

### 2. Create ExportLog Database Model

- [x] 2.1 Add ExportLog model to packages/db/schema.prisma with all fields
- [x] 2.2 Add ExportLogs relation to Therapist model
- [x] 2.3 Add ExportLogs relation to ExportConfiguration model
- [x] 2.4 Generate migration: npx prisma migrate dev --name add-export-log --create-only
- [x] 2.5 Review generated SQL migration file
- [x] 2.6 Apply migration: npx prisma db push
- [x] 2.7 Update Prisma client: npx prisma generate
- [x] 2.8 Verify ExportLog table exists in database

### 3. Implement Export API Endpoints

- [x] 3.1 Write tests for POST /api/exports/accounting/generate endpoint
- [x] 3.2 Create generate route with requireTherapist auth
- [x] 3.3 Implement invoice query logic (exclude DRAFT, filter by date/status)
- [x] 3.4 Integrate CSV export functions (BMD/RZL/DATEV/CSV_GENERIC)
- [x] 3.5 Create ExportLog entry after successful generation
- [x] 3.6 Return CSV with Content-Disposition header and UTF-8 BOM
- [x] 3.7 Write tests for POST /api/exports/accounting/preview endpoint
- [x] 3.8 Create preview route with validation warnings and first 10 rows
- [x] 3.9 Write tests for GET /api/exports/accounting/history endpoint
- [x] 3.10 Create history route with pagination (last 10 exports)
- [x] 3.11 Write tests for GET /api/exports/accounting/download/:exportId
- [x] 3.12 Create download route with regeneration logic and downloadCount increment
- [x] 3.13 Verify all API tests pass

### 4. Build Settings UI Components

- [x] 4.1 Write tests for AccountingExportsTab component
- [x] 4.2 Create AccountingExportsTab.tsx with form and history table layout
- [x] 4.3 Write tests for ExportConfigurationForm component
- [x] 4.4 Create ExportConfigurationForm with react-hook-form + Zod validation
- [x] 4.5 Add target system dropdown (BMD/RZL/DATEV/CSV_GENERIC)
- [x] 4.6 Add date range pickers and status filter checkboxes
- [x] 4.7 Implement preview and generate button handlers
- [x] 4.8 Write tests for ExportHistoryTable component
- [x] 4.9 Create ExportHistoryTable with last 10 exports display
- [x] 4.10 Add download icon with re-download functionality
- [x] 4.11 Write tests for ExportPreviewModal component
- [x] 4.12 Create ExportPreviewModal with CSV preview and validation warnings
- [x] 4.13 Add "Accounting Exports" tab to Settings navigation
- [x] 4.14 Verify all UI component tests pass

### 5. Testing and Quality Assurance

- [x] 5.1 Run all CSV library unit tests and verify 100% pass rate
- [x] 5.2 Run all API integration tests and verify 100% pass rate
- [ ] 5.3 Manual QA: Generate BMD export with 20+ invoices and open in Excel
- [ ] 5.4 Manual QA: Verify German date format (dd.MM.yyyy) and comma decimals
- [ ] 5.5 Manual QA: Generate DATEV export with mixed VAT rates (10%, 13%, 20%)
- [ ] 5.6 Manual QA: Verify DATEV account codes (8300, 8400, 1776)
- [ ] 5.7 Manual QA: Test Kleinunternehmer-only invoices
- [ ] 5.8 Manual QA: Test empty date range (no invoices)
- [ ] 5.9 Manual QA: Test special characters in client names (ä, ö, ü, ß)
- [ ] 5.10 Manual QA: Verify export history table pagination and re-download
- [ ] 5.11 Run quality gates: pnpm typecheck && pnpm lint && pnpm build
- [ ] 5.12 Verify all quality gates pass with zero errors

## Implementation Notes

### Overview
Enable Austrian therapists to export invoice data to tax advisors' accounting software (BMD, RZL, DATEV) with one click. This feature eliminates 3+ hours of manual data entry monthly and is critical for TEST → PRODUCTION conversions.

### Technical Dependencies
- Task 1 must complete before Task 3 (API needs updated CSV library)
- Task 2 must complete before Task 3 (API needs ExportLog model)
- Task 3 must complete before Task 4 (UI needs working API endpoints)

### Key Deliverables
1. Updated CSV export library with BMD/RZL/DATEV/CSV_GENERIC formats
2. ExportLog database model with migrations
3. Four API endpoints (generate, preview, history, download)
4. Settings UI tab with form and history table
5. Comprehensive test coverage (unit + integration + manual QA)

### ExportLog Model Structure
Required fields for audit trail and re-download functionality:
- `id` (cuid), `therapistId`, `configurationId` (nullable)
- `exportType` (enum), `targetSystem` (enum)
- `dateRangeStart`, `dateRangeEnd` (timestamps)
- `invoiceCount`, `totalRevenueCents` (integers)
- `exportedAt` (timestamp), `fileName`, `fileSize` (bytes)
- `downloadCount` (integer), `lastDownloadAt` (nullable timestamp)

Relations:
- `Therapist` (many-to-one, cascade delete)
- `ExportConfiguration` (many-to-one, set null on delete)

### Quality Standards
- All tests must pass (unit, integration, E2E)
- TypeScript strict mode compliance (run on Node 20 LTS)
- ESLint zero warnings
- Build successful with zero errors
- Manual QA checklist 100% complete

**Quality Gate Commands (must return exit code 0):**
```bash
pnpm typecheck    # TypeScript validation
pnpm lint         # ESLint rules
pnpm build        # Production build
pnpm test         # All test suites
```

### Success Metrics
**Measurable Acceptance Criteria:**
- Export CSV files must open without encoding errors in Windows Excel 2016+
- BMD exports must import successfully into BMD test environment (Windows)
- DATEV exports must pass DATEV format validation (consultant test account)
- RZL exports must import into RZL without preprocessing
- 100% of manual QA tests pass (special characters, VAT rates, date formats)

### Austrian Compliance Requirements
- **BMD**: 11 fields including Satzart, GKonto, Steuercode, Buchcode
- **RZL**: Abbreviated columns (RE_NR, RE_DATUM, KU_STATUS)
- **DATEV**: Exact 14-column format, BU-Schlüssel codes (07/10/19)
- **UTF-8 BOM**: Required for Excel compatibility (Excel 2016+ on Windows)
- **Date Formats**:
  - **Display (UI)**: dd.MM.yyyy (e.g., "01.10.2025")
  - **Export (DATEV)**: ddMMyyyy with NO separators (e.g., "01102025")
  - **Export (BMD/RZL)**: dd.MM.yyyy with separators (e.g., "01.10.2025")
- **Decimal Separator**: Comma (,) for all monetary amounts in CSV
- **Field Separator**: Semicolon (;) for BMD/RZL/DATEV, configurable for CSV_GENERIC

### Rollback and Error Handling
- **Export Failures**: If CSV generation fails, log error in ExportLog with status field
- **Data Archival**: ExportLog entries older than 365 days can be archived/deleted (future enhancement)
- **Re-download Safety**: Regenerate CSV from current invoice data (payment status may have changed)
- **Validation Errors**: Preview endpoint must catch and display all validation errors BEFORE allowing download

---

**Estimated Timeline:** 2-3 days
**Assignee:** Codex
**Status:** Ready for Implementation
