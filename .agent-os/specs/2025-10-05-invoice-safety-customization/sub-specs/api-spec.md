# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-10-05-invoice-safety-customization/spec.md

> Created: 2025-10-05
> Version: 1.0.0

## API Endpoints

### 1. GET /api/compliance/revenue-status

**Description:** Calculate and return current year revenue status for Kleinunternehmer threshold monitoring.

**Authentication:** Required (NextAuth session)

**Rate Limit:** 100 requests/minute per therapist

**Request:**
```http
GET /api/compliance/revenue-status HTTP/1.1
Host: myoflow.com
Cookie: next-auth.session-token=...
```

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `forceRefresh` | boolean | No | false | Bypass cache and recalculate |

**Response (200 OK):**
```json
{
  "currentYearRevenue": 42500.00,
  "currentYearRevenueCents": 4250000,
  "thresholdPercentage": 77.27,
  "threshold": 55000,
  "thresholdCents": 5500000,
  "isApproaching": true,
  "isCritical": false,
  "year": 2025,
  "lastCalculatedAt": "2025-10-05T10:30:00.000Z",
  "fromCache": true
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `currentYearRevenue` | number | Revenue in euros (float) |
| `currentYearRevenueCents` | number | Revenue in cents (integer) |
| `thresholdPercentage` | number | Percentage of €55k threshold |
| `threshold` | number | Threshold amount in euros (55000) |
| `thresholdCents` | number | Threshold in cents (5500000) |
| `isApproaching` | boolean | True when ≥70% of threshold |
| `isCritical` | boolean | True when ≥90% of threshold |
| `year` | number | Current year |
| `lastCalculatedAt` | string | ISO 8601 timestamp of calculation |
| `fromCache` | boolean | Whether result came from cache |

**Error Responses:**

```json
// 401 Unauthorized
{
  "error": "Unauthorized",
  "code": "AUTH_REQUIRED",
  "timestamp": "2025-10-05T10:30:00.000Z"
}

// 500 Internal Server Error
{
  "error": "Failed to calculate revenue status",
  "code": "CALCULATION_ERROR",
  "timestamp": "2025-10-05T10:30:00.000Z"
}
```

**Cache Behavior:**
- Results cached in database for 24 hours
- `forceRefresh=true` bypasses cache and recalculates
- Cache automatically invalidated on invoice create/update

**Example Usage:**
```typescript
// Client-side fetch
const response = await fetch('/api/compliance/revenue-status')
const data = await response.json()

if (data.isApproaching) {
  showWarning('You are approaching the Kleinunternehmer threshold')
}

// Force refresh after creating invoice
const refreshedData = await fetch('/api/compliance/revenue-status?forceRefresh=true')
```

---

### 2. PUT /api/settings/invoice-branding

**Description:** Update invoice branding settings (logo, display preference, thank you message).

**Authentication:** Required (NextAuth session)

**Rate Limit:** 60 requests/minute per therapist

**Request:**
```http
PUT /api/settings/invoice-branding HTTP/1.1
Host: myoflow.com
Cookie: next-auth.session-token=...
Content-Type: application/json

{
  "logoUrl": "https://storage.myoflow.com/logos/abc123/logo.png",
  "displayPreference": "BOTH",
  "thankYouMessage": "Vielen Dank für Ihr Vertrauen!"
}
```

**Request Body Schema:**
```typescript
{
  logoUrl?: string | null,          // Valid HTTPS URL or null
  displayPreference?: 'LOGO' | 'NAME' | 'BOTH',
  thankYouMessage?: string | null   // Max 500 characters
}
```

**Request Body Validation:**
```typescript
import { z } from 'zod'

const InvoiceBrandingSchema = z.object({
  logoUrl: z.string().url().nullable().optional()
    .refine(url => !url || url.startsWith('https://'), {
      message: 'Logo URL must use HTTPS'
    }),
  displayPreference: z.enum(['LOGO', 'NAME', 'BOTH']).optional(),
  thankYouMessage: z.string().max(500).nullable().optional()
})
```

**Response (200 OK):**
```json
{
  "invoiceLogoUrl": "https://storage.myoflow.com/logos/abc123/logo.png",
  "invoiceDisplayPreference": "BOTH",
  "invoiceThankYouMessage": "Vielen Dank für Ihr Vertrauen!"
}
```

**Error Responses:**

```json
// 400 Bad Request (Validation Error)
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "thankYouMessage",
      "message": "String must contain at most 500 character(s)"
    }
  ],
  "timestamp": "2025-10-05T10:30:00.000Z"
}

// 401 Unauthorized
{
  "error": "Unauthorized",
  "code": "AUTH_REQUIRED",
  "timestamp": "2025-10-05T10:30:00.000Z"
}

