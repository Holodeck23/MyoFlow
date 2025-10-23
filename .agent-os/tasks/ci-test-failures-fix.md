# CI Test Failures - Fix Task List

**Branch:** beta-readiness-core-workflow
**Status:** FAILED - 3 unit tests + 20 E2E tests failing
**Assigned to:** Codex
**Created:** 2025-10-23

---

## Overview

The CI build has multiple test failures across unit tests and E2E tests, plus one TypeScript compilation error. All issues must be resolved for the branch to merge.

---

## Tasks

### 1. TypeScript Compilation Error ❌

**File:** `apps/web/src/components/ui/DatePickerField.tsx:362`
**Error:** `Type 'boolean | null' is not assignable to type 'boolean | undefined'`

**Root Cause:**
The `isDisabled` variable can evaluate to `null` when `minBoundary` or `maxBoundary` are `null`, because the `&&` operator returns the left operand if falsy:
```typescript
// Line 339-342
const isDisabled = !!(
  (minBoundary && isBefore(normalized, minBoundary)) ||
  (maxBoundary && isAfter(normalized, maxBoundary))
)
```

If both conditions are falsy:
- `(null && isBefore(...))` returns `null`
- `(null || null)` returns `null`
- `!!null` converts to `false` ✅

However, TypeScript still sees the potential for `null` in the expression.

**Fix:**
Ensure the disabled prop always receives a boolean by explicitly coercing to boolean:
```typescript
const isDisabled = Boolean(
  (minBoundary && isBefore(normalized, minBoundary)) ||
  (maxBoundary && isAfter(normalized, maxBoundary))
)
```

**Acceptance Criteria:**
- [ ] `pnpm typecheck` passes with zero errors
- [ ] DatePickerField component still functions correctly

---

### 2. Invoice API - Missing Future Service Date Validation ❌

**Test File:** `apps/web/src/test/invoices.api.test.ts:122-151`
**Test Name:** "rejects invoices with future service date"
**Current Behavior:** API returns 201 (Created)
**Expected Behavior:** API returns 400 (Bad Request) with error message containing "future"

**Root Cause:**
The invoice API endpoint (`apps/web/app/api/invoices/route.ts`) does not validate that `serviceDate` is not in the future.

**Fix:**
Add validation in the POST handler:
```typescript
// After parsing serviceDate from request body
const serviceDate = new Date(body.serviceDate)
const now = new Date()

if (serviceDate > now) {
  return NextResponse.json(
    {
      success: false,
      error: 'Service date cannot be in the future'
    },
    { status: 400 }
  )
}
```

**Files to Modify:**
- `apps/web/app/api/invoices/route.ts` - Add validation logic

**Acceptance Criteria:**
- [ ] Test `invoices.api.test.ts` passes
- [ ] API rejects future service dates with 400 status
- [ ] Error message includes the word "future"
- [ ] `mockPrisma.invoice.create` is NOT called for future dates

---

### 3. ensureTherapistAccount - Missing Default Service and Location Creation ❌

**Test File:** `apps/web/src/test/ensure-therapist-account.test.ts:63-85`
**Test Name:** "creates default service and location when missing"
**Current Behavior:** Function does not create default service or location
**Expected Behavior:** When service/location count is 0, create defaults

**Root Cause:**
The `ensureTherapistAccount` function (lines 89-156 in `apps/web/src/lib/shared-helpers.ts`) only creates User and Therapist records. It does not check for or create default Service and Location records.

**Fix:**
Add logic after therapist creation (around line 153):

```typescript
// After therapist is created/retrieved

// Create default service if none exist
const serviceCount = await prisma.service.count({
  where: { therapistId: therapist.id }
})

if (serviceCount === 0) {
  await prisma.service.create({
    data: {
      therapistId: therapist.id,
      name: 'Klassische Massage 60min',
      category: 'MASSAGE',
      durationMinutes: 60,
      defaultPriceCents: 8000,
      vatStatus: 'KLEINUNTERNEHMER',
      isActive: true
    }
  })
}

// Create default location if none exist
const locationCount = await prisma.location.count({
  where: { therapistId: therapist.id }
})

if (locationCount === 0) {
  await prisma.location.create({
    data: {
      therapistId: therapist.id,
      name: 'Praxis Linz',
      type: 'CLINIC',
      street: 'Hauptstraße 1',
      postalCode: '4020',
      city: 'Linz',
      country: 'Austria',
      isActive: true
    }
  })
}

return { therapist, user }
```

