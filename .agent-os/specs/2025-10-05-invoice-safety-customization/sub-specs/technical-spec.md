# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-10-05-invoice-safety-customization/spec.md

> Created: 2025-10-05
> Version: 1.0.0

## Technical Requirements

### 1. Database Architecture

**Schema Changes:**
```prisma
model Therapist {
  // New invoice customization fields
  invoiceLogoUrl            String?
  invoiceDisplayPreference  InvoiceDisplayPreference @default(NAME)
  invoiceThankYouMessage    String?

  // Tax validation tracking
  taxValidationStatus       Boolean   @default(false)
  taxValidatedAt            DateTime?
  taxValidatedBy            String?

  // Existing fields used for revenue tracking
  annualGrossCents          Int       @default(0)
  annualGrossCachedAt       DateTime?
}

enum InvoiceDisplayPreference {
  LOGO  // Show logo only
  NAME  // Show business name only (current default)
  BOTH  // Show logo + business name
}
```

**Migration Strategy:**
- Migration will be additive (no breaking changes)
- All new fields are nullable or have defaults
- Existing invoices remain unchanged
- No data backfill required

**Performance Considerations:**
- `annualGrossCents` caching reduces database load (24hr TTL)
- Index on `therapistId` + `createdAt` already exists on Invoice table
- Logo images stored externally (AWS S3/Vercel Blob) - only URL in database

### 2. Revenue Calculation Algorithm

**Calculation Logic:**
```typescript
// Cache-first strategy
1. Check therapist.annualGrossCachedAt
2. If cache valid (<24hrs old), return therapist.annualGrossCents
3. If cache invalid:
   a. Query invoices for current year (status: SENT | PAID)
   b. Sum totalGrossCents
   c. Update therapist.annualGrossCents + annualGrossCachedAt
   d. Return calculated value

// Query optimization
SELECT SUM(totalGrossCents) FROM Invoice
WHERE therapistId = $1
  AND status IN ('SENT', 'PAID')
  AND createdAt >= $currentYearStart
  AND createdAt < $nextYearStart
```

**Edge Cases:**
- First time calculation: No cache exists → Calculate and cache
- Year transition: Cache invalidates automatically (year mismatch)
- Manual refresh: API accepts `forceRefresh=true` parameter
- No invoices: Returns 0 (not error)

**Cache Invalidation Triggers:**
- Invoice created with status SENT
- Invoice status changed to PAID
- Invoice status changed to VOID (subtract from total)
- Manual refresh via compliance dashboard

### 3. File Upload Architecture

**Logo Upload Flow:**
```
Client → Upload API → Image Validation → Storage → Database URL
```

**Image Validation Requirements:**
- File types: PNG, JPG, JPEG, SVG
- Max file size: 2MB
- Recommended dimensions: 800x200px (4:1 ratio)
- Max dimensions: 1200x300px
- Image optimization: Compress to <500KB

**Storage Strategy:**
- Development: Local filesystem (`/public/uploads/logos/`)
- Production: Vercel Blob Storage or AWS S3
- URL format: `https://storage.myoflow.com/logos/{therapistId}/{timestamp}-{filename}`
- Security: Signed URLs with 1-year expiration

**API Endpoint:**
```typescript
POST /api/upload/invoice-logo
Content-Type: multipart/form-data

Request:
- file: File (logo image)
- therapistId: string (from session)

Response:
{
  success: true,
  logoUrl: "https://storage.myoflow.com/logos/..."
}

Errors:
- 400: Invalid file type
- 413: File too large
- 500: Upload failed
```

### 4. PDF Generation Updates

**Header Rendering Logic:**
```typescript
function renderInvoiceHeader(therapist: TherapistInfo) {
  switch (therapist.invoiceDisplayPreference) {
    case 'LOGO':
      // If logo exists, show logo; otherwise fallback to name
      return therapist.invoiceLogoUrl
        ? `<img src="${logoUrl}" />`
        : `<div class="name">${therapist.name}</div>`

    case 'BOTH':
      // Show logo above name
      return `
        ${therapist.invoiceLogoUrl ? `<img src="${logoUrl}" />` : ''}
        <div class="name">${therapist.name}</div>
      `

    case 'NAME':
    default:
      // Text-only header (current behavior)
      return `<div class="name">${therapist.name}</div>`
  }
}
```

