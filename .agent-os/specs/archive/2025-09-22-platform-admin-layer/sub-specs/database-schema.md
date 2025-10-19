# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-09-22-platform-admin-layer/spec.md

> Created: 2025-09-22
> Version: 1.0.0

## Schema Changes

### 1. Extend Role Enum

```prisma
enum Role {
  OWNER
  STAFF
  ACCOUNTANT
  AFFILIATE
  SUPER_ADMIN      // New: Platform super administrator
  SUPPORT          // New: Customer support role
  FINANCE          // New: Finance team role
}
```

**Rationale:** Extends existing role system to support platform administration hierarchy while maintaining current therapist practice roles.

### 2. Add AdminAuditLog Table

```prisma
model AdminAuditLog {
  id              String   @id @default(cuid())
  adminUserId     String   // Admin who performed the action
  adminUser       User     @relation("AdminAuditLogs", fields: [adminUserId], references: [id])
  targetUserId    String?  // Target user if applicable
  targetUser      User?    @relation("TargetAuditLogs", fields: [targetUserId], references: [id])
  action          String   // Action performed (LOGIN, IMPERSONATE, DISABLE_USER, etc.)
  details         Json?    // Additional action details
  reason          String?  // Reason provided by admin
  ipAddress       String?  // Admin IP address
  userAgent       String?  // Admin user agent
  sessionId       String?  // Admin session identifier
  impersonationId String?  // Impersonation session ID if applicable
  createdAt       DateTime @default(now())

  @@index([adminUserId])
  @@index([targetUserId])
  @@index([action])
  @@index([createdAt])
  @@map("admin_audit_logs")
}
```

**Rationale:** Comprehensive audit logging for Austrian GDPR Article 9 compliance and accountability. Tracks all admin actions with sufficient detail for regulatory requirements.

### 3. Add FeatureFlag Table

```prisma
model FeatureFlag {
  id          String   @id @default(cuid())
  name        String   @unique // Feature flag key (e.g., "new_calendar_ui")
  enabled     Boolean  @default(false)
  title       String   // Human-readable title
  description String?  // Description of the feature
  rolloutPercent Int?  @default(0) // Percentage rollout (0-100)
  targetRoles Json?    // Array of roles to target ["OWNER", "STAFF"]
  targetUsers Json?    // Array of user IDs to target
  startDate   DateTime? // When flag becomes active
  endDate     DateTime? // When flag expires
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdBy   String   // Admin user who created the flag
  creator     User     @relation("CreatedFeatureFlags", fields: [createdBy], references: [id])

  @@index([name])
  @@index([enabled])
  @@map("feature_flags")
}
```

**Rationale:** Enables controlled feature rollouts with sophisticated targeting. Supports percentage-based rollouts and role/user targeting for gradual feature deployment.

### 4. Add SystemAnnouncement Table

```prisma
model SystemAnnouncement {
  id          String   @id @default(cuid())
  title       String
  content     String   // Announcement text content
  type        AnnouncementType @default(INFO) // INFO, WARNING, MAINTENANCE, etc.
  active      Boolean  @default(false)
  startDate   DateTime? // When announcement becomes visible
  endDate     DateTime? // When announcement expires
  targetRoles Json?    // Array of roles to show announcement to
  dismissible Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdBy   String   // Admin user who created the announcement
  creator     User     @relation("CreatedAnnouncements", fields: [createdBy], references: [id])

  // Track which users have dismissed this announcement
  dismissals  AnnouncementDismissal[]

  @@index([active])
  @@index([startDate])
  @@index([endDate])
  @@map("system_announcements")
}

enum AnnouncementType {
  INFO
  WARNING
  MAINTENANCE
  FEATURE
  URGENT
}

model AnnouncementDismissal {
  id             String            @id @default(cuid())
  userId         String
  user           User             @relation("DismissedAnnouncements", fields: [userId], references: [id])
  announcementId String
  announcement   SystemAnnouncement @relation(fields: [announcementId], references: [id], onDelete: Cascade)
  dismissedAt    DateTime         @default(now())

  @@unique([userId, announcementId])
  @@map("announcement_dismissals")
}
```

**Rationale:** Provides system-wide communication channel for maintenance, features, and important updates. Tracks dismissals to avoid re-showing announcements.

### 5. Add AdminSession Table

```prisma
model AdminSession {
  id                String   @id @default(cuid())
  adminUserId       String
  adminUser         User     @relation("AdminSessions", fields: [adminUserId], references: [id])
  sessionToken      String   @unique
  ipAddress         String?
  userAgent         String?
  impersonatedUserId String? // If this session is impersonating another user
  impersonatedUser   User?   @relation("ImpersonatedSessions", fields: [impersonatedUserId], references: [id])
  impersonationReason String? // Reason for impersonation
  startedAt         DateTime @default(now())
  endedAt           DateTime?
  active            Boolean  @default(true)

  @@index([adminUserId])
  @@index([impersonatedUserId])
  @@index([sessionToken])
  @@index([active])
  @@map("admin_sessions")
}
```

**Rationale:** Enhanced session tracking for admin users, especially important for impersonation audit trails and security monitoring.

### 6. Update User Model Relations

```prisma
model User {
  // ... existing fields ...

  // Admin audit log relations
  adminAuditLogs     AdminAuditLog[] @relation("AdminAuditLogs")
  targetAuditLogs    AdminAuditLog[] @relation("TargetAuditLogs")

  // Feature flag relations
  createdFeatureFlags FeatureFlag[] @relation("CreatedFeatureFlags")

  // Announcement relations
  createdAnnouncements SystemAnnouncement[] @relation("CreatedAnnouncements")
  dismissedAnnouncements AnnouncementDismissal[] @relation("DismissedAnnouncements")

  // Admin session relations
  adminSessions      AdminSession[] @relation("AdminSessions")
  impersonatedSessions AdminSession[] @relation("ImpersonatedSessions")
}
```

## Migration Strategy

1. **Add new Role enum values** - Backwards compatible addition
2. **Create new tables** - No impact on existing data
3. **Seed initial admin user** - Environment variable driven
4. **Add indices** - Improve query performance for admin operations

## Performance Considerations

- AdminAuditLog table will grow over time - implement archiving strategy after 2 years
- Feature flag evaluation should be cached for performance
- User queries for admin dashboard should use appropriate pagination
- Announcement queries should filter by active status and date ranges efficiently

## Data Integrity

- Foreign key relationships ensure referential integrity
- Cascade deletes for announcement dismissals when announcements are deleted
- Audit logs are preserved even if target users are deleted (nullable relation)
- Admin sessions track impersonation chains for complete audit trails