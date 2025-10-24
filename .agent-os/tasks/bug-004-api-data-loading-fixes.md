# BUG-004: API Data Loading & Auth Timeout Issues

**Priority:** P0 - CRITICAL BLOCKER
**Status:** TODO
**Assigned:** Next Agent
**Created:** 2025-10-24
**Parent:** BUG-003 (QA Wave 2 Fixes)

---

## Problem Summary

After fixing appointment modal dropdown blocking logic, dropdowns now become **enabled** but remain **empty** (showing placeholders only). The underlying issue is that **API endpoints are failing to return data** due to authentication timeouts.

### Symptoms

1. **Appointment Modal Dropdowns Empty**
   - Location: `/dashboard/calendar` → "+ Neuer Termin" button
   - Dropdowns become enabled after loading (✅ fixed)
   - Client dropdown: No "Thomas Weber" visible
   - Service dropdown: No "Klassische Massage 60min" visible
   - Location dropdown: No configured locations visible
   - Warning banner shows "Services Cta" and "Locations Cta" incorrectly

2. **API Endpoints Returning Errors**
   ```bash
   curl http://localhost:3000/api/clients
   # Returns: {"error":"Failed to fetch clients"}

   curl http://localhost:3000/api/services
   # Returns: {"error":"Failed to fetch services"}

   curl http://localhost:3000/api/locations
   # Returns: {"error":"Failed to fetch locations"}
   ```

3. **Auth Timeout Delays**
   - API calls taking 16+ seconds to return errors
   - `await auth()` in `requireTherapist()` taking excessive time
   - Location: `apps/web/src/lib/shared-helpers.ts:27`
   - Likely database connection pool exhaustion

4. **Settings Profile Tab Hangs**
   - Location: `/dashboard/settings?tab=profile`
   - Shows "Loading profile..." indefinitely
   - QA reported 10+ second delays, possibly 20+ seconds
   - Same auth timeout issue affecting this endpoint

---

## Root Cause Analysis

**Primary Issue:** `await auth()` function taking 16+ seconds to validate sessions

**File:** `apps/web/src/lib/shared-helpers.ts`
**Function:** `requireTherapist()` (line 26-52)

```typescript
export async function requireTherapist() {
  const session = await auth()  // ← Takes 16+ seconds!
  // ... rest of function
}
```

**Why This Affects Everything:**
- ALL authenticated API routes call `requireTherapist()` or similar helpers
- Client/Service/Location APIs fail immediately due to timeout
- Settings Profile API hangs during load
- Invoice PDF generation likely affected
- Appointment creation would fail if tried

**Likely Causes:**
1. PostgreSQL connection pool exhaustion
2. Database connection timeout settings
3. NextAuth session validation slow queries
4. Missing database indexes on session lookup tables
5. Stale/corrupted database connections from previous sessions

---

## Investigation Steps

### Step 1: Verify Database Connection Health

```bash
# Check PostgreSQL is running
psql -U ZOD -d myoflow -c "SELECT 1;"

# Check connection count
psql -U ZOD -d myoflow -c "SELECT count(*) FROM pg_stat_activity WHERE datname = 'myoflow';"

# Check for slow queries
psql -U ZOD -d myoflow -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE state = 'active' ORDER BY duration DESC;"
```

### Step 2: Check NextAuth Session Table Performance

```bash
# Check Session table size
psql -U ZOD -d myoflow -c "SELECT count(*) FROM \"Session\";"

# Check for missing indexes
psql -U ZOD -d myoflow -c "
  SELECT tablename, indexname, indexdef
  FROM pg_indexes
  WHERE schemaname = 'public'
  AND tablename IN ('User', 'Session', 'Account');
"
```

### Step 3: Test Auth Function Directly

Create a test API route to isolate the auth delay:

```typescript
// apps/web/app/api/test-auth/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET() {
  const startTime = Date.now()

  try {
    const session = await auth()
    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      hasSession: !!session,
      userEmail: session?.user?.email || null
    })
  } catch (error) {
    const duration = Date.now() - startTime
    return NextResponse.json({
      success: false,
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
```

Then test:
```bash
time curl http://localhost:3000/api/test-auth
```

