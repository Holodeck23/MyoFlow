# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-09-22-platform-admin-layer/spec.md

> Created: 2025-09-22
> Version: 1.0.0

## Admin Authentication Endpoints

### POST /api/admin/auth/signin

**Purpose:** Admin-specific authentication for platform administrators
**Parameters:**
- `email`: Admin email address
- `password`: Admin password
- `role`: Required admin role (SUPER_ADMIN, SUPPORT, FINANCE)
**Response:** Admin session token and user details
**Errors:** 401 Unauthorized, 403 Insufficient Role, 500 Server Error

### POST /api/admin/auth/signout

**Purpose:** Terminate admin session and audit log the signout
**Parameters:** None (uses session token)
**Response:** Success confirmation
**Errors:** 401 Unauthorized, 500 Server Error

## User Management Endpoints

### GET /api/admin/users

**Purpose:** List all therapist users with pagination and filtering
**Parameters:**
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20, max: 100)
- `search`: Search term for name/email
- `status`: Filter by user status (active, disabled, all)
- `role`: Filter by user role
**Response:** Paginated list of users with account details
**Errors:** 401 Unauthorized, 403 Forbidden, 500 Server Error

### GET /api/admin/users/[userId]

**Purpose:** Get detailed information about a specific therapist user
**Parameters:**
- `userId`: Target user ID
**Response:** Complete user profile including subscription, usage metrics, recent activity
**Errors:** 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Server Error

### PATCH /api/admin/users/[userId]/status

**Purpose:** Enable or disable a therapist user account
**Parameters:**
- `userId`: Target user ID
- `status`: 'active' or 'disabled'
- `reason`: Admin reason for status change
**Response:** Updated user status
**Errors:** 401 Unauthorized, 403 Forbidden, 404 Not Found, 400 Bad Request, 500 Server Error

### POST /api/admin/users/[userId]/reset-password

**Purpose:** Reset password for a therapist user
**Parameters:**
- `userId`: Target user ID
- `reason`: Admin reason for password reset
- `notifyUser`: Boolean to send reset email to user
**Response:** Password reset confirmation
**Errors:** 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Server Error

## Account Impersonation Endpoints

### POST /api/admin/impersonate/start

**Purpose:** Begin impersonating a therapist user account
**Parameters:**
- `targetUserId`: User ID to impersonate
- `reason`: Required reason for impersonation
**Response:** Impersonation session token and redirect URL
**Errors:** 401 Unauthorized, 403 Forbidden, 404 Not Found, 400 Bad Request, 500 Server Error

### POST /api/admin/impersonate/end

**Purpose:** End current impersonation session
**Parameters:** None (uses impersonation session context)
**Response:** Success confirmation and admin dashboard redirect
**Errors:** 401 Unauthorized, 400 Not Impersonating, 500 Server Error

### GET /api/admin/impersonate/status

**Purpose:** Check current impersonation status
**Parameters:** None
**Response:** Current impersonation details or null
**Errors:** 401 Unauthorized, 500 Server Error

## Analytics Endpoints

### GET /api/admin/analytics/overview

**Purpose:** Get high-level platform metrics and KPIs
**Parameters:**
- `period`: Time period (7d, 30d, 90d, 1y)
**Response:** User counts, revenue totals, growth metrics
**Errors:** 401 Unauthorized, 403 Forbidden, 500 Server Error

### GET /api/admin/analytics/revenue

**Purpose:** Get detailed revenue analytics from invoice data
**Parameters:**
- `period`: Time period for analysis
- `groupBy`: Grouping (day, week, month)
**Response:** Revenue data with time series and breakdowns
**Errors:** 401 Unauthorized, 403 Forbidden, 500 Server Error

### GET /api/admin/analytics/users

**Purpose:** Get user analytics and activity metrics
**Parameters:**
- `period`: Time period for analysis
- `metrics`: Specific metrics to include
**Response:** User activity, retention, and engagement metrics
**Errors:** 401 Unauthorized, 403 Forbidden, 500 Server Error

## Feature Flag Endpoints

### GET /api/admin/feature-flags

**Purpose:** List all feature flags with current status
**Parameters:** None
**Response:** Array of feature flags with configurations
**Errors:** 401 Unauthorized, 403 Forbidden, 500 Server Error

### POST /api/admin/feature-flags