**Watermark Implementation:**
```css
/* Fixed position overlay */
.watermark {
  position: fixed;      /* Fixed to viewport */
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-45deg);
  font-size: 120pt;
  color: rgba(0, 0, 0, 0.05);  /* Very light gray */
  font-weight: bold;
  pointer-events: none;  /* Don't interfere with text selection */
  z-index: 1000;         /* Above content */
  user-select: none;     /* Prevent text selection */
}
```

**Thank You Message Placement:**
- Position: After payment terms, before payment information
- Styling: Light blue background, left border accent
- Max length: 500 characters (truncated with ellipsis if exceeded)

**Validation Disclaimer:**
- Position: Footer section, after legal notices
- Conditional rendering: Only when `taxValidationStatus === false`
- Bilingual: German (primary) + English (secondary)
- Styling: Yellow background for unvalidated, green for validated

### 5. API Architecture

**Endpoint Overview:**
```
GET  /api/compliance/revenue-status
PUT  /api/settings/invoice-branding
GET  /api/compliance/checklist
POST /api/upload/invoice-logo
POST /api/compliance/mark-validated (admin only)
```

**Authentication Strategy:**
- All endpoints require NextAuth session
- Use `auth()` helper for server-side session check
- Use `requireTherapist()` helper to get therapist record
- Admin-only endpoints check `session.user.role`

**Rate Limiting:**
```typescript
// Applied to all compliance endpoints
const rateLimits = {
  '/api/compliance/*': {
    maxRequests: 100,
    windowMs: 60000 // 1 minute
  },
  '/api/upload/invoice-logo': {
    maxRequests: 10,
    windowMs: 60000 // 1 minute (prevent spam)
  }
}
```

**Error Handling:**
```typescript
// Standardized error responses
{
  error: string,           // Human-readable message
  code: string,            // Machine-readable code
  details?: any,           // Optional error details
  timestamp: string        // ISO 8601 timestamp
}

// Example error codes:
- AUTH_REQUIRED
- INVALID_FILE_TYPE
- FILE_TOO_LARGE
- VALIDATION_FAILED
- CALCULATION_ERROR
```

### 6. Frontend Architecture

**State Management:**
```typescript
// React hooks for data fetching
useSWR('/api/compliance/revenue-status', {
  refreshInterval: 5 * 60 * 1000, // 5 minutes
  revalidateOnFocus: true
})

// Form state (React Hook Form)
const { register, handleSubmit, watch } = useForm({
  defaultValues: {
    logoUrl: null,
    displayPreference: 'NAME',
    thankYouMessage: ''
  }
})
```

**Component Structure:**
```
settings/
├── invoice-branding-section.tsx (client component)
│   ├── logo-upload.tsx
│   ├── display-preference-selector.tsx
│   └── thank-you-message-editor.tsx
├── compliance-dashboard-tab.tsx (client component)
│   ├── compliance-checklist.tsx
│   └── validation-status-banner.tsx
dashboard/
├── revenue-threshold-widget.tsx (client component)
services/
└── vat-rate-warning.tsx (client component)
```

**Loading States:**
- Skeleton loaders for dashboard widgets
- Spinner for form submissions
- Progressive image loading for logo previews
- Optimistic updates for quick feedback

### 7. Testing Strategy

**Unit Tests:**
- Revenue calculation logic (100% coverage)
- PDF generation helpers
- Form validation schemas
- API request/response parsing

**Integration Tests:**
- API endpoints (request → database → response)
- File upload flow (validation → storage → database)
- Revenue calculation with cache
- Compliance checklist aggregation

**E2E Tests:**
- Complete invoice customization flow
- Logo upload and preview
- Revenue threshold widget updates
- VAT rate warning triggers

**Performance Tests:**
- PDF generation time (<2s target)
- Revenue calculation query performance (<100ms)
- Logo image optimization (<500KB)
- Dashboard load time (<1s)

### 8. Security Considerations

**File Upload Security:**
- Validate MIME types server-side
- Scan uploaded files for malware (ClamAV or similar)
- Restrict file extensions (whitelist only)
- Generate unique filenames (prevent overwriting)
- Store in isolated directory (not web root)

