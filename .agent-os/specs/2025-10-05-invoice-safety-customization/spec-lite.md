# Invoice Safety & Customization - Lite Summary

MyoFlow's invoice system needs enhanced safety measures and customization options before professional tax validation. This spec introduces smart warnings, revenue monitoring, and branding features to help therapists generate compliant, professional invoices.

## Key Points

- **Invoice Branding:** Upload logos, customize display (logo/name/both), add thank you messages
- **Smart VAT Warnings:** Alert therapists when selecting non-standard VAT rates for therapy services (10% or 13% instead of 0% or 20%)
- **Revenue Threshold Monitoring:** Auto-track annual revenue against €55k Kleinunternehmer threshold with visual dashboard widget
- **Compliance Dashboard:** Visual checklist showing validation status (tax validated vs. pending review)
- **Enhanced Validation:** Pre-generation checks with draft watermarks on PDFs, readiness scoring
- **Transparency Disclaimers:** Clear legal notices on invoices showing professional validation status

## Technical Highlights

**Database Changes:**
- Add 6 new fields to Therapist model (logo URL, display preference, thank you message, tax validation tracking)
- New enum: InvoiceDisplayPreference (LOGO | NAME | BOTH)
- Leverage existing annualGrossCents cache (24hr TTL)

**API Endpoints:**
- `GET /api/compliance/revenue-status` - Calculate current year revenue
- `PUT /api/settings/invoice-branding` - Update branding settings
- `GET /api/compliance/checklist` - Compliance readiness score
- `POST /api/upload/invoice-logo` - Logo upload (2MB max, PNG/JPG/SVG)

**PDF Updates:**
- Logo rendering in invoice headers
- Draft watermark overlay ("ENTWURF" diagonal text)
- Thank you message section (max 500 chars)
- Validation disclaimer footer (bilingual: DE/EN)

**UI Components:**
- Revenue Threshold Widget (dashboard) - Progress bar with green/yellow/red zones
- Invoice Branding Section (settings) - Logo upload, display selector, message editor
- VAT Rate Warning (service form) - Contextual alerts for unusual rates
- Compliance Dashboard Tab (settings) - Checklist with readiness score

## Success Metrics

- ✅ Therapists can upload and display logos on invoices
- ✅ System warns when inappropriate VAT rates selected
- ✅ Revenue threshold tracking shows accurate progress toward €55k
- ✅ Draft invoices display watermark
- ✅ Unvalidated invoices show clear disclaimer
- ✅ PDF generation time remains <2 seconds
- ✅ Test coverage ≥80%

## Implementation Timeline

**Week 1:** Database + API (revenue calculation, branding endpoints)
**Week 2:** UI Components (dashboard widget, settings page, VAT warnings)
**Week 2:** PDF Generation (logo rendering, watermarks, disclaimers)
**Week 3:** Testing + QA (E2E tests, performance validation, launch)

**Estimated Effort:** 31 hours total (3-4 week sprint)
