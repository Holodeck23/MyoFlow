# Tasks: Invoice PDF Austrian Compliance + CSV Exports

**Parent Task:** INVOICE-PDF-AUSTRIAN-COMPLIANCE

## Task 1: Database Schema & Migration

**Description:** Add Austrian compliance fields to Therapist and Invoice models

**Acceptance Criteria:**
- [ ] Therapist model extended with kleinunternehmer, businessName, businessAddress fields
- [ ] Invoice model extended with performanceDate, vatRate, netCents, vatCents, tender fields  
- [ ] Migration script preserves existing data and calculates missing values
- [ ] Database indexes added for performance (therapistId + performanceDate)
- [ ] Prisma schema updated and client regenerated
- [ ] All existing tests still pass after schema changes

**Implementation Steps:**
1. Create migration file with schema extensions
2. Add data migration logic for existing invoices
3. Update Prisma schema with new fields and constraints
4. Regenerate Prisma client
5. Update TypeScript types throughout codebase
6. Test migration on development database

## Task 2: Austrian Business Logic Utilities

**Description:** Core functions for KU/VAT calculations and compliance

**Acceptance Criteria:**
- [ ] `computeInvoiceDisplay()` function handles KU vs VAT logic correctly
- [ ] VAT rates (10%, 13%, 20%) calculated accurately
- [ ] Kleinunternehmer legal footer text included when applicable
- [ ] Performance date validation and formatting
- [ ] Unit tests cover all VAT scenarios and edge cases
- [ ] Type safety for Austrian business logic

**Implementation Steps:**
1. Create `/packages/lib/src/austrian-invoice.ts` utility module
2. Implement KU detection and VAT calculation logic
3. Add German legal text constants
4. Create comprehensive unit test suite
5. Export typed interfaces for invoice display data
6. Document Austrian compliance rules in code comments

## Task 3: PDF Generation Route & Template

**Description:** HTML-to-PDF pipeline with Austrian formatting

**Acceptance Criteria:**
- [ ] Route `/api/files/invoice/[id].pdf` returns valid PDF
- [ ] Professional A4 layout with German formatting
- [ ] Conditional VAT section rendering based on therapist KU status
- [ ] ETag caching implemented with proper headers
- [ ] Performance <2 seconds for PDF generation
- [ ] Error handling for missing data and generation failures

**Implementation Steps:**
1. Create API route handler with authentication
2. Build HTML template component with conditional sections
3. Integrate Puppeteer PDF generation with caching
4. Add ETag generation based on invoice.updatedAt
5. Implement proper error responses and logging
6. Test PDF output with various invoice configurations

## Task 4: CSV Export Endpoints

**Description:** BMD/RZL/DATEV-compatible CSV exports for accounting

**Acceptance Criteria:**
- [ ] `/api/exports/invoices.csv?month=YYYY-MM` returns proper format
- [ ] `/api/exports/cash.csv?period=daily&date=YYYY-MM-DD` works correctly
- [ ] Column headers match BMD/RZL/DATEV import requirements
- [ ] Data properly formatted (dates, amounts in cents)
- [ ] Authentication and role-based access control (OWNER/ACCOUNTANT)
- [ ] Streaming for large datasets to prevent memory issues

**Implementation Steps:**
1. Create `/api/exports/invoices.csv` route handler
2. Create `/api/exports/cash.csv` route handler  
3. Implement CSV formatting with proper German date formats
4. Add role-based permission checks
5. Test with sample data and verify accounting software import
6. Add rate limiting and error handling

## Task 5: Frontend Integration & Testing

**Description:** Update invoice detail pages with PDF download and CSV export links

**Acceptance Criteria:**
- [ ] PDF download button added to invoice detail page
- [ ] CSV export links in dashboard/reports section
- [ ] Loading states and error handling for downloads
- [ ] German UI text for all new features
- [ ] E2E tests for PDF generation workflow
- [ ] Accessibility compliance for new UI elements

**Implementation Steps:**
1. Add PDF download button to invoice detail page
2. Create CSV export section in dashboard
3. Implement download progress indicators
4. Add German translations for new UI elements
5. Write E2E tests for complete PDF workflow
6. Test accessibility with screen readers

## Task 6: Documentation & Sample Files

**Description:** Create documentation and sample outputs for validation

**Acceptance Criteria:**
- [ ] Austrian compliance documentation updated
- [ ] Sample PDF files for KU and VAT scenarios attached to spec
- [ ] Sample CSV files for BMD/RZL/DATEV validation
- [ ] API documentation updated with new endpoints
- [ ] Troubleshooting guide for PDF generation issues
- [ ] Migration guide for existing installations

**Implementation Steps:**
1. Generate sample PDFs with test data (KU + VAT scenarios)
2. Create sample CSV exports for accountant validation
3. Update API documentation with request/response examples
4. Document Austrian compliance requirements met
5. Create troubleshooting guide for common issues
6. Add samples to spec folder for reference

## Overall Acceptance Criteria

### Functional Requirements
- [ ] Austrian therapists can generate compliant PDF invoices
- [ ] KU vs VAT logic works correctly in all scenarios
- [ ] CSV exports import successfully into BMD/RZL test instances
- [ ] Performance requirements met (<2s PDF, <5s CSV)
- [ ] All German legal requirements satisfied

### Technical Requirements  
- [ ] TypeScript strict mode compliance maintained
- [ ] All tests pass (unit + integration + e2e)
- [ ] No PII in application logs
- [ ] Proper error handling and user feedback
- [ ] Security review passed (authentication, authorization)

### Documentation Requirements
- [ ] Spec folder includes sample PDFs and CSVs
- [ ] Austrian compliance checklist completed
- [ ] API documentation updated
- [ ] Migration guide provided

## Rollout Plan

1. **Development**: Test with sample therapist data
2. **Staging**: Validate with accountant using test imports  
3. **Production**: Gradual rollout with monitoring
4. **Post-deployment**: Collect feedback and iterate

## Rollback Plan

1. **Database**: Revert migration if critical issues found
2. **API**: Feature flags to disable new endpoints if needed
3. **Frontend**: Hide new UI elements via configuration
4. **Monitoring**: Watch for PDF generation failures and errors