**Logo URL Validation:**
- Validate URL format before saving to database
- Only allow HTTPS URLs in production
- Verify logo URL accessibility before PDF generation
- Handle 404s gracefully (fallback to business name)

**Tax Validation Security:**
- Audit log all validation status changes
- Require admin role for marking as validated
- Include validator name/email in audit trail
- Immutable audit records (never delete)

**Rate Limiting:**
- Logo upload: 10 requests/minute per therapist
- Revenue calculation: 100 requests/minute per therapist
- Prevent brute force attacks on file upload

### 9. Performance Optimization

**Database Query Optimization:**
```sql
-- Revenue calculation (indexed query)
CREATE INDEX idx_invoice_revenue_calc
ON Invoice(therapistId, status, createdAt);

-- Existing indexes already support this query
```

**Caching Strategy:**
- Revenue status: 24-hour cache in database
- Compliance checklist: 5-minute SWR cache client-side
- Logo images: Browser cache + CDN (1-year expiration)
- PDF generation: No caching (always fresh)

**Image Optimization:**
```typescript
// Automatic optimization on upload
import sharp from 'sharp'

const optimizedImage = await sharp(uploadedFile)
  .resize(800, 200, { fit: 'inside', withoutEnlargement: true })
  .webp({ quality: 85 })
  .toBuffer()
```

**Bundle Size Impact:**
- New components: ~15KB gzipped
- Dependencies: None (uses existing libraries)
- Code splitting: Lazy-load settings components
- Total bundle increase: <20KB

### 10. Monitoring & Observability

**Metrics to Track:**
- Revenue calculation cache hit rate
- PDF generation time (p50, p95, p99)
- Logo upload success/failure rate
- API endpoint response times
- File upload storage usage

**Logging:**
```typescript
// Structured logging
logger.info('Revenue calculated', {
  therapistId,
  year,
  revenueCents,
  fromCache,
  duration: Date.now() - startTime
})

logger.error('Logo upload failed', {
  therapistId,
  fileSize,
  fileType,
  error: err.message
})
```

**Alerts:**
- PDF generation time >5s (critical)
- Revenue calculation errors >5% (warning)
- File upload failures >10% (warning)
- Storage usage >80% (critical)

## External Dependencies

### Required Libraries (Existing)
- `@prisma/client` - Database ORM
- `next` - React framework
- `puppeteer` - PDF generation
- `zod` - Schema validation
- `lucide-react` - Icons
- `swr` - Data fetching

### New Dependencies (Optional)
- `sharp` - Image optimization (recommended)
- `@aws-sdk/client-s3` - AWS S3 upload (if using S3)
- `@vercel/blob` - Vercel Blob storage (if using Vercel)

### External Services
- **File Storage:** Vercel Blob or AWS S3
- **Image Optimization:** Sharp (server-side) or Vercel Image Optimization
- **Monitoring:** Vercel Analytics or custom solution

## Rollout Plan

### Phase 1: Database & API (Week 1)
- Deploy database migration
- Implement API endpoints
- Unit tests + integration tests

### Phase 2: UI Components (Week 2)
- Invoice branding settings page
- Revenue threshold widget
- VAT rate warning component

### Phase 3: PDF Generation (Week 2)
- Logo rendering
- Watermark overlay
- Validation disclaimer

### Phase 4: Testing & QA (Week 3)
- E2E test suite
- Manual QA testing
- Performance testing
- Security audit

### Phase 5: Documentation & Launch (Week 3)
- User documentation
- API documentation
- Migration guide for existing users
- Launch announcement

## Backwards Compatibility

**No Breaking Changes:**
- All new fields have defaults or are nullable
- Existing invoices render unchanged
- Current PDF generation works as-is
- API is additive (no removed endpoints)

**Migration Path for Existing Users:**
- Automatic migration on deployment
- No manual intervention required
- Settings page shows new features with onboarding tooltips
- Gradual adoption (users can continue using NAME preference)

## Future Enhancements (Out of Scope)

- Multi-template support (different invoice designs)
- Advanced logo positioning controls
- Client-specific invoice customization
- Automated VAT rate detection via AI
- Integration with tax advisor portals
- Email delivery of invoices
- Custom footer messages per invoice
