# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-10-06-tier-based-expansion-strategy/spec.md

## Schema Changes Required

### 1. User Model Extensions

**Add License Type Tracking:**

```prisma
model User {
  // ... existing fields ...

  // License & Verification
  licenseType               LicenseType          @default(MASSAGE)
  licenseDocumentUrl        String?              // S3 URL to uploaded Berufsausweis
  licenseNumber             String?              // Austrian license number
  licenseVerifiedAt         DateTime?
  licenseVerificationStatus VerificationStatus   @default(PENDING)
  licenseVerificationNotes  String?              // Admin notes on verification

  // Relations
  subscription              Subscription?
}

enum LicenseType {
  MASSAGE    // Medizinischer Masseur / Heilmasseur (€29/mo tier)
  PHYSIO     // Physiotherapeut (€45/mo tier)
  ADMIN      // Platform administrator
}

enum VerificationStatus {
  PENDING    // Awaiting review
  VERIFIED   // License confirmed
  REJECTED   // Invalid/expired license
}
```

**Migration:**
```sql
-- Add license fields to User table
ALTER TABLE "User"
  ADD COLUMN "licenseType" TEXT NOT NULL DEFAULT 'MASSAGE',
  ADD COLUMN "licenseDocumentUrl" TEXT,
  ADD COLUMN "licenseNumber" TEXT,
  ADD COLUMN "licenseVerifiedAt" TIMESTAMP,
  ADD COLUMN "licenseVerificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "licenseVerificationNotes" TEXT;

-- Create indexes for verification queries
CREATE INDEX "User_licenseVerificationStatus_idx" ON "User"("licenseVerificationStatus");
CREATE INDEX "User_licenseType_idx" ON "User"("licenseType");
```

### 2. Subscription Model Extensions

**Add Tier-Based Billing:**

```prisma
model Subscription {
  id                    String              @id @default(cuid())
  userId                String              @unique
  user                  User                @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Tier & Billing
  tier                  SubscriptionTier    @default(MASSAGE)
  status                SubscriptionStatus  @default(ACTIVE)
  billingCycle          BillingCycle        @default(MONTHLY)

  // Stripe Integration
  stripeCustomerId      String?             @unique
  stripeSubscriptionId  String?             @unique
  stripePriceId         String?

  // Billing Periods
  currentPeriodStart    DateTime?
  currentPeriodEnd      DateTime?
  cancelAt              DateTime?
  canceledAt            DateTime?

  // Metadata
  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt

  @@index([userId])
  @@index([status])
  @@index([tier])
}

enum SubscriptionTier {
  MASSAGE    // €29/mo - Core features (appointments, billing, notes)
  PHYSIO     // €45/mo - Core + exercise prescription + SOAP templates
  CLINIC     // €89/mo - Physio + multi-user (up to 10 practitioners)
}

enum SubscriptionStatus {
  ACTIVE         // Paid and current
  PAST_DUE       // Payment failed, grace period
  CANCELED       // User canceled, active until period end
  INCOMPLETE     // Stripe checkout not finished
  TRIALING       // 14-day free trial
}

enum BillingCycle {
  MONTHLY        // Billed every 30 days
  ANNUAL         // Billed yearly (15% discount)
}
```

**Migration:**
```sql
-- Create Subscription table
CREATE TABLE "Subscription" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE,
  "tier" TEXT NOT NULL DEFAULT 'MASSAGE',
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "billingCycle" TEXT NOT NULL DEFAULT 'MONTHLY',
  "stripeCustomerId" TEXT UNIQUE,
  "stripeSubscriptionId" TEXT UNIQUE,
  "stripePriceId" TEXT,
  "currentPeriodStart" TIMESTAMP,
  "currentPeriodEnd" TIMESTAMP,
  "cancelAt" TIMESTAMP,
  "canceledAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX "Subscription_tier_idx" ON "Subscription"("tier");
```

### 3. Exercise Library (Physio-Only Features)

**New Exercise Model:**

```prisma
model Exercise {
  id              String            @id @default(cuid())
  name            String
  description     String?
  category        ExerciseCategory
  difficulty      ExerciseDifficulty @default(BEGINNER)
  videoUrl        String?           // S3/Vimeo URL
  thumbnailUrl    String?
  instructions    String            // Step-by-step markdown
  duration        Int?              // Seconds
  equipment       String[]          // ["resistance_band", "yoga_mat"]

  // Access Control
  accessLevel     AccessLevel       @default(PHYSIO_ONLY)

  // Metadata
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  // Relations
  prescriptions   ExercisePrescription[]

  @@index([category])
  @@index([accessLevel])
}

enum ExerciseCategory {
  MOBILITY
  STRENGTH
  BALANCE
  CARDIO
  STRETCHING
}

enum ExerciseDifficulty {
  BEGINNER
  INTERMEDIATE
  ADVANCED
}

enum AccessLevel {
  ALL_TIERS       // Available to massage + physio
  PHYSIO_ONLY     // Requires physiotherapist license
  CLINIC_ONLY     // Requires clinic tier
}

model ExercisePrescription {
  id          String    @id @default(cuid())
  exerciseId  String
  exercise    Exercise  @relation(fields: [exerciseId], references: [id])
  clientId    String
  client      Client    @relation(fields: [clientId], references: [id])
  prescribedBy String   // userId of physiotherapist

  // Prescription Details
  sets        Int?
  reps        Int?
  duration    Int?      // Seconds
  frequency   String?   // "3x per week"
  notes       String?

  // Compliance Tracking
  completed   Boolean   @default(false)
  completedAt DateTime?

  createdAt   DateTime  @default(now())

  @@index([clientId])
  @@index([prescribedBy])
}
```

