# Jules - Test Troubleshooting Guide

## Current Status
Tests in main repo are passing (47 web tests, 54 db tests). Since you're working remotely, this guide covers common issues you might be hitting.

---

## Issue 1: `ensureTherapistAccount` Mock Failures

### Symptom
```
TypeError: Cannot read properties of undefined (reading 'upsert')
```
or
```
Expected 200, received 401/500
```

### Root Cause
`ensureTherapistAccount` makes a chain of calls that ALL need mocks:
1. `auth()` - get session
2. `prisma.user.upsert()` - create/update user
3. `prisma.therapist.findUnique()` - check if therapist exists
4. `prisma.therapist.create()` - create if missing (slug collision retry logic)

### Complete Mock Pattern

```typescript
// At the top of your test file (HOISTED - before imports)
const mockAuth = vi.hoisted(() => vi.fn())
const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    upsert: vi.fn(),  // ← CRITICAL for ensureTherapistAccount
  },
  therapist: {
    findUnique: vi.fn(),  // ← CRITICAL for ensureTherapistAccount
    findFirst: vi.fn(),   // ← Used by requireTherapist (GET)
    update: vi.fn(),
    create: vi.fn(),      // ← For new therapist creation
  },
}))

vi.mock('../../lib/auth', () => ({
  auth: mockAuth,
}))

vi.mock('@myoflow/db', () => ({
  prisma: mockPrisma,
}))

// NOW import your route handlers
import { GET, PUT } from '../../app/api/settings/profile/route'

describe('Profile Settings API', () => {
  const mockTherapist = {
    id: 'therapist-1',
    userId: 'user-1',
    slug: 'therapist-test',
    businessName: 'Test Praxis',
    // ... other fields
  }

  const mockUser = {
    id: 'user-1',
    email: 'therapist@example.com',
    name: 'Test Therapist',
    role: 'OWNER',
  }

  beforeEach(() => {
    vi.clearAllMocks()

    const mockSession = {
      user: {
        email: mockUser.email,
        name: mockUser.name,
      },
    }

    // Mock auth for both GET and PUT
    mockAuth.mockResolvedValue(mockSession)

    // Mock for requireTherapist (GET)
    mockPrisma.user.findUnique.mockResolvedValue(mockUser)
    mockPrisma.therapist.findFirst.mockResolvedValue(mockTherapist)

    // Mock for ensureTherapistAccount (PUT)
    mockPrisma.user.upsert.mockResolvedValue(mockUser)
    mockPrisma.therapist.findUnique.mockResolvedValue(mockTherapist)

    // Mock for actual update operation
    mockPrisma.therapist.update.mockResolvedValue(mockTherapist)
  })

  describe('PUT /api/settings/profile', () => {
    it('should update business name', async () => {
      const updateData = { businessName: 'Neue Praxis' }

      mockPrisma.therapist.update.mockResolvedValue({
        ...mockTherapist,
        businessName: 'Neue Praxis',
      })

      const request = new Request('http://localhost:3000/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      const response = await PUT(request as any)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.data.businessName).toBe('Neue Praxis')
    })
  })
})
```

---

## Issue 2: Vitest Picking Up E2E Tests

### Symptom
```
Error: Cannot find module '@playwright/test'
```
or Vitest trying to run `.spec.ts` files

### Fix 1: Check File Locations
E2E tests (Playwright) should be in:
```
apps/web/e2e/*.spec.ts  ← Playwright tests here
apps/web/src/test/*.test.ts  ← Vitest API tests here
```

### Fix 2: Verify vitest.config.ts
```typescript
// apps/web/vitest.config.ts
export default defineConfig({
  test: {
    exclude: [
      '**/node_modules/**',
      '**/e2e/**',        // ← Excludes Playwright
      '**/*.spec.ts',     // ← Add this if needed
      '**/*.config.*'
    ],
    // ...
  }
})
```

### Fix 3: Run Correct Commands
```bash
# API/unit tests (Vitest)
pnpm --filter web test

# E2E tests (Playwright)
pnpm --filter web test:e2e
```

---

## Issue 3: Austrian Validation Returning 500 Instead of 400

### Symptom
Test expects 400, gets 500

### Root Cause
Validation throwing errors instead of being caught by Zod

### Check Your Route Handler
```typescript
// ✅ CORRECT - Returns 400 for validation errors
export async function PUT(request: NextRequest) {
  return handleAuthErrors(async () => {
    const { therapist } = await ensureTherapistAccount(request)

    const body = await request.json()

    // Zod validation catches errors
    const result = UpdateProfileSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid profile data',
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }  // ← Returns 400, not 500
      )
    }

    // ... rest of handler
  })
}
```

### Test Pattern
```typescript
it('should return 400 for invalid VAT number', async () => {
  const request = new Request('http://localhost:3000/api/settings/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uidNumber: 'INVALID'  // Not ATU########
    }),
  })

  const response = await PUT(request as any)

  expect(response.status).toBe(400)  // NOT 500!
  const body = await response.json()
  expect(body.success).toBe(false)
  expect(body.error).toBeDefined()
})
```

---

## Issue 4: Environment Not Resetting Between Tests

### Symptom
Tests pass individually but fail when run together

### Solution: Clean State in beforeEach
```typescript
beforeEach(async () => {
  vi.clearAllMocks()  // ← Clear all mock call history

  // Reset mock implementations
  mockAuth.mockReset()
  mockPrisma.user.upsert.mockReset()
  mockPrisma.therapist.findUnique.mockReset()
  // ... etc

  // Then set up fresh mocks
  mockAuth.mockResolvedValue({ user: { email: 'test@example.com' }})
  // ... etc
})
```

