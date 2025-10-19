# API Specification: Invoice PDF + CSV Exports

## PDF Generation Endpoint

### GET /api/files/invoice/[id].pdf

**Description:** Generate and return Austrian-compliant PDF invoice

**Authentication:** NextAuth session required, OWNER/STAFF role

**Parameters:**
- `id` (path): Invoice UUID

**Request Headers:**
- `If-None-Match`: ETag value for caching (optional)
- `Authorization`: Session cookie

**Success Response (200):**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="Rechnung-2025-001.pdf"
ETag: "invoice-abc123-1725724800000"
Last-Modified: Sat, 07 Sep 2025 14:30:00 GMT
Cache-Control: private, max-age=300
Content-Length: [size in bytes]

[PDF binary data]
```

**Not Modified Response (304):**
```
ETag: "invoice-abc123-1725724800000"
Last-Modified: Sat, 07 Sep 2025 14:30:00 GMT
```

**Error Responses:**
- `400 Bad Request`: Invalid invoice ID format
- `403 Forbidden`: User lacks permission to access this invoice
- `404 Not Found`: Invoice does not exist
- `500 Internal Server Error`: PDF generation failed

## CSV Export Endpoints

### GET /api/exports/invoices.csv

**Description:** Export invoices for accounting software import

**Authentication:** NextAuth session required, OWNER/ACCOUNTANT role

**Query Parameters:**
- `month` (required): YYYY-MM format
- `status` (optional): DRAFT|SENT|PAID|VOID (default: SENT,PAID)

**Success Response (200):**
```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="rechnungen-2025-09.csv"

Datum,Belegnummer,Kunde,Leistung,Netto,USt-Satz,USt-Betrag,Brutto,Zahlart,Ort
2025-09-01,2025-001,Maria Mustermann,Klassische Massage,6000,20,1200,7200,SEPA,Praxis
```

### GET /api/exports/cash.csv

**Description:** Export cash transactions for daily/monthly reporting

**Authentication:** NextAuth session required, OWNER/ACCOUNTANT role

**Query Parameters:**
- `period` (required): "daily" | "monthly"
- `date` (required): YYYY-MM-DD format

**Success Response (200):**
```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="kasse-2025-09-07.csv"

Datum,Zeit,Betrag,Zahlart,Belegnummer
2025-09-07,14:30,7200,BAR,2025-001
2025-09-07,16:15,9000,BAR,2025-002
```

## Common Error Responses

**400 Bad Request:**
```json
{
  "error": "INVALID_PARAMETER",
  "message": "Month parameter must be in YYYY-MM format",
  "code": "INVALID_DATE_FORMAT"
}
```

**403 Forbidden:**
```json
{
  "error": "ACCESS_DENIED", 
  "message": "Insufficient permissions for this resource",
  "code": "ROLE_REQUIRED"
}
```

**422 Unprocessable Entity:**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invoice missing required therapist data",
  "code": "INCOMPLETE_DATA"
}
```

**500 Internal Server Error:**
```json
{
  "error": "GENERATION_FAILED",
  "message": "PDF generation service temporarily unavailable",
  "code": "PUPPETEER_TIMEOUT"
}
```

## Rate Limiting

- PDF Generation: 30 requests per minute per user
- CSV Exports: 10 requests per minute per user
- Burst allowance: 5 additional requests per endpoint

## Caching Behavior

### PDF Caching
- Client-side: ETag support for 304 responses
- Server-side: No caching (always fresh from database)
- CDN: Not applicable (private content)

### CSV Caching
- No caching (always fresh data)
- Streaming for large datasets
- Memory-efficient processing