**Migration:**
```sql
-- Create Exercise table
CREATE TABLE "Exercise" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT NOT NULL,
  "difficulty" TEXT NOT NULL DEFAULT 'BEGINNER',
  "videoUrl" TEXT,
  "thumbnailUrl" TEXT,
  "instructions" TEXT NOT NULL,
  "duration" INTEGER,
  "equipment" TEXT[],
  "accessLevel" TEXT NOT NULL DEFAULT 'PHYSIO_ONLY',
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL
);

CREATE INDEX "Exercise_category_idx" ON "Exercise"("category");
CREATE INDEX "Exercise_accessLevel_idx" ON "Exercise"("accessLevel");

-- Create ExercisePrescription table
CREATE TABLE "ExercisePrescription" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "exerciseId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "prescribedBy" TEXT NOT NULL,
  "sets" INTEGER,
  "reps" INTEGER,
  "duration" INTEGER,
  "frequency" TEXT,
  "notes" TEXT,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "completedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE,
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE
);

CREATE INDEX "ExercisePrescription_clientId_idx" ON "ExercisePrescription"("clientId");
CREATE INDEX "ExercisePrescription_prescribedBy_idx" ON "ExercisePrescription"("prescribedBy");
```

### 4. Audit Trail for License Changes

**License Change Log:**

```prisma
model LicenseChangeLog {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])

  // Change Details
  previousType    LicenseType?
  newType         LicenseType
  previousTier    SubscriptionTier?
  newTier         SubscriptionTier

  // Verification
  verifiedBy      String?   // Admin userId who approved
  documentUrl     String?   // S3 URL of uploaded license

  // Metadata
  reason          String?   // "User completed physiotherapy qualification"
  createdAt       DateTime  @default(now())

  @@index([userId])
  @@index([createdAt])
}
```

**Migration:**
```sql
-- Create audit log table
CREATE TABLE "LicenseChangeLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "previousType" TEXT,
  "newType" TEXT NOT NULL,
  "previousTier" TEXT,
  "newTier" TEXT NOT NULL,
  "verifiedBy" TEXT,
  "documentUrl" TEXT,
  "reason" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "LicenseChangeLog_userId_idx" ON "LicenseChangeLog"("userId");
CREATE INDEX "LicenseChangeLog_createdAt_idx" ON "LicenseChangeLog"("createdAt");
```

## Data Migration Strategy

### Existing Users → Default Massage Tier

```sql
-- Set all existing users to MASSAGE license type and VERIFIED status
UPDATE "User"
SET
  "licenseType" = 'MASSAGE',
  "licenseVerificationStatus" = 'VERIFIED',
  "licenseVerifiedAt" = CURRENT_TIMESTAMP
WHERE "licenseType" IS NULL;

-- Create MASSAGE tier subscriptions for all existing users
INSERT INTO "Subscription" ("id", "userId", "tier", "status", "billingCycle", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  "id",
  'MASSAGE',
  'ACTIVE',
  'MONTHLY',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "User"
WHERE NOT EXISTS (
  SELECT 1 FROM "Subscription" WHERE "Subscription"."userId" = "User"."id"
);
```

## Performance Considerations

**Indexes for Common Queries:**
```sql
-- Fast lookup: Get user + subscription + license in one query
CREATE INDEX "User_id_licenseType_idx" ON "User"("id", "licenseType");

-- Admin verification queue
CREATE INDEX "User_verificationStatus_createdAt_idx"
ON "User"("licenseVerificationStatus", "createdAt");

-- Subscription renewal queries
CREATE INDEX "Subscription_status_currentPeriodEnd_idx"
ON "Subscription"("status", "currentPeriodEnd");
```

## Rationale

**Why License Type on User (not Subscription)?**
- License is professional credential (permanent), subscription is billing status (transient)
- User may cancel subscription but retain verified license
- Simplifies re-activation: preserve license type when resubscribing

**Why Separate Subscription Table?**
- Stripe webhook data needs dedicated storage
- Multiple billing cycles (monthly/annual) require separate tracking
- Future: family/team subscriptions may have 1-to-many relationship

**Why Exercise Access Level?**
- Legal compliance: some exercises may be appropriate for all tiers (basic stretching)
- Future-proofing: allows graduated feature access within physio tier
- Admin flexibility: mark certain exercises as "all tiers" after legal review
