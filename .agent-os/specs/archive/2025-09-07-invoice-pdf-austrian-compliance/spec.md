# Spec: Invoice PDF Austrian Compliance + CSV Exports

## Problem

Austrian therapists need legally compliant PDF invoices and accountant-ready CSV exports. Current system generates basic invoices but lacks:
- Kleinunternehmerregelung (KU) vs VAT logic
- Austrian-format PDF rendering with proper legal notices  
- CSV exports in BMD/RZL/DATEV formats for tax preparation
- Performance date ("Leistungsdatum") compliance

## Goal

Generate professional Austrian-compliant PDF invoices with correct KU/VAT handling, plus CSV exports that accountants can directly import into Austrian accounting software.

## Non-Goals

- RKSV certified cash register functionality
- Payment processing integration
- Multi-language invoice templates (German-only for MVP)

## Success Metrics

- PDF generation API responds in <2 seconds (p95)
- All Austrian invoice compliance requirements met
- CSV exports successfully import into BMD/RZL test instances
- No PII logged during PDF generation process

## User Stories

**As an Austrian massage therapist:**
- I need PDF invoices that comply with Austrian tax law
- I need KU status to automatically omit VAT when applicable  
- I need CSV exports my accountant can import directly
- I need performance dates on invoices for compliance

**As an accountant:**
- I need CSV data in standard BMD/RZL/DATEV column format
- I need clean data with proper date formatting and amounts in cents
- I need separate exports for invoices vs cash transactions

## Acceptance Criteria

### PDF Generation
- [ ] GET /api/files/invoice/[id].pdf returns valid PDF
- [ ] KU therapists: no VAT rows, includes legal notice text
- [ ] VAT therapists: proper VAT breakdown (10%/13%/20%)
- [ ] Performance date ("Leistungsdatum") displayed correctly
- [ ] Professional German formatting and layout
- [ ] ETag caching for performance optimization

### CSV Exports  
- [ ] GET /api/exports/invoices.csv?month=YYYY-MM
- [ ] Columns: date, number, clientName, service, netCents, vatRate, vatCents, grossCents
- [ ] GET /api/exports/cash.csv?period=daily&date=YYYY-MM-DD
- [ ] Clean data suitable for direct accounting software import

### Austrian Compliance
- [ ] Kleinunternehmer detection from therapist profile
- [ ] Correct VAT rates and legal text
- [ ] Sequential invoice numbering (YYYY-NNN format)
- [ ] All required invoice elements per Austrian tax law