// 500 Internal Server Error
{
  "error": "Failed to update invoice branding",
  "code": "UPDATE_ERROR",
  "timestamp": "2025-10-05T10:30:00.000Z"
}
```

**Example Usage:**
```typescript
// Update logo and display preference
const response = await fetch('/api/settings/invoice-branding', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    logoUrl: 'https://storage.myoflow.com/logos/abc123/logo.png',
    displayPreference: 'LOGO'
  })
})

const updated = await response.json()
console.log('Updated branding:', updated)
```

---

### 3. POST /api/upload/invoice-logo

**Description:** Upload practice logo image for invoices.

**Authentication:** Required (NextAuth session)

**Rate Limit:** 10 requests/minute per therapist

**Request:**
```http
POST /api/upload/invoice-logo HTTP/1.1
Host: myoflow.com
Cookie: next-auth.session-token=...
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="logo.png"
Content-Type: image/png

[binary image data]
------WebKitFormBoundary--
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | Logo image (PNG, JPG, SVG) |

**File Validation:**
- **Allowed MIME types:** `image/png`, `image/jpeg`, `image/svg+xml`
- **Max file size:** 2MB (2,097,152 bytes)
- **Recommended dimensions:** 800x200px (4:1 ratio)
- **Max dimensions:** 1200x300px

**Response (200 OK):**
```json
{
  "success": true,
  "logoUrl": "https://storage.myoflow.com/logos/therapist-abc123/1728123456-logo.png",
  "metadata": {
    "width": 800,
    "height": 200,
    "format": "png",
    "size": 145632
  }
}
```

**Error Responses:**

```json
// 400 Bad Request (Invalid File Type)
{
  "error": "Invalid file type",
  "code": "INVALID_FILE_TYPE",
  "details": {
    "allowedTypes": ["image/png", "image/jpeg", "image/svg+xml"],
    "receivedType": "image/gif"
  },
  "timestamp": "2025-10-05T10:30:00.000Z"
}

// 413 Payload Too Large
{
  "error": "File too large",
  "code": "FILE_TOO_LARGE",
  "details": {
    "maxSizeBytes": 2097152,
    "receivedSizeBytes": 3145728
  },
  "timestamp": "2025-10-05T10:30:00.000Z"
}

// 401 Unauthorized
{
  "error": "Unauthorized",
  "code": "AUTH_REQUIRED",
  "timestamp": "2025-10-05T10:30:00.000Z"
}

// 500 Internal Server Error
{
  "error": "Upload failed",
  "code": "UPLOAD_ERROR",
  "details": {
    "reason": "Storage service unavailable"
  },
  "timestamp": "2025-10-05T10:30:00.000Z"
}
```

**Processing Pipeline:**
1. Validate file type and size
2. Optimize image using Sharp (resize, compress)
3. Generate unique filename: `{timestamp}-{original-name}`
4. Upload to storage (Vercel Blob or AWS S3)
5. Return public URL
6. *Optional:* Automatically update therapist.invoiceLogoUrl

**Example Usage:**
```typescript
// Client-side upload
const formData = new FormData()
formData.append('file', logoFile)

const response = await fetch('/api/upload/invoice-logo', {
  method: 'POST',
  body: formData
})

const result = await response.json()

if (result.success) {
  // Update branding settings with new logo URL
  await fetch('/api/settings/invoice-branding', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      logoUrl: result.logoUrl,
      displayPreference: 'LOGO'
    })
  })
}
```

---

### 4. GET /api/compliance/checklist

**Description:** Return compliance checklist with readiness score and validation status.

**Authentication:** Required (NextAuth session)

**Rate Limit:** 100 requests/minute per therapist

**Request:**
```http
GET /api/compliance/checklist HTTP/1.1
Host: myoflow.com
Cookie: next-auth.session-token=...
```

**Response (200 OK):**
```json
{
  "taxValidated": false,
  "taxValidatedAt": null,
  "taxValidatedBy": null,
  "invoiceBrandingConfigured": true,
  "vatRatesReviewed": true,
  "revenueMonitoringActive": true,
  "taxAdvisorConfigured": false,
  "readinessScore": 60,
  "warnings": [
    "Invoice settings not professionally validated",
    "Tax advisor contact information missing"
  ],
  "errors": []
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `taxValidated` | boolean | Whether settings validated by professional |
| `taxValidatedAt` | string \| null | ISO 8601 timestamp of validation |
| `taxValidatedBy` | string \| null | Validator name/email |
| `invoiceBrandingConfigured` | boolean | Has logo or custom message |
| `vatRatesReviewed` | boolean | Has at least one active service |
| `revenueMonitoringActive` | boolean | Revenue cache exists |
| `taxAdvisorConfigured` | boolean | Tax advisor info present |
| `readinessScore` | number | Percentage score (0-100) |
| `warnings` | string[] | Non-critical issues |
| `errors` | string[] | Critical issues requiring action |

**Readiness Score Calculation:**
```typescript
const criteria = [
  taxValidated,                    // 20 points
  invoiceBrandingConfigured,       // 20 points
  vatRatesReviewed,                // 20 points
  revenueMonitoringActive,         // 20 points
  taxAdvisorConfigured             // 20 points
]

