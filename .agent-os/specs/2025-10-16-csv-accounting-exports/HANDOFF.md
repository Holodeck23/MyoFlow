# Codex Handoff: CSV Accounting Exports

**Date:** October 16, 2025
**Spec:** CSV Accounting Exports
**Priority:** Medium (Revenue Optimization - Phase 2)
**Estimated Effort:** 2-3 days
**Assignee:** Codex

---

## 🚨 IMPORTANT: Agent OS Workflow

**Before starting implementation, you MUST follow the Agent OS process:**

1. **Read the spec files** in this directory:
   - `spec.md` - Full requirements document
   - `sub-specs/api-spec.md` - REST API endpoints
   - `sub-specs/technical-spec.md` - Implementation details

2. **Run the `/create-tasks` command** to generate a detailed task breakdown:
   - This will create `tasks.md` in this spec directory
   - Tasks will be organized by phase with clear acceptance criteria
   - Each task will have proper dependencies and sequencing

3. **Execute tasks systematically**:
   - Work through tasks in order (CSV library → API → database → UI → testing)
   - Update `tasks.md` with progress (mark items complete)
   - Run quality gates after each phase (typecheck, lint, build)

4. **Document decisions** in `.agent-os/docs/DECISION_LOG.md` if you deviate from spec

**DO NOT start coding until tasks.md is generated!** This ensures proper planning and tracking.

---

## Context

Enable Austrian therapists to export invoice data to their tax advisor's accounting software (BMD, RZL, DATEV) with one click. This eliminates 3+ hours of manual data entry every month and is a critical feature for TEST → PRODUCTION account conversions.

**Critical Insight from Research:**
- BMD is Austria's market leader - requires specific fields like `satzart`, `gkonto`, `steuercode`, `buchcode`
- RZL supports DATEV format natively - 40-year-old established system
- DATEV requires exact 14-column format with strict BU-Schlüssel codes (07/10/19 for VAT rates)
- Monthly VAT returns (UVA) due on 15th of second month - monthly exports are standard workflow
- SAF-T Austria (XML) is official audit format but NOT needed for regular tax advisor exchange

**Current State:**
- ✅ CSV export library exists (`packages/lib/src/csv-export.ts`) with basic BMD/RZL/DATEV formatters
- ✅ ExportConfiguration model exists in database
- ❌ CSV library incomplete (missing BMD fields, wrong DATEV codes, no CSV generic)
- ❌ No API endpoints for generating/downloading exports
- ❌ No UI in settings for configuration and history
- ❌ No export logging or history tracking

---

## Objectives

Implement 4 interconnected features to deliver complete accounting export workflow:

1. **CSV Library Enhancements** - Update existing formatters with research findings
2. **Database Schema** - Add ExportLog model for audit trail
3. **API Endpoints** - Generate, preview, download exports
4. **Settings UI** - Configuration form and export history table

---

## Files to Reference

### Spec Documentation
- **Main Spec:** `.agent-os/specs/2025-10-16-csv-accounting-exports/spec.md`
- **API Spec:** `.agent-os/specs/2025-10-16-csv-accounting-exports/sub-specs/api-spec.md`
- **Technical Spec:** `.agent-os/specs/2025-10-16-csv-accounting-exports/sub-specs/technical-spec.md`

### Existing Code
- **CSV Export Library:** `packages/lib/src/csv-export.ts` (needs updates)
- **Database Schema:** `packages/db/schema.prisma` (ExportConfiguration exists, ExportLog new)
- **Auth Helper:** `apps/web/lib/server-auth.ts` (requireTherapist)

### Research Findings
- BMD Format: See spec.md lines 327-355 (required fields, German headers, UTF-8 BOM)
- RZL Format: See spec.md lines 358-380 (ASCII/ANSI, DATEV compatibility)
- DATEV Format: See spec.md lines 383-426 (14 columns, BU-Schlüssel codes, SKR03/04)
- SAF-T Austria: See spec.md lines 429-447 (out of scope for Phase 1)

---

## Implementation Sequence

### Phase 1: CSV Library Updates (Day 1 Morning - 3h)

**Objective:** Update existing `packages/lib/src/csv-export.ts` with Austrian compliance requirements

