# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-09-07-user-settings-dashboard/spec.md

> Created: 2025-09-07
> Version: 1.0.0

## Authentication

All endpoints require authentication via NextAuth.js session. The user's session must contain a valid `userId` and `therapistId`.

### Headers
```
Authorization: Bearer <session-token>
Content-Type: application/json
```

## Profile Management Endpoints

### GET /api/user/profile
Get current user's profile information.

**Response 200:**
```json
{
  "id": "string",
  "email": "string",
  "name": "string",
  "avatar": "string|null",
  "createdAt": "string",
  "updatedAt": "string",
  "therapist": {
    "id": "string",
    "title": "DR|MAG|PROF|null",
    "firstName": "string",
    "lastName": "string",
    "phone": "string|null",
    "address": "string|null",
    "city": "string|null",
    "postalCode": "string|null",
    "taxNumber": "string|null",
    "isKleinunternehmer": "boolean",
    "businessLogo": "string|null"
  }
}
```

### PUT /api/user/profile
Update user profile information.

**Request Body:**
```json
{
  "name": "string",
  "therapist": {
    "title": "DR|MAG|PROF|null",
    "firstName": "string",
    "lastName": "string",
    "phone": "string|null",
    "address": "string|null",
    "city": "string|null",
    "postalCode": "string|null",
    "taxNumber": "string|null"
  }
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    // Updated profile object
  }
}
```

## Business Settings Endpoints

### GET /api/user/business-settings
Get business configuration settings.

**Response 200:**
```json
{
  "therapist": {
    "id": "string",
    "isKleinunternehmer": "boolean",
    "vatRate": "number",
    "invoicePrefix": "string",
    "nextInvoiceNumber": "number",
    "businessLogo": "string|null",
    "businessHours": {
      "monday": { "start": "09:00", "end": "17:00", "enabled": true },
      "tuesday": { "start": "09:00", "end": "17:00", "enabled": true },
      "wednesday": { "start": "09:00", "end": "17:00", "enabled": true },
      "thursday": { "start": "09:00", "end": "17:00", "enabled": true },
      "friday": { "start": "09:00", "end": "17:00", "enabled": true },
      "saturday": { "start": "09:00", "end": "13:00", "enabled": false },
      "sunday": { "start": "09:00", "end": "13:00", "enabled": false }
    }
  }
}
```

### PUT /api/user/business-settings
Update business configuration settings.

**Request Body:**
```json
{
  "isKleinunternehmer": "boolean",
  "vatRate": "number",
  "invoicePrefix": "string",
  "businessHours": {
    "monday": { "start": "09:00", "end": "17:00", "enabled": true },
    // ... other days
  }
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    // Updated business settings
  }
}
```

## Service Rate Template Endpoints

### GET /api/service-rates
Get all service rate templates for the authenticated therapist.

**Query Parameters:**
- `active` (boolean, optional): Filter by active status

**Response 200:**
```json
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string|null",
      "priceInCents": "number",
      "durationMinutes": "number",
      "isActive": "boolean",
      "category": "MASSAGE|CONSULTATION|THERAPY|OTHER",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ]
}
```

### POST /api/service-rates
Create a new service rate template.

**Request Body:**
```json
{
  "name": "string",
  "description": "string|null",
  "priceInCents": "number",
  "durationMinutes": "number",
  "category": "MASSAGE|CONSULTATION|THERAPY|OTHER",
  "isActive": "boolean"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "description": "string|null",
    "priceInCents": "number",
    "durationMinutes": "number",
    "isActive": "boolean",
    "category": "MASSAGE|CONSULTATION|THERAPY|OTHER",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

### GET /api/service-rates/[id]
Get a specific service rate template.

**Response 200:**
```json
{
  "data": {
    "id": "string",
    "name": "string",
    "description": "string|null",
    "priceInCents": "number",
    "durationMinutes": "number",
    "isActive": "boolean",
    "category": "MASSAGE|CONSULTATION|THERAPY|OTHER",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

### PUT /api/service-rates/[id]
Update a specific service rate template.

**Request Body:**
```json
{
  "name": "string",
  "description": "string|null",
  "priceInCents": "number",
  "durationMinutes": "number",
  "category": "MASSAGE|CONSULTATION|THERAPY|OTHER",
  "isActive": "boolean"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    // Updated service rate template
  }
}
```

### DELETE /api/service-rates/[id]
Delete a specific service rate template.

**Response 200:**
```json
{
  "success": true,
  "message": "Service rate template deleted successfully"
}
```

## File Upload Endpoints

### POST /api/upload/avatar
Upload user avatar image.

**Request:** Multipart form data
- `file`: Image file (max 5MB, jpg/png/webp)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "url": "string",
    "filename": "string"
  }
}
```

### POST /api/upload/business-logo
Upload business logo image.

**Request:** Multipart form data
- `file`: Image file (max 5MB, jpg/png/webp/svg)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "url": "string",
    "filename": "string"
  }
}
```

### DELETE /api/upload/[type]/[filename]
Delete uploaded file.

**Parameters:**
- `type`: "avatar" | "business-logo"
- `filename`: string

**Response 200:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

## Austrian Validation Endpoints

### POST /api/validate/tax-number
Validate Austrian tax number format.

**Request Body:**
```json
{
  "taxNumber": "string"
}
```

**Response 200:**
```json
{
  "valid": "boolean",
  "format": "UID|ATU|null",
  "message": "string|null"
}
```

### POST /api/validate/postal-code
Validate Austrian postal code and get city suggestions.

**Request Body:**
```json
{
  "postalCode": "string"
}
```

**Response 200:**
```json
{
  "valid": "boolean",
  "cities": ["string"],
  "bundesland": "string|null"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "string",
  "details": {
    "field": "string",
    "code": "VALIDATION_ERROR|INVALID_FORMAT|MISSING_REQUIRED"
  }
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Resource not found"
}
```

### 413 Payload Too Large
```json
{
  "error": "Payload Too Large",
  "message": "File size exceeds limit",
  "details": {
    "maxSize": "5MB",
    "receivedSize": "string"
  }
}
```

### 422 Unprocessable Entity
```json
{
  "error": "Unprocessable Entity",
  "message": "Validation failed",
  "details": [
    {
      "field": "string",
      "message": "string",
      "code": "string"
    }
  ]
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "requestId": "string"
}
```

## Rate Limiting

All API endpoints are subject to rate limiting:
- 100 requests per minute per IP address
- 1000 requests per hour per authenticated user
- File upload endpoints: 10 requests per minute

Rate limit headers included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1620000000
```

## Validation Rules

### Profile Data
- `name`: 1-100 characters, required
- `phone`: Austrian phone number format (+43 or 0)
- `postalCode`: 4-digit Austrian postal code
- `taxNumber`: Austrian UID (ATU) or tax number format
- `email`: Valid email format, unique

### Service Rate Templates
- `name`: 1-100 characters, required
- `priceInCents`: Positive integer, required
- `durationMinutes`: 15-480 minutes (15min to 8h)
- `description`: Max 500 characters

### File Uploads
- Avatar: Max 5MB, formats: jpg, png, webp
- Logo: Max 5MB, formats: jpg, png, webp, svg
- Filenames: Sanitized and UUID-prefixed