readinessScore = (criteria.filter(Boolean).length / criteria.length) * 100
```

**Error Responses:**

```json
// 401 Unauthorized
{
  "error": "Unauthorized",
  "code": "AUTH_REQUIRED",
  "timestamp": "2025-10-05T10:30:00.000Z"
}

// 500 Internal Server Error
{
  "error": "Failed to fetch compliance checklist",
  "code": "CHECKLIST_ERROR",
  "timestamp": "2025-10-05T10:30:00.000Z"
}
```

**Example Usage:**
```typescript
// Fetch compliance status
const response = await fetch('/api/compliance/checklist')
const checklist = await response.json()

// Display warnings
if (checklist.warnings.length > 0) {
  showNotification('Compliance Warnings', checklist.warnings)
}

// Calculate progress
const progress = checklist.readinessScore
updateProgressBar(progress)
```

---

### 5. POST /api/compliance/mark-validated

**Description:** Mark invoice settings as professionally validated (admin/tax advisor only).

**Authentication:** Required (NextAuth session + ADMIN role)

**Authorization:** Requires `session.user.role` in `['SUPER_ADMIN', 'SUPPORT', 'ACCOUNTANT']`

**Rate Limit:** 20 requests/minute per user

**Request:**
```http
POST /api/compliance/mark-validated HTTP/1.1
Host: myoflow.com
Cookie: next-auth.session-token=...
Content-Type: application/json

{
  "therapistId": "therapist-abc123",
  "validatedBy": "Tax Advisor Name <advisor@example.com>",
  "notes": "Reviewed invoice settings and confirmed compliance with Austrian tax law."
}
```

**Request Body Schema:**
```typescript
{
  therapistId: string,              // Required
  validatedBy: string,              // Required (name or email)
  notes?: string                    // Optional (max 1000 chars)
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "therapist": {
    "id": "therapist-abc123",
    "taxValidationStatus": true,
    "taxValidatedAt": "2025-10-05T10:30:00.000Z",
    "taxValidatedBy": "Tax Advisor Name <advisor@example.com>"
  },
  "auditLog": {
    "id": "audit-xyz789",
    "action": "TAX_VALIDATION_MARKED",
    "timestamp": "2025-10-05T10:30:00.000Z"
  }
}
```

**Error Responses:**

```json
// 401 Unauthorized
{
  "error": "Unauthorized",
  "code": "AUTH_REQUIRED",
  "timestamp": "2025-10-05T10:30:00.000Z"
}

// 403 Forbidden (Insufficient Permissions)
{
  "error": "Insufficient permissions",
  "code": "FORBIDDEN",
  "details": {
    "requiredRoles": ["SUPER_ADMIN", "SUPPORT", "ACCOUNTANT"],
    "userRole": "OWNER"
  },
  "timestamp": "2025-10-05T10:30:00.000Z"
}

// 404 Not Found
{
  "error": "Therapist not found",
  "code": "THERAPIST_NOT_FOUND",
  "timestamp": "2025-10-05T10:30:00.000Z"
}
```

**Audit Logging:**
```typescript
// Automatically logs to AuditLog table
{
  actorUserId: session.user.id,
  therapistId: therapistId,
  entity: 'Therapist',
  entityId: therapistId,
  action: 'TAX_VALIDATION_MARKED',
  at: new Date(),
  ip: request.ip,
  meta: {
    validatedBy: validatedBy,
    notes: notes,
    previousStatus: false,
    newStatus: true
  }
}
```

**Example Usage:**
```typescript
// Admin marking therapist as validated
const response = await fetch('/api/compliance/mark-validated', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    therapistId: 'therapist-abc123',
    validatedBy: 'John Doe <john@taxadvisor.at>',
    notes: 'All invoice settings reviewed and approved.'
  })
})

const result = await response.json()

