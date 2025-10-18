# CSV Accounting Exports Specification

**Status:** Draft
**Priority:** Medium (Phase 2 - Revenue Optimization)
**Created:** October 16, 2025
**Estimated Effort:** 2-3 days

---

## Quick Links

- **Main Spec:** [`spec.md`](./spec.md) - Full requirements and user stories
- **API Spec:** [`sub-specs/api-spec.md`](./sub-specs/api-spec.md) - REST endpoint specifications
- **Technical Spec:** [`sub-specs/technical-spec.md`](./sub-specs/technical-spec.md) - Implementation details
- **Handoff:** [`HANDOFF.md`](./HANDOFF.md) - Implementation guide for Codex

---

## Overview

Enable Austrian therapists to export their invoice data to their tax advisor's accounting software (BMD, RZL, DATEV) with one click. This feature eliminates 3+ hours of manual data entry every month and is a critical requirement for TEST → PRODUCTION account conversions.

---

## Key Features

1. **CSV Export Library Updates** - Enhance existing formatters with Austrian compliance requirements
2. **Three Accounting Formats** - BMD, RZL, DATEV (plus CSV Generic fallback)
3. **Export API Endpoints** - Generate, preview, download, and track export history
4. **Settings UI** - Configuration form and export history table

---

## Current State

- ✅ CSV export library exists with basic BMD/RZL/DATEV formatters
- ✅ ExportConfiguration model exists in database
- ❌ CSV library incomplete (missing fields, wrong codes)
- ❌ No API endpoints
- ❌ No UI for configuration
- ❌ No export logging/history

---

## Austrian Compliance Research

Based on web research of Austrian tax advisor (Steuerberater) requirements:

### BMD Format
- **Market Leader** in Austria
- **Required Fields:** Satzart, GKonto, Steuercode, Buchcode, Rechnungsnummer, etc.
- **Encoding:** UTF-8 with BOM
- **Separator:** Semicolon
- **Decimal:** Comma

### RZL Format
- **40-year-old** established Austrian system
- **DATEV Compatible** - supports DATEV imports natively
- **Encoding:** ASCII/ANSI
- **Column Names:** Abbreviated (RE_NR, RE_DATUM, KU_STATUS)

### DATEV Format
- **German/Austrian Standard** for tax advisors
- **Strict Validation:** Exact 14-column format required
- **BU-Schlüssel Codes:** 19 (20% VAT), 10 (10% VAT), 07 (13% VAT)
- **Account Codes:** 8300 (VAT revenue), 8400 (Kleinunternehmer), 1776 (VAT liability)

### SAF-T Austria
- **Official Audit Format** (XML, not CSV)
- **On-Demand Only** - not required for monthly exchanges
- **Out of Scope** for Phase 1

---

## Implementation Phases

1. **CSV Library Updates** (Day 1 Morning) - Update existing formatters
2. **Database Migration** (Day 1 Afternoon) - Add ExportLog model
3. **API Implementation** (Day 1 Afternoon) - 4 REST endpoints
4. **Settings UI** (Day 2) - Form + history table
5. **Testing & QA** (Day 3 Morning) - Comprehensive test coverage
6. **Documentation** (Day 3 Afternoon) - User guides and polish

---

## Success Metrics

### Quantitative
- **Adoption Rate:** 80% of PRODUCTION accounts configure exports within 30 days
- **Export Frequency:** Average 1.2 exports per therapist per month
- **Format Distribution:** BMD 60%, RZL 25%, DATEV 15%

### Qualitative
- **User Feedback:** "This saves me 3 hours every month"
- **Tax Advisor Feedback:** "CSV imports cleanly into our system"

---

## Files in This Spec

```
.agent-os/specs/2025-10-16-csv-accounting-exports/
├── README.md                    # This file
├── HANDOFF.md                   # Implementation guide for Codex
├── spec.md                      # Main requirements document
└── sub-specs/
    ├── api-spec.md             # REST API endpoint specifications
    └── technical-spec.md       # Implementation details
```

---

## Getting Started

**For Implementers (Codex):**
1. Read [`HANDOFF.md`](./HANDOFF.md)
2. Review all spec files
3. Run `/create-tasks` to generate task breakdown
4. Follow Agent OS workflow

**For Reviewers (Claude):**
1. Read [`spec.md`](./spec.md) for requirements
2. Review [`sub-specs/api-spec.md`](./sub-specs/api-spec.md) for API design
3. Check [`sub-specs/technical-spec.md`](./sub-specs/technical-spec.md) for implementation approach

---

## Dependencies

### Technical
- ✅ `packages/lib/src/csv-export.ts` - Existing CSV library (needs updates)
- ✅ `ExportConfiguration` model - Already in database schema
- ❌ `ExportLog` model - New (to be created)
- ❌ API endpoints - New (to be created)
- ❌ Settings UI components - New (to be created)

### External Services
- None (purely local CSV generation)

---

## Future Enhancements

**Phase 2: Scheduled Exports**
- Cron job support for automated monthly exports
- Email delivery with CSV attachment
- Notification system for failed exports

**Phase 3: SAF-T Austria**
- XML export format for Austrian tax authority audits
- OECD SAF-T schema compliance
- Integration with FinanzOnline

**Phase 4: API Integrations**
- Direct API integration with BMD (if available)
- Direct API integration with RZL (if available)
- Real-time sync instead of monthly batch exports

---

## References

- **Roadmap Item:** `.agent-os/product/roadmap.md` (Phase 2: Revenue Optimization)
- **External Integrations Plan:** `.agent-os/specs/external-integrations-plan.md`
- **Existing CSV Library:** `packages/lib/src/csv-export.ts`
- **Database Schema:** `packages/db/schema.prisma`

---

**Last Updated:** October 16, 2025
**Next Review:** After Codex implementation
