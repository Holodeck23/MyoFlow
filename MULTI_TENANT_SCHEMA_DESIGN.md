# Multi-Tenant Schema Design

## Overview
Converting MyoFlow from single-tenant (one therapist per instance) to multi-tenant (multiple therapists per organization) architecture.

## Schema Design

### Core Tenant Model

```prisma
model Organization {
  id                    String   @id @default(cuid())
  name                  String
  slug                  String   @unique
  domain                String?  @unique  // For custom domains
  plan                  Plan     @default(STARTER)
  subscriptionStatus    SubscriptionStatus @default(TRIAL)
  trialEndsAt          DateTime?
  stripeCustomerId     String?
  stripeSubscriptionId String?
  billingEmail         String
  businessAddress      String?
  businessPhone        String?
  businessWebsite      String?
  taxNumber            String?

  // Austrian specific
  kleinunternehmerOrg  Boolean  @default(false)  // Organization-level tax status
  vatNumber           String?   // EU VAT number for organizations

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  // Relationships
  Memberships         OrganizationMembership[]
  Therapists          Therapist[]
  Locations           Location[]
  Services            Service[]
  Settings            OrganizationSettings?
  AuditLogs          AuditLog[]

  @@index([slug])
  @@index([subscriptionStatus])
}

model OrganizationMembership {
  id             String              @id @default(cuid())
  organizationId String
  userId         String
  role           OrganizationRole
  permissions    Json?               // Fine-grained permissions
  invitedAt      DateTime?
  joinedAt       DateTime?
  invitedBy      String?
  status         MembershipStatus    @default(PENDING)

  createdAt      DateTime            @default(now())
  updatedAt      DateTime            @updatedAt

  Organization   Organization        @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  User           User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  InvitedBy      User?              @relation("MembershipInvites", fields: [invitedBy], references: [id])

  @@unique([organizationId, userId])
  @@index([organizationId, role])
  @@index([userId])
}

model OrganizationSettings {
  id                      String        @id @default(cuid())
  organizationId          String        @unique

  // Branding
  primaryColor           String?
  logoUrl                String?
  customDomain           String?

  // Scheduling
  defaultBookingWindow   Int           @default(30)    // days in advance
  enableOnlineBooking    Boolean       @default(true)
  requireApproval        Boolean       @default(false)

  // Notifications
  enableEmailReminders   Boolean       @default(true)
  enableSmsReminders     Boolean       @default(false)
  defaultReminderDays    Int           @default(1)

  // Business
  businessHours          Json?
  timezone               String        @default("Europe/Vienna")
  currency               String        @default("EUR")
  language               String        @default("de")

  // Compliance
  gdprSettings           Json?
  dataRetentionDays      Int           @default(2555)  // 7 years
  auditLogRetentionDays  Int           @default(2555)

  createdAt              DateTime      @default(now())
  updatedAt              DateTime      @updatedAt

  Organization           Organization  @relation(fields: [organizationId], references: [id], onDelete: Cascade)
}

enum OrganizationRole {
  OWNER        // Full access, billing, user management
  ADMIN        // Full access except billing
  THERAPIST    // Own clients + shared resources
  RECEPTIONIST // Scheduling, basic client info
  BILLING      // Invoices, payments only
  VIEWER       // Read-only access
}

enum MembershipStatus {
  PENDING
  ACTIVE
  SUSPENDED
  INACTIVE
}

enum Plan {
  STARTER    // 1-3 therapists
  PROFESSIONAL // 4-10 therapists
  ENTERPRISE   // 11+ therapists
}
```

### Updated Core Models

