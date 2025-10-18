# API Specification: CSV Accounting Exports

**Parent Spec:** `../spec.md`
**Created:** October 16, 2025
**Version:** 1.0.0

---

## Overview

This document specifies the REST API endpoints for generating, previewing, and managing accounting exports in BMD, RZL, DATEV, and generic CSV formats.

---

## Authentication

All endpoints require therapist authentication via NextAuth session.

```typescript
import { requireTherapist } from '@/lib/server-auth'

// Usage in API route
const { therapist, user } = await requireTherapist(request)
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Authentication required"
}
```

---

## Endpoints

### 1. POST /api/exports/accounting/generate

Generate and download a CSV export for a specified date range and target system.

#### Request Body

```typescript
{
  targetSystem: 'BMD' | 'RZL' | 'DATEV' | 'CSV_GENERIC'
  dateRangeStart: string  // ISO 8601 date
  dateRangeEnd: string    // ISO 8601 date
  statusFilter?: ('SENT' | 'PAID')[]  // Default: ['SENT', 'PAID']
  configurationId?: string  // Optional: use saved configuration
  options?: {
    // DATEV-specific
    consultantNumber?: string
    clientNumber?: string

    // Generic CSV options
    separator?: ',' | ';'
    dateFormat?: 'dd.MM.yyyy' | 'yyyy-MM-dd'
    includeHeader?: boolean
  }
}
```

#### Example Request

```bash
POST /api/exports/accounting/generate
Content-Type: application/json

{
  "targetSystem": "BMD",
  "dateRangeStart": "2025-09-01",
  "dateRangeEnd": "2025-09-30",
  "statusFilter": ["SENT", "PAID"]
}
```

#### Success Response (200 OK)

**Headers:**
```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="MyoFlow-BMD-Export-2025-09-01-2025-09-30-20251016-1430.csv"
```

**Body:** CSV file content

#### Validation Error Response (400 Bad Request)

```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "invoiceValidationErrors": [
      {
        "invoiceId": "clx123abc",
        "invoiceNumber": "2025-023",
        "errors": ["Client name is required", "DRAFT invoices cannot be exported"]
      }
    ],
    "warningCount": 3,
    "excludedDraftCount": 2
  }
}
```

#### Empty Result Response (200 OK)

```json
{
  "success": true,
  "message": "No invoices found in date range",
  "invoiceCount": 0
}
```

---

### 2. POST /api/exports/accounting/preview

Preview export data before downloading, including validation warnings.

#### Request Body

```typescript
{
  targetSystem: 'BMD' | 'RZL' | 'DATEV' | 'CSV_GENERIC'
  dateRangeStart: string
  dateRangeEnd: string
  statusFilter?: ('SENT' | 'PAID')[]
  options?: {
    // Same as generate endpoint
  }
}
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "invoiceCount": 23,
    "totalRevenueCents": 245000,
    "dateRangeStart": "2025-09-01T00:00:00.000Z",
    "dateRangeEnd": "2025-09-30T23:59:59.999Z",
    "targetSystem": "BMD",
    "previewRows": [
      "Rechnungsnummer;Rechnungsdatum;Kunde;Kundenadresse;Bruttobetrag;Status;Kleinunternehmer",
      "2025-001;01.09.2025;Max Mustermann;\"Linz, 4020\";150,00;PAID;Ja",
      "2025-002;03.09.2025;Anna Schmidt;\"Wels, 4600\";200,00;SENT;Ja",
      "..."
    ],
    "validationWarnings": [
      {
        "type": "MISSING_CLIENT_ADDRESS",
        "invoiceNumber": "2025-012",
        "message": "Client address is empty - will appear blank in export"
      }
    ],
    "excludedInvoices": {
      "draftCount": 2,
      "draftInvoiceNumbers": ["2025-DRAFT-001", "2025-DRAFT-002"]
    }
  }
}
```

---

### 3. GET /api/exports/accounting/history

Retrieve past export history for the therapist.

#### Query Parameters

```
?limit=10  // Optional: default 10, max 50
&offset=0  // Optional: for pagination
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "exports": [
      {
        "id": "clx456def",
        "exportedAt": "2025-10-01T08:30:00.000Z",
        "targetSystem": "BMD",
        "dateRangeStart": "2025-09-01T00:00:00.000Z",
        "dateRangeEnd": "2025-09-30T23:59:59.999Z",
        "invoiceCount": 23,
        "totalRevenueCents": 245000,
        "fileName": "MyoFlow-BMD-Export-2025-09-01-2025-09-30-20251001-0830.csv",
        "fileSize": 4521,
        "downloadCount": 2,
        "lastDownloadAt": "2025-10-05T14:20:00.000Z",
        "configurationName": "Monthly BMD Export"
      },
      {
        "id": "clx789ghi",
        "exportedAt": "2025-09-01T09:15:00.000Z",
        "targetSystem": "DATEV",
        "dateRangeStart": "2025-08-01T00:00:00.000Z",
        "dateRangeEnd": "2025-08-31T23:59:59.999Z",
        "invoiceCount": 19,
        "totalRevenueCents": 210000,
        "fileName": "MyoFlow-DATEV-Export-2025-08-01-2025-08-31-20250901-0915.csv",
        "fileSize": 3890,
        "downloadCount": 1,
        "lastDownloadAt": "2025-09-01T09:15:00.000Z",
        "configurationName": null
      }
    ],
    "total": 12,
    "limit": 10,
    "offset": 0
  }
}
```

---

### 4. GET /api/exports/accounting/download/:exportId

Re-download a previous export from history.

#### Path Parameters

- `exportId` - ID of the export from history

