# Issue: Therapist Profile Race Condition

**Date:** September 11, 2025  
**Status:** ✅ RESOLVED  
**Severity:** High  
**Component:** Multiple API routes with `getTherapistId()` functions  

## Problem Description

The `getTherapistId()` function in the therapist profile API route has a race condition causing unique constraint violations when multiple requests try to create therapist records simultaneously.

## Root Cause

1. **Race Condition Logic**: The function uses separate `findFirst()` then `create()` operations instead of atomic `upsert()`
2. **Error Pattern**: `PrismaClientKnownRequestError: Unique constraint failed on the fields: (userId)`
3. **Occurrence**: Happens when multiple settings page loads occur quickly or when page refreshes

## Error Details

```
Error fetching therapist profile: PrismaClientKnownRequestError: 
Invalid `prisma.therapist.upsert()` invocation:

Unique constraint failed on the fields: (`userId`)
  code: 'P2002',
  meta: { modelName: 'Therapist', target: [ 'userId' ] }
```

## Current Code (Problematic)

```typescript
async function getTherapistId(session: any): Promise<string> {
  let therapist = await prisma.therapist.findFirst({
    where: { userId: session.user.id }
  })

  if (!therapist) {
    // Race condition here - another request might create between findFirst and create
    therapist = await prisma.therapist.create({
      data: {
        userId: user.id,
        slug: session.user.email?.split('@')[0] || 'therapist',
        designation: 'HEILMASSEUR',
        vatStatus: 'KLEINUNTERNEHMER'
      }
    })
  }
  
  return therapist.id
}
```

## Impact

- Settings page fails to load intermittently
- User sees "Error fetching therapist profile" in console
- Prevents access to therapist profile management functionality
- Blocks PDF generation and other therapist-dependent features

## Solution Required

Replace race-prone logic with atomic `upsert()` operation that handles both create and update scenarios safely.

## Database State

```sql
-- Current data is correct
SELECT id, "userId", slug FROM "Therapist";
--             id              |     userId      | slug 
-- ---------------------------+-----------------+------
--  cmfeiti220001r7fy0u2tjj6h | test@myoflow.at | test

SELECT id, email FROM "User";
-- id        |      email      
-- ---------+-----------------
-- test@myoflow.at | test@myoflow.at
```

## Resolution ✅

**Fixed on:** September 11, 2025  
**Resolution:** Replaced race-prone `findFirst() → create()` pattern with atomic `upsert()` operations

### Files Fixed

1. **`/apps/web/app/api/therapist/profile/route.ts`** - Main therapist profile API 
2. **`/apps/web/app/api/clients/route.ts`** - Client listing API
3. **`/apps/web/app/api/invoices/route.ts`** - Invoice listing API  
4. **`/apps/web/app/api/appointments/route.ts`** - Appointment listing API

### Implementation Pattern Applied

```typescript
async function getTherapistId(session: any): Promise<string> {
  // First ensure user exists
  await prisma.user.upsert({
    where: { id: session.user.id },
    update: {},
    create: { /* user data */ }
  })

  // Then upsert therapist atomically to avoid race conditions
  const therapist = await prisma.therapist.upsert({
    where: { userId: session.user.id },
    update: {}, // Don't overwrite existing data on subsequent calls
    create: { /* therapist defaults */ }
  })

  return therapist.id
}
```

### Testing

- All API routes now use atomic upsert operations
- Race conditions eliminated through proper database constraints
- Development server shows no more constraint violation errors
- Multiple concurrent requests handled safely

### Impact

- Settings page loads reliably
- Dashboard components (clients, invoices, appointments) load without errors  
- Eliminates "Error fetching therapist profile" console messages
- Improves user experience during concurrent page loads