### Step 4: Check Prisma Client Configuration

**File:** `packages/db/src/index.ts`

Verify connection pool settings:
```typescript
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Check if these are set:
  // connection_limit = 10
  // pool_timeout = 10
}
```

---

## Potential Fixes

### Option 1: Restart PostgreSQL Database

```bash
# macOS
brew services restart postgresql@14

# Or if using Docker
docker restart myoflow-postgres
```

### Option 2: Clear Database Connection Pool

```bash
# Force close all connections
psql -U ZOD -d myoflow -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE datname = 'myoflow'
  AND pid <> pg_backend_pid();
"
```

### Option 3: Add Database Indexes

```sql
-- Add index on User.email for faster session lookups
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);

-- Add index on Session.userId
CREATE INDEX IF NOT EXISTS idx_session_user ON "Session"("userId");

-- Add index on Session.sessionToken
CREATE INDEX IF NOT EXISTS idx_session_token ON "Session"("sessionToken");
```

### Option 4: Optimize `requireTherapist()` Function

Consider caching or optimizing the database queries:

```typescript
// Cache therapist lookups for short duration (1 minute)
const therapistCache = new Map<string, { therapist: any, timestamp: number }>()

export async function requireTherapist() {
  const session = await auth()
  if (!session?.user?.email) {
    throw new AuthError('Unauthorized - No active session', 401, 'NO_SESSION')
  }

  const email = session.user.email.trim().toLowerCase()

  // Check cache first
  const cached = therapistCache.get(email)
  if (cached && Date.now() - cached.timestamp < 60000) {
    return cached.therapist
  }

  // Fetch from DB with optimized query (single query instead of two)
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      Therapist: true
    }
  })

  if (!user) {
    throw new AuthError('User account not found', 404, 'USER_NOT_FOUND')
  }

  const therapist = user.Therapist?.[0]
  if (!therapist) {
    throw new AuthError('Therapist profile not found', 404, 'THERAPIST_NOT_FOUND')
  }

  // Cache the result
  therapistCache.set(email, { therapist: { therapist, user, session }, timestamp: Date.now() })

  return { therapist, user, session }
}
```

### Option 5: Check .env Configuration

Verify DATABASE_URL has proper connection settings:

```bash
# Example with connection pool settings
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/myoflow?connection_limit=10&pool_timeout=10"
```

---

## Testing Criteria

### API Endpoints Must Work:

```bash
# All should return data in < 2 seconds:
time curl http://localhost:3000/api/clients
# Expected: Array with "Thomas Weber" (or "Johann Schmidt" from new QA)

time curl http://localhost:3000/api/services
# Expected: Array with "Klassische Massage 60min"

time curl http://localhost:3000/api/locations
# Expected: Array with configured locations
```

### Appointment Modal Dropdowns Must Populate:

1. Go to `/dashboard/calendar`
2. Click "+ Neuer Termin"
3. Wait for loading to complete (should be < 3 seconds)
4. **Verify:**
   - Client dropdown shows actual clients (not just placeholder)
   - Service dropdown shows actual services
   - Location dropdown shows actual locations
   - Warning links disappear once data loads

### Settings Profile Must Load Quickly:

1. Go to `/dashboard/settings?tab=profile`
2. **Verify:**
   - Profile data loads in < 5 seconds (requirement from BUG-003)
   - No "2 errors" notification unless actual validation errors
   - Form fields populated with saved data

---

## Success Criteria

- ✅ All API endpoints respond in < 2 seconds
- ✅ Appointment modal dropdowns populate with actual data
- ✅ Settings Profile tab loads in < 5 seconds
- ✅ No auth timeout delays (16+ sec → < 2 sec)
- ✅ TypeScript passing
- ✅ ESLint clean
- ✅ Dev server running without errors

---

## Related Issues

- **BUG-003:** QA Wave 2 Fixes (parent task)
- **BUG-005:** Note creation failing (likely same auth timeout cause)
- **Feature:** Travel charges in invoices (blocked by dropdown data loading)

---

**Estimated Time:** 2-4 hours (investigation + fix)
**Next Action:** Investigate database connection health and auth timeout root cause