**Tasks:**
1. **BMD Format Enhancement:**
   - Add 4 new required fields: `Satzart`, `GKonto`, `Steuercode`, `Buchcode`
   - Capitalize German header names (Rechnungsnummer, Rechnungsdatum, etc.)
   - Implement proper CSV escaping for special characters
   - Add UTF-8 BOM support for Excel compatibility

2. **DATEV Format Corrections:**
   - Update BU-Schlüssel codes: `19` (20% VAT), `10` (10% VAT), `07` (13% VAT)
   - Ensure all 14 columns present in exact order
   - Fix date format to `ddMMyyyy` (no separators)
   - Add consultant/client number options

3. **Create Generic CSV Export:**
   - New `exportToGenericCSV()` function
   - Configurable separator (comma or semicolon)
   - Configurable date format (dd.MM.yyyy or ISO 8601)
   - Include net/VAT breakdown columns

4. **Enhanced Validation:**
   - Update `validateInvoiceForExport()` with Austrian checks
   - Validate VAT calculations match gross totals
   - Warn for missing client addresses
   - Prevent DRAFT invoice export

**Verification:**
```bash
# Run CSV library tests
pnpm --filter @myoflow/lib test src/csv-export.test.ts

# Verify exports manually
node scripts/test-csv-export.ts
```

---

### Phase 2: Database Migration (Day 1 Afternoon - 1h)

**Objective:** Add ExportLog model for tracking export history

**Tasks:**
1. Add ExportLog model to `packages/db/schema.prisma`
2. Add ExportLogs relation to Therapist model
3. Add ExportLogs relation to ExportConfiguration model
4. Generate migration: `npx prisma migrate dev --name add-export-log --create-only`
5. Review generated SQL, then apply: `npx prisma db push`
6. Update Prisma client: `npx prisma generate`

**Verification:**
```bash
# Check migration status
npx prisma migrate status

# Verify ExportLog table exists
DATABASE_URL=postgresql://ZOD@localhost:5432/myoflow psql -c "\d ExportLog;"

# Check relations
DATABASE_URL=postgresql://ZOD@localhost:5432/myoflow psql -c "SELECT * FROM information_schema.table_constraints WHERE table_name = 'ExportLog';"
```

---

### Phase 3: API Implementation (Day 1 Afternoon - 4h)

**Objective:** Create 3 API endpoints for export workflow

**Tasks:**
1. **Generate Endpoint:**
   - Create `apps/web/app/api/exports/accounting/generate/route.ts`
   - Implement POST handler with `requireTherapist` auth
   - Query invoices within date range (exclude DRAFT)
   - Call appropriate CSV export function
   - Create ExportLog entry
   - Return CSV with Content-Disposition header

2. **Preview Endpoint:**
   - Create `apps/web/app/api/exports/accounting/preview/route.ts`
   - Implement POST handler
   - Return first 10 CSV rows + validation warnings
   - Include export summary (invoice count, revenue total)

3. **History Endpoint:**
   - Create `apps/web/app/api/exports/accounting/history/route.ts`
   - Implement GET handler with pagination
   - Query ExportLog for therapist (last 10 exports)
   - Return export metadata

4. **Download Endpoint:**
   - Create `apps/web/app/api/exports/accounting/download/[exportId]/route.ts`
   - Implement GET handler
   - Regenerate CSV from export log metadata
   - Increment downloadCount, update lastDownloadAt

**Verification:**
```bash
# Manual API testing
curl -X POST http://localhost:3000/api/exports/accounting/preview \
  -H "Content-Type: application/json" \
  -d '{"targetSystem":"BMD","dateRangeStart":"2025-09-01","dateRangeEnd":"2025-09-30"}'

# Check export log creation
DATABASE_URL=postgresql://ZOD@localhost:5432/myoflow psql -c "SELECT * FROM ExportLog ORDER BY exported_at DESC LIMIT 5;"
```

---

### Phase 4: Settings UI (Day 2 - 6h)

**Objective:** Add "Accounting Exports" tab to Settings with form and history table

**Tasks:**
1. **Create AccountingExportsTab Component:**
   - File: `apps/web/app/dashboard/settings/components/AccountingExportsTab.tsx`
   - Layout: Configuration form + export history table
   - State management for preview modal

2. **Create ExportConfigurationForm Component:**
   - Target system dropdown (BMD/RZL/DATEV/CSV_GENERIC)
   - Date range pickers (start/end)
   - Status filter checkboxes (SENT/PAID)
   - "Preview Export" button
   - "Generate & Download" button
   - Form validation with react-hook-form + Zod