#### Success Response (200 OK)

**Headers:**
```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="[original filename]"
```

**Body:** Regenerated CSV content

**Note:** CSV is regenerated from current invoice data, not stored. This ensures up-to-date payment status if invoices were paid after initial export.

#### Not Found Response (404)

```json
{
  "success": false,
  "error": "Export not found"
}
```

---

## Implementation Details

### Invoice Query Logic

```typescript
// Pseudo-code for invoice querying
const invoices = await prisma.invoice.findMany({
  where: {
    therapistId: therapist.id,
    status: { in: statusFilter }, // ['SENT', 'PAID']
    createdAt: {
      gte: new Date(dateRangeStart),
      lte: new Date(dateRangeEnd)
    }
  },
  include: {
    Client: {
      select: {
        name: true,
        street: true,
        postalCode: true,
        city: true
      }
    },
    Payments: {
      select: {
        status: true,
        amountCents: true,
        provider: true,
        createdAt: true
      }
    }
  },
  orderBy: {
    createdAt: 'asc'
  }
})
```

### Export Log Creation

```typescript
// After successful CSV generation
const exportLog = await prisma.exportLog.create({
  data: {
    therapistId: therapist.id,
    configurationId: request.configurationId || null,
    exportType: 'ACCOUNTING_EXPORT',
    targetSystem: request.targetSystem,
    dateRangeStart: new Date(request.dateRangeStart),
    dateRangeEnd: new Date(request.dateRangeEnd),
    invoiceCount: invoices.length,
    totalRevenueCents: invoices.reduce((sum, inv) => sum + inv.totalGrossCents, 0),
    fileName: generatedFileName,
    fileSize: csvContent.length
  }
})
```

### CSV Response Helper

```typescript
// Helper function for returning CSV downloads
function createCSVResponse(csvContent: string, fileName: string) {
  // Add UTF-8 BOM for Excel compatibility
  const bom = '\uFEFF'
  const csvWithBom = bom + csvContent

  return new Response(csvWithBom, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': csvWithBom.length.toString()
    }
  })
}
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}  // Optional: additional context
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | User is not a therapist |
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `NO_INVOICES` | 200 | No invoices in date range (not an error, returns empty CSV) |
| `EXPORT_NOT_FOUND` | 404 | Export ID not found in history |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Rate Limiting

**Limit:** 10 exports per minute per therapist
**Implementation:** PostgreSQL-backed rate limiting via `RateLimit` table

```typescript
const rateLimitKey = `export:${therapist.id}`
const withinLastMinute = await prisma.rateLimit.count({
  where: {
    key: rateLimitKey,
    createdAt: {
      gte: new Date(Date.now() - 60 * 1000)
    }
  }
})

if (withinLastMinute >= 10) {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Rate limit exceeded. Please try again in a minute.'
    }),
    { status: 429 }
  )
}
```

---

## Testing Strategy

### Unit Tests

**File:** `apps/web/app/api/exports/accounting/generate/route.test.ts`

```typescript
describe('POST /api/exports/accounting/generate', () => {
  it('generates BMD export with correct format', async () => {
    // Test BMD-specific fields and formatting
  })

  it('excludes DRAFT invoices from export', async () => {
    // Ensure only SENT and PAID invoices are included
  })

  it('validates date range parameters', async () => {
    // Test invalid date ranges return 400
  })

  it('returns 401 for unauthenticated requests', async () => {
    // Test authentication requirement
  })

  it('creates export log entry', async () => {
    // Verify ExportLog record is created
  })
})
```

### Integration Tests

**File:** `apps/web/app/api/exports/accounting/integration.test.ts`

```typescript
describe('CSV Export End-to-End', () => {
  it('generates, downloads, and logs BMD export', async () => {
    // Full workflow test
  })

  it('preview matches generated export', async () => {
    // Verify preview and generate return same data
  })

  it('re-download regenerates with current payment status', async () => {
    // Test re-download after payment status change
  })
})
```

---

## Performance Considerations

### Query Optimization

- Use database indexes on `Invoice.therapistId`, `Invoice.createdAt`, `Invoice.status`
- Include only necessary fields in Prisma queries
- Consider pagination for very large date ranges (> 1000 invoices)

### CSV Generation

- Stream CSV generation for large exports (> 10MB)
- Consider background job for exports > 5000 invoices
- Cache export logs to avoid regenerating identical exports

---

## Security Considerations

### Authorization

- Always verify therapist ID matches invoice therapist
- Never expose other therapists' data in exports
- Validate configuration belongs to requesting therapist

### Data Sanitization

- Escape special characters in client names/addresses
- Prevent CSV injection attacks (leading =, +, -, @)
- Validate all user inputs before querying database

### Sensitive Data

- IBAN numbers (if included) must be partial-masked in preview
- Client addresses should respect GDPR consent
- Audit log all export operations

---

## Future Enhancements

### Phase 2: Scheduled Exports

**New Endpoint:** `POST /api/exports/accounting/schedule`

```typescript
{
  configurationId: string
  cronExpression: string  // e.g., "0 0 1 * *" for 1st of month
  emailRecipient: string
  enabled: boolean
}
```

### Phase 3: SAF-T Austria XML

**New Endpoint:** `POST /api/exports/audit/saf-t`

Generate XML export for Austrian tax authority audits.

---

## References

- **CSV Export Library:** `packages/lib/src/csv-export.ts`
- **Auth Helper:** `apps/web/lib/server-auth.ts`
- **Database Models:** `packages/db/schema.prisma`
- **Austrian Compliance:** `../spec.md` (parent spec)

---

**Last Updated:** October 16, 2025
