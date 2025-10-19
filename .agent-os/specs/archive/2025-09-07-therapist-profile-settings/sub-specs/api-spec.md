# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-09-07-therapist-profile-settings/spec.md

> Created: 2025-09-07
> Version: 1.0.0

## Endpoints

### GET /api/therapist/profile

**Purpose:** Retrieve complete therapist profile information including business details, settings, and completion status

**Authentication:** NextAuth session required, therapist ownership validated

**Parameters:** None (uses session therapist ID)

**Response:**
```json
{
  "therapist": {
    "id": "cuid123",
    "designation": "HEILMASSEUR",
    "vatStatus": "KLEINUNTERNEHMER", 
    "kleinunternehmer": true,
    "businessName": "Wellness Praxis Müller",
    "businessAddress": "Hauptstraße 123, 1010 Wien",
    "businessPhone": "+43 1 234 5678",
    "businessEmail": "praxis@mueller-wellness.at",
    "businessWebsite": "https://mueller-wellness.at",
    "uidNumber": "ATU12345678",
    "chamberRegistration": "WK-123456",
    "invoiceFooter": "Gesetzliche Berufsbezeichnung: Heilmasseur",
    "brandColor": "#2563eb",
    "logoUrl": null,
    "iban": "AT611904300234573201",
    "defaultReminderDays": 1,
    "enableEmailReminders": true,
    "enableSmsReminders": false,
    "profileCompletedAt": "2025-09-07T10:30:00Z",
    "updatedAt": "2025-09-07T14:22:00Z"
  },
  "completionPercentage": 85,
  "missingFields": ["logoUrl", "businessWebsite"]
}
```

**Errors:**
- `401 Unauthorized` - No valid session or therapist not found
- `500 Internal Server Error` - Database or server error

### PUT /api/therapist/profile

**Purpose:** Update therapist profile information with validation and encrypted storage for sensitive fields

**Authentication:** NextAuth session required, therapist ownership validated

**Parameters:** JSON body with partial therapist profile fields

**Request Body:**
```json
{
  "businessName": "Wellness Praxis Müller GmbH",
  "businessAddress": "Neuer Markt 456, 1010 Wien", 
  "businessPhone": "+43 1 234 9999",
  "businessEmail": "office@mueller-wellness.at",
  "businessWebsite": "https://mueller-wellness.at",
  "uidNumber": "ATU87654321",
  "vatStatus": "UST_20",
  "kleinunternehmer": false,
  "invoiceFooter": "Gesetzliche Berufsbezeichnung: Heilmasseur\nUID: ATU87654321",
  "brandColor": "#16a34a",
  "defaultReminderDays": 2,
  "enableEmailReminders": true,
  "enableSmsReminders": true
}
```

**Response:**
```json
{
  "success": true,
  "therapist": {
    // Updated therapist object with same structure as GET
  },
  "completionPercentage": 95,
  "missingFields": ["logoUrl"]
}
```

**Validation Rules:**
- `businessEmail`: Valid email format required
- `uidNumber`: Must match Austrian format `ATU[0-9]{8}` if provided
- `businessPhone`: Austrian phone number format validation
- `vatStatus`: Must be valid VatStatus enum value
- `brandColor`: Must be valid hex color code
- `defaultReminderDays`: Must be between 0 and 30

**Errors:**
- `400 Bad Request` - Validation errors with detailed field messages
- `401 Unauthorized` - No valid session or therapist not found  
- `500 Internal Server Error` - Database or encryption error

### GET /api/therapist/service-rate-templates

**Purpose:** Retrieve all service rate templates for the authenticated therapist, grouped by category

**Authentication:** NextAuth session required, therapist ownership validated

**Parameters:** 
- `category` (optional): Filter templates by ServiceCategory
- `active` (optional): Filter by active status (default: true)

**Response:**
```json
{
  "templates": [
    {
      "id": "template123",
      "name": "Standard Massage 60min",
      "category": "MASSAGE", 
      "durationMin": 60,
      "priceCents": 8000,
      "vatRate": "KLEINUNTERNEHMER",
      "description": "Entspannungsmassage mit Aromaöl",
      "isDefault": true,
      "active": true,
      "createdAt": "2025-09-07T10:00:00Z",
      "updatedAt": "2025-09-07T14:15:00Z"
    },
    {
      "id": "template124", 
      "name": "Kurzmassage 30min",
      "category": "MASSAGE",
      "durationMin": 30,
      "priceCents": 5000,
      "vatRate": "KLEINUNTERNEHMER",
      "description": "Schnelle Entspannung für zwischendurch",
      "isDefault": false,
      "active": true,
      "createdAt": "2025-09-07T10:05:00Z",
      "updatedAt": "2025-09-07T10:05:00Z"
    }
  ],
  "categorySummary": {
    "MASSAGE": {
      "count": 2,
      "defaultTemplate": "template123"
    }
  }
}
```

**Errors:**
- `401 Unauthorized` - No valid session or therapist not found
- `500 Internal Server Error` - Database error

### POST /api/therapist/service-rate-templates

**Purpose:** Create a new service rate template for the authenticated therapist

**Authentication:** NextAuth session required, therapist ownership validated