3. **Create ExportHistoryTable Component:**
   - Display last 10 exports
   - Columns: Date, Format, Date Range, Invoice Count, Revenue, Download
   - Download icon triggers re-download
   - Format dates with Austrian locale (dd.MM.yyyy)

4. **Create ExportPreviewModal Component:**
   - Display first 10 CSV rows
   - Show validation warnings (highlighted)
   - Display export summary
   - "Confirm & Download" button

5. **Add Tab to Settings Navigation:**
   - Update `apps/web/app/dashboard/settings/page.tsx`
   - Add "Accounting Exports" to tab list
   - Icon: `FileSpreadsheet` from lucide-react

**Verification:**
```bash
# Start dev server
pnpm dev

# Navigate to http://localhost:3000/dashboard/settings?tab=accounting-exports
# Test full workflow:
# 1. Select BMD, previous month date range
# 2. Click "Preview Export"
# 3. Verify preview modal shows CSV rows
# 4. Click "Generate & Download"
# 5. Verify CSV downloads with correct filename
# 6. Check export appears in history table
# 7. Click download icon in history
# 8. Verify re-download works
```

---

### Phase 5: Testing & Quality Assurance (Day 3 - 4h)

**Objective:** Comprehensive test coverage and manual QA

**Tasks:**
1. **CSV Library Unit Tests:**
   - File: `packages/lib/src/__tests__/csv-export.test.ts`
   - Test all 4 export formats (BMD, RZL, DATEV, CSV_GENERIC)
   - Test Kleinunternehmer vs VAT handling
   - Test quote escaping and special characters
   - Test validation errors and warnings

2. **API Integration Tests:**
   - File: `apps/web/app/api/exports/accounting/generate/route.test.ts`
   - Test successful CSV generation
   - Test DRAFT invoice exclusion
   - Test date range filtering
   - Test ExportLog creation
   - Test authorization (401 for non-therapists)

3. **Manual QA Checklist:**
   - [ ] Generate BMD export with 20+ invoices
   - [ ] Verify CSV opens correctly in Excel (UTF-8 BOM)
   - [ ] Verify German date format (dd.MM.yyyy)
   - [ ] Verify decimal comma (,) for amounts
   - [ ] Test DATEV export with mixed VAT rates (10%, 13%, 20%)
   - [ ] Verify account codes (8300, 8400, 1776)
   - [ ] Test Kleinunternehmer-only invoices
   - [ ] Test empty date range (no invoices)
   - [ ] Test preview modal shows validation warnings
   - [ ] Test export history table pagination
   - [ ] Test re-download from history

4. **Edge Case Testing:**
   - Test with special characters in client names (ä, ö, ü, ß)
   - Test with empty client addresses
   - Test with very large invoice amounts (€10,000+)
   - Test with zero invoices in date range
   - Test with DRAFT-only invoices (should error)

**Verification:**
```bash
# Run all tests
pnpm test

# Run specific test suites
pnpm --filter @myoflow/lib test csv-export
pnpm --filter web test api/exports

# Check test coverage
pnpm test --coverage
```

---

### Phase 6: Documentation & Polish (Day 3 - 2h)

**Objective:** Complete documentation and final review

**Tasks:**
1. Update `packages/lib/README.md` with CSV export examples
2. Add JSDoc comments to all new functions
3. Create user guide: "How to Export Invoices to Your Tax Advisor"
4. Update `CHANGELOG.md` with new features
5. Final quality gates check

**Verification:**
```bash
# TypeScript check
pnpm typecheck

# Lint check
pnpm lint

# Build check
pnpm build

# All must pass with zero errors
```

---

## Quality Gates

Before marking complete, ALL must pass:

```bash
# 1. TypeScript check
pnpm typecheck

# 2. Lint check
pnpm lint

# 3. Build check
pnpm build

# 4. Test suite
pnpm test

# 5. Database migration status
npx prisma migrate status

# 6. Manual smoke test
# - Generate BMD export
# - Open in Excel
# - Verify formatting correct
# - Check export history
```

All must pass with zero errors.

---

## Potential Gotchas

### 1. UTF-8 BOM for Excel
**Issue:** Excel may not detect UTF-8 encoding without BOM
**Solution:** Always prepend `\uFEFF` to CSV content before returning

