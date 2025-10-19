# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-09-27-appointment-reminders/spec.md

> Created: 2025-09-27
> Version: 1.0.0

## Endpoints

### POST /api/reminders/configure

**Purpose:** Configure reminder settings for therapist practice
**Parameters:**
- `enableEmailReminders: boolean`
- `reminderTimings: string[]` (e.g., ["24h", "2h"])
- `customTemplate?: string`
**Response:** `{ success: boolean, settings: ReminderSettings }`
**Errors:** 400 (Invalid timing format), 401 (Unauthorized)

### POST /api/reminders/schedule

**Purpose:** Schedule reminders for specific appointment (triggered on appointment creation/update)
**Parameters:**
- `appointmentId: string`
- `clientEmail: string`
- `scheduledTime: DateTime`
**Response:** `{ success: boolean, reminderIds: string[] }`
**Errors:** 400 (Invalid appointment), 404 (Appointment not found)

### POST /api/reminders/confirm/:token

**Purpose:** Handle appointment confirmation from email link
**Parameters:**
- `token: string` (URL parameter)
- `confirmed: boolean` (body)
**Response:** `{ success: boolean, appointment: Appointment }`
**Errors:** 400 (Invalid/expired token), 404 (Appointment not found)

### POST /api/reminders/reschedule/:token

**Purpose:** Handle reschedule request from email link
**Parameters:**
- `token: string` (URL parameter)
- `preferredTimes: DateTime[]` (body)
**Response:** `{ success: boolean, rescheduleRequestId: string }`
**Errors:** 400 (Invalid token), 422 (No available slots)

### GET /api/reminders/status/:appointmentId

**Purpose:** Get reminder delivery status for appointment
**Parameters:** `appointmentId: string`
**Response:** `{ reminders: ReminderStatus[], deliveryRate: number }`
**Errors:** 404 (Appointment not found), 401 (Unauthorized)

### POST /api/reminders/unsubscribe/:token

**Purpose:** Handle email unsubscribe requests (GDPR compliance)
**Parameters:** `token: string` (encrypted client email)
**Response:** `{ success: boolean, message: string }`
**Errors:** 400 (Invalid token)

## Controllers

### ReminderConfigurationController
- Handles reminder settings CRUD operations
- Validates timing formats (24h, 2h, 30m patterns)
- Manages template customization and Austrian locale defaults

### ReminderSchedulingController
- Orchestrates reminder job creation via background queue
- Calculates delivery times based on appointment + timing offsets
- Handles appointment lifecycle events (create/update/cancel)

### ReminderDeliveryController
- Processes reminder email sending
- Tracks delivery status and bounce handling
- Implements retry logic for failed deliveries

### ReminderResponseController
- Handles client responses (confirm/reschedule/unsubscribe)
- Validates secure tokens and manages token expiration
- Updates appointment status based on client actions