if (result.success) {
  showNotification('Tax validation recorded successfully')
}
```

---

## API Authentication

### Authentication Flow

**All endpoints require valid NextAuth session:**

1. Client sends request with session cookie
2. Server calls `auth()` helper to verify session
3. Server calls `requireTherapist(userId)` to get therapist record
4. Endpoint proceeds with authenticated therapist context

**Example Implementation:**
```typescript
// apps/web/app/api/compliance/revenue-status/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { requireTherapist } from '@/lib/require-therapist'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
      { status: 401 }
    )
  }

  const therapist = await requireTherapist(session.user.id)

  // Proceed with endpoint logic...
}
```

### Role-Based Authorization

**Admin-Only Endpoints:**
```typescript
// Check user role for admin endpoints
const ADMIN_ROLES = ['SUPER_ADMIN', 'SUPPORT', 'ACCOUNTANT']

if (!session.user.role || !ADMIN_ROLES.includes(session.user.role)) {
  return NextResponse.json(
    {
      error: 'Insufficient permissions',
      code: 'FORBIDDEN',
      details: {
        requiredRoles: ADMIN_ROLES,
        userRole: session.user.role
      }
    },
    { status: 403 }
  )
}
```

## API Rate Limiting

### Rate Limit Configuration

**Implemented using PostgreSQL-backed rate limiting:**

```typescript
// apps/web/lib/rate-limit.ts
import { prisma } from '@myoflow/db'

const RATE_LIMITS = {
  '/api/compliance/revenue-status': {
    maxRequests: 100,
    windowMs: 60000 // 1 minute
  },
  '/api/settings/invoice-branding': {
    maxRequests: 60,
    windowMs: 60000
  },
  '/api/upload/invoice-logo': {
    maxRequests: 10,
    windowMs: 60000
  },
  '/api/compliance/checklist': {
    maxRequests: 100,
    windowMs: 60000
  },
  '/api/compliance/mark-validated': {
    maxRequests: 20,
    windowMs: 60000
  }
}

export async function checkRateLimit(
  key: string,
  endpoint: string
): Promise<{ allowed: boolean; remaining: number }> {
  const config = RATE_LIMITS[endpoint]
  const windowStart = new Date(Date.now() - config.windowMs)

  // Count recent requests
  const count = await prisma.rateLimit.count({
    where: {
      key: `${endpoint}:${key}`,
      createdAt: { gte: windowStart }
    }
  })

  if (count >= config.maxRequests) {
    return { allowed: false, remaining: 0 }
  }

  // Log request
  await prisma.rateLimit.create({
    data: {
      key: `${endpoint}:${key}`,
      createdAt: new Date()
    }
  })

  return { allowed: true, remaining: config.maxRequests - count - 1 }
}
```

**Rate Limit Response Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1728123456
```

**429 Too Many Requests Response:**
```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "limit": 100,
    "windowMs": 60000,
    "retryAfter": 42
  },
  "timestamp": "2025-10-05T10:30:00.000Z"
}
```

## Error Handling

### Standardized Error Format

**All API errors follow consistent structure:**

```typescript
interface APIError {
  error: string           // Human-readable message
  code: string            // Machine-readable error code
  details?: any           // Optional error details
  timestamp: string       // ISO 8601 timestamp
}
```

### Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_REQUIRED` | 401 | No valid session found |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `INVALID_FILE_TYPE` | 400 | Uploaded file type not allowed |
| `FILE_TOO_LARGE` | 413 | File exceeds size limit |
| `THERAPIST_NOT_FOUND` | 404 | Therapist record not found |
| `CALCULATION_ERROR` | 500 | Revenue calculation failed |
| `UPDATE_ERROR` | 500 | Database update failed |
| `UPLOAD_ERROR` | 500 | File upload failed |
| `CHECKLIST_ERROR` | 500 | Checklist generation failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |

### Error Logging

**All errors logged to console with context:**

```typescript
console.error('API Error', {
  endpoint: request.url,
  method: request.method,
  error: error.message,
  stack: error.stack,
  userId: session?.user.id,
  therapistId: therapist?.id,
  timestamp: new Date().toISOString()
})
```

## API Versioning

**Current Version:** v1 (implicit)

**Future Versioning Strategy:**
- URL-based versioning: `/api/v2/compliance/revenue-status`
- Maintain v1 endpoints for backwards compatibility
- Deprecation notices in response headers

**Version Headers:**
```http
X-API-Version: 1.0.0
X-API-Deprecated: false
```

## CORS & Security

### CORS Configuration
```typescript
// Next.js API routes - CORS handled by framework
// Same-origin only (no CORS headers needed)
```

### Security Headers
```typescript
// Applied to all API responses
headers: {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
}
```

### Request Validation
- All request bodies validated with Zod schemas
- File uploads scanned for malware (production)
- SQL injection prevention via Prisma ORM
- XSS prevention via automatic escaping