**Purpose:** Create a new feature flag
**Parameters:**
- `name`: Unique feature flag name
- `title`: Human-readable title
- `description`: Feature description
- `enabled`: Initial enabled status
- `rolloutPercent`: Percentage rollout (0-100)
- `targetRoles`: Array of roles to target
**Response:** Created feature flag details
**Errors:** 401 Unauthorized, 403 Forbidden, 400 Bad Request, 409 Conflict, 500 Server Error

### PATCH /api/admin/feature-flags/[flagId]

**Purpose:** Update an existing feature flag
**Parameters:**
- `flagId`: Feature flag ID
- Update fields: `enabled`, `rolloutPercent`, `targetRoles`, `targetUsers`, etc.
**Response:** Updated feature flag details
**Errors:** 401 Unauthorized, 403 Forbidden, 404 Not Found, 400 Bad Request, 500 Server Error

### DELETE /api/admin/feature-flags/[flagId]

**Purpose:** Delete a feature flag
**Parameters:**
- `flagId`: Feature flag ID
**Response:** Deletion confirmation
**Errors:** 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Server Error

## System Announcement Endpoints

### GET /api/admin/announcements

**Purpose:** List all system announcements for admin management
**Parameters:**
- `status`: Filter by active/inactive status
**Response:** Array of announcements with details
**Errors:** 401 Unauthorized, 403 Forbidden, 500 Server Error

### POST /api/admin/announcements

**Purpose:** Create a new system announcement
**Parameters:**
- `title`: Announcement title
- `content`: Announcement content
- `type`: Announcement type (INFO, WARNING, MAINTENANCE, etc.)
- `startDate`: When to start showing
- `endDate`: When to stop showing
- `targetRoles`: Array of roles to show to
- `dismissible`: Whether users can dismiss
**Response:** Created announcement details
**Errors:** 401 Unauthorized, 403 Forbidden, 400 Bad Request, 500 Server Error

### PATCH /api/admin/announcements/[announcementId]

**Purpose:** Update an existing announcement
**Parameters:**
- `announcementId`: Announcement ID
- Update fields: `title`, `content`, `active`, `startDate`, `endDate`, etc.
**Response:** Updated announcement details
**Errors:** 401 Unauthorized, 403 Forbidden, 404 Not Found, 400 Bad Request, 500 Server Error

### DELETE /api/admin/announcements/[announcementId]

**Purpose:** Delete an announcement
**Parameters:**
- `announcementId`: Announcement ID
**Response:** Deletion confirmation
**Errors:** 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Server Error

## Audit Log Endpoints

### GET /api/admin/audit-logs

**Purpose:** Retrieve admin audit logs for compliance and monitoring
**Parameters:**
- `page`: Page number
- `limit`: Results per page
- `adminUserId`: Filter by admin user
- `targetUserId`: Filter by target user
- `action`: Filter by action type
- `startDate`: Filter from date
- `endDate`: Filter to date
**Response:** Paginated audit log entries
**Errors:** 401 Unauthorized, 403 Forbidden, 500 Server Error

### GET /api/admin/audit-logs/export

**Purpose:** Export audit logs for compliance reporting
**Parameters:**
- `format`: Export format (csv, json)
- `startDate`: Export from date
- `endDate`: Export to date
- `filters`: Additional filters
**Response:** Audit log export file
**Errors:** 401 Unauthorized, 403 Forbidden, 400 Bad Request, 500 Server Error

## Public Therapist Endpoints (for announcements and feature flags)

### GET /api/announcements/active

**Purpose:** Get active announcements for current therapist user
**Parameters:** None (uses user session)
**Response:** Array of active announcements not dismissed by user
**Errors:** 401 Unauthorized, 500 Server Error

### POST /api/announcements/[announcementId]/dismiss

**Purpose:** Dismiss an announcement for current user
**Parameters:**
- `announcementId`: Announcement to dismiss
**Response:** Dismissal confirmation
**Errors:** 401 Unauthorized, 404 Not Found, 500 Server Error

### GET /api/feature-flags/evaluate

**Purpose:** Evaluate feature flags for current user
**Parameters:**
- `flags`: Array of flag names to evaluate (optional)
**Response:** Object mapping flag names to boolean values
**Errors:** 401 Unauthorized, 500 Server Error

## Security & Compliance

- All admin endpoints require valid admin authentication and appropriate role permissions
- Comprehensive audit logging for all admin actions with GDPR Article 9 compliance
- Rate limiting applied to prevent abuse
- CSRF protection for state-changing operations
- Input validation using Zod schemas for all request parameters
- Impersonation sessions have automatic timeout and require re-authentication for sensitive operations