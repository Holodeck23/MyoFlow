# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-10-16-ux-polish-launch-blockers/spec.md

## Overview

This schema extends the existing `User` model to support account type differentiation (TEST, PRODUCTION, ADMIN, DEV) and adds a mechanism for archiving test data when users convert to production accounts.

---

## Schema Changes

### 1. Add AccountType Enum

```prisma
enum AccountType {
  TEST        // Test/demo accounts with sample data (default for all new signups)
  PRODUCTION  // Live production accounts with real practice data
  ADMIN       // System administrator accounts (cannot access main platform)
  DEV         // Developer accounts with debug features enabled
}
```

**Rationale:**
- **TEST**: Current state of all existing accounts. Allows users to explore features risk-free with dummy data.
- **PRODUCTION**: Real therapist accounts managing live practices. No test banners, clean professional interface.
- **ADMIN**: System administrators managing users, monitoring health, handling support. Segregated from main platform.
- **DEV**: Developer accounts with access to debug tools, feature flags, and verbose logging (future use).

---

### 2. Modify User Model

```prisma
model User {
  id            String       @id @default(cuid())
  name          String?
  email         String       @unique
  emailVerified DateTime?
  image         String?
  role          Role         @default(USER)

  // NEW: Account type field
  accountType   AccountType  @default(TEST)  // ← All new users start as TEST

  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  accounts      Account[]
  sessions      Session[]
  therapist     Therapist?
  archivedData  ArchivedData[] // ← For TEST → PRODUCTION conversions

  @@index([email])
  @@index([accountType]) // ← Performance: quick filtering by account type
}
```

**Migration Notes:**
- Existing users will be set to `TEST` by default
- Admin users (if any) should be manually updated to `ADMIN` type
- No data loss: all existing records preserved

---

### 3. Add ArchivedData Model

```prisma
model ArchivedData {
  id         String   @id @default(cuid())
  userId     String
  data       Json     // Serialized test data (clients, invoices, appointments, sessions)
  note       String?  // Optional note about why data was archived
  archivedAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([archivedAt])
}
```

**Purpose:**
When a user converts from TEST to PRODUCTION:
1. All test data (clients, invoices, appointments, session notes) is serialized to JSON
2. Stored in `ArchivedData` table for potential recovery/reference
3. Original test records are deleted from main tables
4. User starts fresh with PRODUCTION account

**Data Structure Example:**
```json
{
  "clients": [
    { "id": "...", "firstName": "Demo", "lastName": "Client", ... }
  ],
  "invoices": [
    { "id": "...", "invoiceNumber": "DEMO-001", ... }
  ],
  "appointments": [...],
  "sessionNotes": [...]
}
```

---

## Migration Script

### Step 1: Create Enum and Add Column

```prisma
-- In packages/db/prisma/schema.prisma
-- Add the enum definition above the User model

-- Generate migration:
-- npx prisma migrate dev --name add-account-type-system --create-only
```

Generated SQL will be:
```sql
-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('TEST', 'PRODUCTION', 'ADMIN', 'DEV');

-- AlterTable: Add accountType column
ALTER TABLE "User" ADD COLUMN "accountType" "AccountType" NOT NULL DEFAULT 'TEST';

-- CreateIndex: Performance optimization
CREATE INDEX "User_accountType_idx" ON "User"("accountType");
```

### Step 2: Update Existing Admin Users

```sql
-- Manual data migration (run after schema migration)
-- Update any existing admin users to ADMIN account type
UPDATE "User"
SET "accountType" = 'ADMIN'
WHERE "role" = 'ADMIN';
```

### Step 3: Create ArchivedData Table

```sql
-- CreateTable
CREATE TABLE "ArchivedData" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "note" TEXT,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArchivedData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArchivedData_userId_idx" ON "ArchivedData"("userId");
CREATE INDEX "ArchivedData_archivedAt_idx" ON "ArchivedData"("archivedAt");

-- AddForeignKey
ALTER TABLE "ArchivedData" ADD CONSTRAINT "ArchivedData_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

---

## Indexes

### Performance Optimizations

1. **User.accountType**: Index for filtering users by account type (admin queries, account stats)
2. **ArchivedData.userId**: Index for retrieving archived data by user
3. **ArchivedData.archivedAt**: Index for cleanup jobs (delete old archives after N months)

---

## Data Integrity Rules

### Constraints

1. **accountType cannot be null**: Always has a value (default TEST)
2. **Cascade delete**: When user is deleted, archived data is also deleted
3. **accountType transitions**:
   - TEST → PRODUCTION (allowed via upgrade flow)
   - PRODUCTION → TEST (NOT allowed, prevents accidental data loss)
   - Any → ADMIN (manual only, via direct database update)
   - Any → DEV (manual only, for developer accounts)

### Validation Rules (Application Layer)

```typescript
// In apps/web/app/api/settings/account/upgrade/route.ts

function validateAccountUpgrade(user: User, profile: TherapistProfile): ValidationResult {
  // 1. Must be TEST account
  if (user.accountType !== 'TEST') {
    return { valid: false, error: 'Only TEST accounts can be upgraded' }
  }

  // 2. Profile must be 100% complete
  const requiredFields = [
    'businessName', 'firstName', 'lastName', 'email',
    'phone', 'address', 'postalCode', 'city'
  ]
  for (const field of requiredFields) {
    if (!profile[field]) {
      return { valid: false, error: `Missing required field: ${field}` }
    }
  }

  // 3. Bank details must be validated
  if (!profile.ibanAccount || !validateAustrianIBAN(profile.ibanAccount)) {
    return { valid: false, error: 'Valid IBAN required' }
  }

  // 4. Tax compliance configured
  if (!profile.taxId && !profile.isKleinunternehmer) {
    return { valid: false, error: 'Tax configuration required' }
  }

  return { valid: true }
}
```

---

## Rollback Plan

If issues arise after migration:

```sql
-- Remove accountType column (CAUTION: data loss)
ALTER TABLE "User" DROP COLUMN "accountType";

-- Drop enum
DROP TYPE "AccountType";

-- Drop ArchivedData table
DROP TABLE "ArchivedData";
```

**Note:** Only rollback if absolutely necessary. All account type data will be lost.

---

## Testing Checklist

- [ ] Migration runs successfully on test database
- [ ] All existing users have accountType = TEST after migration
- [ ] Admin users are correctly identified and updated to ADMIN
- [ ] New user signups default to TEST account type
- [ ] TEST → PRODUCTION conversion archives data correctly
- [ ] Archived data can be retrieved and inspected
- [ ] Account type appears in session object
- [ ] Indexes improve query performance (verify with EXPLAIN)
- [ ] Cascade delete works (deleting user removes archived data)