**Request Body:**
```json
{
  "name": "Premium Massage 90min",
  "category": "MASSAGE",
  "durationMin": 90,
  "priceCents": 12000,
  "vatRate": "KLEINUNTERNEHMER", 
  "description": "Luxus-Massage mit Hot Stone Elements",
  "isDefault": false
}
```

**Response:**
```json
{
  "success": true,
  "template": {
    "id": "template125",
    "therapistId": "therapist123",
    "name": "Premium Massage 90min",
    "category": "MASSAGE",
    "durationMin": 90,
    "priceCents": 12000,
    "vatRate": "KLEINUNTERNEHMER",
    "description": "Luxus-Massage mit Hot Stone Elements", 
    "isDefault": false,
    "active": true,
    "createdAt": "2025-09-07T15:30:00Z",
    "updatedAt": "2025-09-07T15:30:00Z"
  }
}
```

**Validation Rules:**
- `name`: Required, 1-100 characters
- `category`: Must be valid ServiceCategory enum value
- `durationMin`: Required, must be positive integer (15-480 minutes)
- `priceCents`: Required, must be positive integer (minimum 100 = €1.00)
- `vatRate`: Must be valid VatStatus enum value
- `description`: Optional, max 500 characters

**Errors:**
- `400 Bad Request` - Validation errors with detailed field messages
- `401 Unauthorized` - No valid session or therapist not found
- `500 Internal Server Error` - Database error

### PUT /api/therapist/service-rate-templates/[id]

**Purpose:** Update an existing service rate template

**Authentication:** NextAuth session required, template ownership validated

**Parameters:** 
- `id`: Template ID in URL path

**Request Body:** Same structure as POST, all fields optional

**Response:** Same structure as POST with updated template data

**Errors:**
- `400 Bad Request` - Validation errors
- `401 Unauthorized` - No valid session or not template owner
- `404 Not Found` - Template not found or not owned by therapist
- `500 Internal Server Error` - Database error

### DELETE /api/therapist/service-rate-templates/[id]

**Purpose:** Soft delete a service rate template (sets active = false)

**Authentication:** NextAuth session required, template ownership validated

**Parameters:**
- `id`: Template ID in URL path

**Response:**
```json
{
  "success": true,
  "message": "Service rate template deactivated successfully"
}
```

**Errors:**
- `401 Unauthorized` - No valid session or not template owner
- `404 Not Found` - Template not found or not owned by therapist
- `500 Internal Server Error` - Database error

## Controllers

### Profile Controller (`/api/therapist/profile`)

**Key Functions:**
- `getTherapistProfile()` - Retrieves profile with decryption of sensitive fields
- `updateTherapistProfile()` - Updates profile with encryption and audit logging
- `calculateCompletionPercentage()` - Determines profile completeness based on required fields
- `validateAustrianCompliance()` - Ensures UID format and VAT status consistency

**Business Rules:**
- Profile completion calculation considers essential fields for Austrian compliance
- Sensitive fields (UID, IBAN) use libsodium encryption before database storage
- Profile updates trigger `updatedAt` timestamp and audit log entries
- VAT status changes validate against Austrian business regulations

### Service Rate Template Controller

**Key Functions:**
- `getServiceRateTemplates()` - Retrieves templates with category filtering and default identification
- `createServiceRateTemplate()` - Creates new template with validation and default management
- `updateServiceRateTemplate()` - Updates template with ownership verification
- `deleteServiceRateTemplate()` - Soft deletes template while preserving historical data

**Business Rules:**
- Only one default template per category per therapist allowed
- Setting new default automatically unsets previous default in same category  
- Soft deletion preserves templates referenced in historical invoices
- Template pricing must align with therapist's configured VAT status

### Authentication and Authorization

**Session Validation:**
- All endpoints require valid NextAuth session with therapist relationship
- Therapist ID extracted from session user and validated against database
- Automatic creation of Therapist record if missing (handles first-time users)

**Ownership Verification:**
- Profile endpoints verify session therapist matches requested profile
- Template endpoints verify session therapist owns the requested template
- Cross-therapist access blocked with 401 Unauthorized response

**Audit Trail Integration:**
- Profile changes logged to existing AuditLog system with action type and field changes
- Template operations logged for compliance and business analytics
- Sensitive field changes logged without exposing encrypted values

## Integration Points

### Invoice Generation System

**Rate Template Integration:**
- Modified invoice creation API suggests rates from default templates based on selected service category
- Invoice line item creation pre-populates with template pricing and VAT rates  
- Template selection maintains link to original template for rate change tracking

**Business Profile Integration:**
- Existing PDF generation modified to include business name, address, and compliance information
- Invoice footer automatically includes therapist designation and legal notices
- Austrian UID number and VAT status properly formatted in invoice templates

### Service Management Integration

**Service Creation Enhancement:**
- New service creation suggests default values from rate templates
- Bulk service creation from templates with category-based defaults
- Template changes optionally propagate to associated services

**Existing API Compatibility:**
- Current service endpoints remain unchanged to maintain backward compatibility
- Additional endpoints provide template integration without breaking existing workflows
- Service model retains individual pricing while supporting template-based defaults