### 2. CSV Injection Attacks
**Issue:** Client names starting with `=`, `+`, `-`, `@` could trigger formulas
**Solution:** Prefix with single quote (`'`) when detected

### 3. Date Range Timezone Issues
**Issue:** Dates might be off by one day due to UTC vs Vienna timezone
**Solution:** Always use `Europe/Vienna` timezone for date calculations

### 4. DATEV Column Order
**Issue:** DATEV strictly enforces column order - any deviation causes import failure
**Solution:** Follow exact 14-column order from spec (see technical-spec.md lines 394-408)

### 5. VAT Breakdown Parsing
**Issue:** vatBreakdown is JSON - structure might vary
**Solution:** Defensive parsing with fallbacks (see calculateNetAmount helper)

### 6. Export History Storage
**Issue:** Should we store CSV files or regenerate on download?
**Decision:** Regenerate on download (avoids storage costs, ensures up-to-date payment status)

---

## Success Criteria

✅ This feature is complete when:

- [ ] CSV export library updated with all 4 formats (BMD, RZL, DATEV, CSV_GENERIC)
- [ ] UTF-8 BOM added to all exports
- [ ] ExportLog database model created and migrated
- [ ] All 4 API endpoints implemented (generate, preview, history, download)
- [ ] Settings UI tab fully functional
- [ ] Export history table shows last 10 exports
- [ ] Preview modal displays CSV rows and validation warnings
- [ ] Manual QA completed with real invoice data
- [ ] All 3 accounting formats tested in Excel/accounting software
- [ ] Unit and integration tests passing (>80% coverage)
- [ ] Documentation updated
- [ ] Quality gates pass (typecheck, lint, build, test)

---

## Testing Checklist

### CSV Format Validation
- [ ] BMD: Verify all 11 columns present (including Satzart, GKonto, Steuercode, Buchcode)
- [ ] BMD: German header names capitalized
- [ ] BMD: Semicolon separator, comma decimal separator
- [ ] RZL: Abbreviated column names (RE_NR, RE_DATUM, KU_STATUS)
- [ ] RZL: Kleinunternehmer as 1/0 not Ja/Nein
- [ ] DATEV: Exactly 14 columns in correct order
- [ ] DATEV: BU-Schlüssel codes correct (19/10/07)
- [ ] DATEV: Date format ddMMyyyy (no separators)
- [ ] CSV Generic: Configurable separator and date format

### Functional Testing
- [ ] Generate export for previous month
- [ ] Exclude DRAFT invoices
- [ ] Include SENT and PAID invoices
- [ ] Preview shows first 10 rows
- [ ] Validation warnings displayed
- [ ] Export log created in database
- [ ] Export appears in history table
- [ ] Re-download works
- [ ] Download count increments

### Edge Cases
- [ ] Empty date range (no invoices)
- [ ] DRAFT-only invoices (validation error)
- [ ] Special characters in client names (ä, ö, ü, ß)
- [ ] Missing client addresses (warning, not error)
- [ ] Very large amounts (€10,000+)
- [ ] Mixed VAT rates (10%, 13%, 20%)
- [ ] Kleinunternehmer-only invoices

---

## Questions or Blockers?

If you encounter issues:
1. Check technical spec for detailed implementation guidance
2. Review API spec for endpoint specifications
3. Reference existing CSV library for patterns
4. Ask user for clarification if requirements unclear
5. Document decisions in DECISION_LOG.md if deviating from spec

---

## Workflow Summary for Codex

**Step-by-step process:**

```bash
# 1. Read this handoff document (you're here!)

# 2. Review all spec files
# - spec.md
# - sub-specs/api-spec.md
# - sub-specs/technical-spec.md

# 3. Generate task breakdown
/create-tasks

# 4. Review generated tasks.md in this directory

# 5. Begin implementation (Phase 1 → Phase 6)
# - Mark tasks complete as you go
# - Run quality gates after each phase
# - Update DECISION_LOG.md if deviating from spec

# 6. Final verification
pnpm typecheck && pnpm lint && pnpm build && pnpm test
```

**Estimated Timeline:** 2-3 days for complete implementation and testing.

**Remember:** Follow Agent OS workflow = Better planning, tracking, and coordination!

Good luck! 🚀