### Nuclear Option: Reset Entire Mock Module
```typescript
beforeEach(() => {
  vi.resetModules()  // ← Clears all module cache
  vi.clearAllMocks()
})
```

---

## Issue 5: Creating Tests for New Endpoints

### Template for Settings API Test

```typescript
// apps/web/src/test/settings-travel.api.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'

const mockAuth = vi.hoisted(() => vi.fn())
const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
  therapist: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
}))

vi.mock('../../lib/auth', () => ({ auth: mockAuth }))
vi.mock('@myoflow/db', () => ({ prisma: mockPrisma }))

import { GET, PUT } from '../../app/api/settings/travel/route'

describe('Travel Settings API', () => {
  const mockTherapist = {
    id: 'therapist-1',
    basePostalCode: '4020',
    primaryTransportMethod: 'CAR',
    // ... etc
  }

  const mockUser = {
    id: 'user-1',
    email: 'therapist@example.com',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ user: mockUser })
    mockPrisma.user.findUnique.mockResolvedValue(mockUser)
    mockPrisma.user.upsert.mockResolvedValue(mockUser)
    mockPrisma.therapist.findFirst.mockResolvedValue(mockTherapist)
    mockPrisma.therapist.findUnique.mockResolvedValue(mockTherapist)
    mockPrisma.therapist.update.mockResolvedValue(mockTherapist)
  })

  describe('GET /api/settings/travel', () => {
    it('should return travel settings', async () => {
      const request = new Request('http://localhost:3000/api/settings/travel')
      const response = await GET(request as NextRequest)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.data.basePostalCode).toBe('4020')
    })
  })

  describe('PUT /api/settings/travel', () => {
    it('should return 400 for invalid postal code', async () => {
      const request = new Request('http://localhost:3000/api/settings/travel', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ basePostalCode: '1234' }), // Not 4xxx
      })

      const response = await PUT(request as NextRequest)

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toContain('4xxx')
    })
  })
})
```

---

## Debugging Commands

```bash
# Run single test file
pnpm --filter web test settings-travel.api.test.ts

# Run with verbose output
pnpm --filter web test -- --reporter=verbose

# Run in watch mode
pnpm --filter web test:watch

# Clear Vitest cache
rm -rf apps/web/node_modules/.vitest

# Clean install
cd apps/web
rm -rf node_modules
pnpm install
```

---

## Validation Library Tests

If you need to test the validation helpers directly:

```typescript
// packages/lib/src/validation/validation.test.ts
import { describe, it, expect } from 'vitest'
import {
  assertValidAustrianPostalCode,
  normalizeVatNumber,
  isValidAustrianVatNumber,
  assertValidAustrianIban,
} from './index'

describe('Austrian Postal Code Validation', () => {
  it('should accept valid 4xxx codes', () => {
    expect(() => assertValidAustrianPostalCode('4020')).not.toThrow()
    expect(() => assertValidAustrianPostalCode('4600')).not.toThrow()
    expect(() => assertValidAustrianPostalCode('4999')).not.toThrow()
  })

  it('should reject invalid codes', () => {
    expect(() => assertValidAustrianPostalCode('1234'))
      .toThrow('4xxx format')
    expect(() => assertValidAustrianPostalCode('5xxx'))
      .toThrow('4xxx format')
    expect(() => assertValidAustrianPostalCode('abc'))
      .toThrow()
  })
})

describe('Austrian VAT Number Validation', () => {
  it('should normalize VAT numbers', () => {
    expect(normalizeVatNumber('ATU 12345678')).toBe('ATU12345678')
    expect(normalizeVatNumber('ATU-12345678')).toBe('ATU12345678')
  })

  it('should validate correct format', () => {
    expect(isValidAustrianVatNumber('ATU12345678')).toBe(true)
    expect(isValidAustrianVatNumber('ATU87654321')).toBe(true)
  })

  it('should reject invalid format', () => {
    expect(isValidAustrianVatNumber('AT12345678')).toBe(false)  // Missing U
    expect(isValidAustrianVatNumber('ATU1234567')).toBe(false)  // Too short
    expect(isValidAustrianVatNumber('INVALID')).toBe(false)
  })
})
```

Run with:
```bash
pnpm --filter @myoflow/lib test
```

---

## Common Error Messages & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot read properties of undefined (reading 'upsert')` | Missing `user.upsert` mock | Add to mockPrisma hoisted definition |
| `Expected 200, received 401` | Missing `auth()` mock | Add `mockAuth.mockResolvedValue(session)` |
| `Expected 200, received 404` | Missing therapist mock | Add `mockPrisma.therapist.findFirst.mockResolvedValue(...)` |
| `Cannot find module '@playwright/test'` | Vitest running E2E tests | Move `.spec.ts` to `e2e/` or add to `exclude` |
| `Expected 400, received 500` | Validation not catching errors | Use `safeParse()` and return 400 in route |
| `Tests pass individually but fail together` | State not resetting | Add `vi.clearAllMocks()` to `beforeEach` |

---

## Still Stuck?

Share the **specific error message** with:
1. The test file name
2. The full error output
3. Which endpoint you're testing

Example:
```
Testing: apps/web/src/test/settings-profile.api.test.ts
Endpoint: PUT /api/settings/profile
Error: TypeError: Cannot read properties of undefined (reading 'upsert')
  at ensureTherapistAccount (shared-helpers.ts:103)
  at PUT (route.ts:45)
```

This will let me give you exact line-by-line fixes.