**Files to Modify:**
- `apps/web/src/lib/shared-helpers.ts` - Add default service/location creation

**Acceptance Criteria:**
- [ ] Test `ensure-therapist-account.test.ts` passes
- [ ] When service count is 0, create default service with correct fields
- [ ] When location count is 0, create default location with correct fields
- [ ] When entries exist, do NOT recreate them
- [ ] Import required enums from `@myoflow/db`: `ServiceCategory`, `VatStatus`, `LocationType`

---

### 4. E2E Tests - Port Configuration and Auth Issues ❌

**Failed Tests:** 20/20 E2E tests failing
**Common Issues:**
- `ERR_CONNECTION_REFUSED at http://localhost:3001`
- Sign-in button remaining disabled (never enabled)
- Demo login not redirecting within 30s

**Root Causes:**
1. **Port Mismatch:** E2E tests expect port 3001, but dev server runs on port 3000
2. **Form Validation:** Sign-in form validation preventing button from enabling during tests
3. **Test Environment:** `AUTH_ENABLE_DEMO` may not be set in test environment

**Files Involved:**
- `apps/web/playwright.config.ts` - Test configuration
- `apps/web/e2e/utils.ts` - Login helper functions
- `apps/web/.env.test` or test environment configuration

**Fix Options:**

**Option A: Update E2E Config to Use Port 3000**
```typescript
// In playwright.config.ts
webServer: {
  command: 'pnpm dev',
  url: 'http://localhost:3000', // Changed from 3001
  reuseExistingServer: !process.env.CI,
}

// Update baseURL
use: {
  baseURL: 'http://localhost:3000', // Changed from 3001
}
```

**Option B: Configure Dev Server to Use Port 3001 for Tests**
```json
// In package.json
{
  "scripts": {
    "test:e2e": "PORT=3001 playwright test"
  }
}
```

**Recommendation:** Option A (use port 3000) is simpler and avoids port conflicts.

**Additional Fixes:**
1. Ensure `AUTH_ENABLE_DEMO=true` in test environment
2. Review form validation logic to ensure demo credentials enable button
3. Add proper wait conditions in login helper (`e2e/utils.ts`)

**Acceptance Criteria:**
- [ ] All 20 E2E tests pass
- [ ] Tests connect successfully to dev server
- [ ] Sign-in button becomes enabled with demo credentials
- [ ] Demo login redirects to dashboard within timeout
- [ ] Admin tests can access `/admin/login` page

---

## Execution Order

Execute tasks in this order to minimize cascading failures:

1. **Task 1** (TypeScript) - Blocks build
2. **Task 2** (Invoice API) - Independent unit test
3. **Task 3** (ensureTherapistAccount) - Independent unit test
4. **Task 4** (E2E Tests) - May depend on auth logic from Task 3

---

## Quality Gates

Before marking tasks complete:

```bash
# 1. Type check
pnpm typecheck

# 2. Run unit tests
pnpm test

# 3. Run E2E tests
pnpm test:e2e

# 4. Full build
pnpm build

# 5. Lint check
pnpm lint
```

**Expected Results:**
- ✅ Zero TypeScript errors
- ✅ All unit tests passing
- ✅ All E2E tests passing (20/20)
- ✅ Build succeeds
- ✅ No lint errors

---

## Notes

- **Test Data:** E2E tests use demo user credentials (`demo@example.com` / `demo`)
- **Database:** Tests mock Prisma, so no real database changes needed for unit tests
- **Timezone:** All date comparisons should use `new Date()` for current time (server timezone)
- **Austrian Context:** Default service/location should use Austrian locations (Linz, 4020)

---

## Completion Checklist

- [ ] All TypeScript errors resolved
- [ ] Unit test: Invoice API future date validation passes
- [ ] Unit test: ensureTherapistAccount creates defaults passes
- [ ] All 20 E2E tests passing
- [ ] All quality gates passing
- [ ] Changes committed with descriptive message
- [ ] Ready for PR review

---

**Last Updated:** 2025-10-23
**Next Action:** Codex to execute tasks 1-4 in order