```prisma
// Updated User model
model User {
  id                     String     @id @default(cuid())
  email                  String     @unique
  name                   String?
  avatar                 String?

  // Remove single-tenant fields
  // role                   Role       @default(OWNER)  // REMOVED
  // trialStarted           DateTime?  // REMOVED - moved to Organization
  // trialEndsAt            DateTime?  // REMOVED - moved to Organization
  // subscriptionStatus     SubscriptionStatus // REMOVED - moved to Organization
  // stripeCustomerId       String?    // REMOVED - moved to Organization
  // stripeSubscriptionId   String?    // REMOVED - moved to Organization

  createdAt              DateTime   @default(now())
  updatedAt              DateTime   @updatedAt
  lastActiveAt           DateTime?

  // Auth fields
  password               String?
  emailVerified          DateTime?
  emailVerificationToken String?
  passwordResetToken     String?
  passwordResetExpires   DateTime?

  // Multi-tenant relationships
  Memberships            OrganizationMembership[]
  InvitedMemberships     OrganizationMembership[] @relation("MembershipInvites")
  Therapists             Therapist[]              // User can be therapist in multiple orgs

  @@index([email])
  @@index([emailVerificationToken])
  @@index([passwordResetToken])
}

// Updated Therapist model
model Therapist {
  id                         String                 @id @default(cuid())
  organizationId             String                 // NEW: Multi-tenant scope
  userId                     String                 // Can belong to multiple orgs
  slug                       String                 // Unique within organization

  designation                TherapistDesignation
  vatStatus                  VatStatus
  kleinunternehmer           Boolean                @default(true)

  // Individual therapist data (not org-shared)
  personalSettings           Json?
  profileCompletedAt         DateTime?
  profileCompletionScore     Int                    @default(0)

  // Billing (individual or org-level)
  individualBilling          Boolean                @default(false)
  iban                       String?
  annualGrossCents           Int                    @default(0)

  createdAt                  DateTime               @default(now())
  updatedAt                  DateTime               @updatedAt

  // Relationships
  Organization               Organization           @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  User                       User                   @relation(fields: [userId], references: [id])

  // All existing relationships stay the same, just add organizationId scope
  Clients                    Client[]
  Appointments               Appointment[]
  Services                   Service[]
  // ... etc

  @@unique([organizationId, slug])  // Slug unique within org
  @@unique([organizationId, userId]) // User can only be therapist once per org
  @@index([organizationId])
  @@index([userId])
}

// Example of updated dependent model
model Client {
  id             String        @id @default(cuid())
  organizationId String        // NEW: Multi-tenant scope
  therapistId    String        // Therapist who owns this client
  assignedTherapistIds String[] @default([]) // NEW: Other therapists who can access

  name           String
  email          String?
  // ... all existing fields

  Organization   Organization  @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  Therapist      Therapist     @relation(fields: [therapistId], references: [id])

  @@index([organizationId, therapistId])
  @@index([organizationId, email])
}
```

## Data Access Patterns

### 1. Organization Context
All queries must include `organizationId` for tenant isolation:

```typescript
// Example: Get clients for current organization
const clients = await prisma.client.findMany({
  where: {
    organizationId: currentOrg.id,
    // Additional filters...
  }
})
```

### 2. Cross-Therapist Sharing
Within an organization, certain data can be shared:

```typescript
// Shared resources (services, locations)
const services = await prisma.service.findMany({
  where: {
    organizationId: currentOrg.id,
    OR: [
      { therapistId: currentTherapist.id },
      { shared: true }
    ]
  }
})
```

### 3. Role-Based Access
Different roles have different data access:

```typescript
// Receptionist can see appointments but not health data
const appointments = await prisma.appointment.findMany({
  where: {
    organizationId: currentOrg.id,
  },
  include: {
    Client: {
      select: {
        name: true,
        email: true,
        phone: true,
        // No healthFlagsEnc for RECEPTIONIST role
      }
    }
  }
})
```

## Migration Strategy

### Phase 1: Schema Addition (Non-Breaking)
1. Add new Organization models
2. Add optional `organizationId` to existing models
3. Create organizations for existing therapists (1:1 mapping)

### Phase 2: Data Migration
1. Populate `organizationId` for all existing data
2. Create organization memberships for existing users
3. Migrate subscription data to organization level

### Phase 3: Enforcement
1. Make `organizationId` required
2. Update all API middleware to enforce tenant isolation
3. Remove old single-tenant fields

## Benefits

### Business Benefits
- **Higher Revenue**: Practice-wide subscriptions vs individual
- **Better Retention**: Harder to switch when multiple users
- **Enterprise Sales**: Can sell to larger practices
- **Network Effects**: More users = more value

### Technical Benefits
- **Resource Sharing**: Services, locations, settings
- **Unified Billing**: One subscription per practice
- **Cross-Scheduling**: See other therapists' availability
- **Centralized Management**: Admin can manage all therapists

### User Benefits
- **Collaboration**: Multiple therapists can work together
- **Efficiency**: Shared resources reduce duplication
- **Flexibility**: Different roles for different staff
- **Growth**: Easy to add new therapists to practice