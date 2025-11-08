# BUG-001: Session Management Fix

**Assigned to:** Codex
**Priority:** P0 - CRITICAL BLOCKER
**Branch:** beta-readiness-core-workflow
**Created:** 2025-10-23
**Status:** TODO

---

## Problem Statement

Users are getting logged out immediately when navigating between pages in the application. This blocks all QA testing of core features (clients, appointments, invoices).

**Impact:** DEMO BLOCKER - Application is completely unusable beyond initial dashboard view.

---

## QA Findings

### Reproduction Steps:
1. Successfully sign in with credentials (e.g., `demo@example.com` / `demo`)
2. View dashboard at `/dashboard` (works fine)
3. Click any sidebar navigation link (e.g., "Klienten" → `/clients`)
4. Observe: Loading screen appears → redirected to `/auth/sign-in`

### Expected Behavior:
- User stays authenticated
- Navigates to requested page without losing session
- Session persists across page navigation

### Actual Behavior:
- Session lost on navigation
- User kicked back to login page
- No error message explaining why

---

## Technical Context

### Related CLAUDE.md Notes:
From October 21, 2025 session notes:

> **5. Onboarding Redirect Loop** ✅ (bd0c931)
> - Fixed JWT refresh to pass profileCompletionScore
> - Middleware now recognizes completion properly

This suggests there was a previous session issue that was "fixed" but may still have problems.

### Known Auth Architecture:
- Using NextAuth v5 (from CLAUDE.md)
- JWT-based authentication
- Middleware handles protected routes (`apps/web/middleware.ts`)
- Auth config in `apps/web/src/lib/auth.ts`
- Session refresh mechanism exists but may be broken

---

## Investigation Steps

### Step 1: Check JWT Configuration
```bash
# Look for session/JWT settings
grep -r "jwt.*maxAge\|session.*maxAge\|jwt.*expire" apps/web/src/lib/auth.ts
cat apps/web/src/lib/auth.ts | grep -A 20 "session\|jwt"
```

**What to look for:**
- Is `maxAge` set too short? (should be ~30 days, not 30 seconds)
- Is there a `jwt.maxAge` that's misconfigured?

### Step 2: Check Middleware
```bash
cat apps/web/middleware.ts
```

**What to look for:**
- Does middleware properly check session validity?
- Is there a refresh mechanism that's failing?
- Are cookies being properly set/read?

### Step 3: Check Session Refresh Logic
```bash
# Find JWT callback implementations
grep -r "jwt.*callback\|session.*callback" apps/web/src/lib/auth.ts -A 10
```

**What to look for:**
- Does the JWT callback properly pass `profileCompletionScore`?
- Is the session callback refreshing the token correctly?

### Step 4: Check Browser Behavior
1. Open DevTools → Application → Cookies
2. After login, check for `next-auth.session-token` or similar
3. Navigate to another page
4. Check if cookie is still present or if it disappeared

**What to check:**
- Cookie expiry time
- SameSite attribute (should be `Lax` for localhost)
- Secure flag (should be `false` for localhost, `true` for production)

---

## Likely Root Causes

**Hypothesis 1: JWT Expiry Too Short**
- Location: `apps/web/src/lib/auth.ts`
- Look for: `jwt: { maxAge: ... }`
- Expected: `maxAge: 30 * 24 * 60 * 60` (30 days)
- Possible issue: Set to seconds instead of milliseconds, or very short value

**Hypothesis 2: Middleware Not Refreshing Session**
- Location: `apps/web/middleware.ts`
- Issue: Middleware checks session but doesn't trigger refresh
- Fix: Ensure `auth()` is called properly on protected routes

**Hypothesis 3: Cookie Settings Wrong for Localhost**
- Location: `apps/web/src/lib/auth.ts` → `cookies` config
- Issue: `sameSite: 'strict'` or `secure: true` breaks localhost
- Fix: Use `sameSite: 'lax'` and `secure: process.env.NODE_ENV === 'production'`

**Hypothesis 4: Profile Completion Score Missing from JWT**
- Location: `apps/web/src/lib/auth.ts` → JWT callback
- Issue: JWT refresh fails because `profileCompletionScore` not included
- This was supposedly fixed in bd0c931 but may have regressed

---

## Fix Instructions

### Fix 1: Verify/Correct JWT MaxAge

**File:** `apps/web/src/lib/auth.ts`

Find the JWT configuration section and ensure:

```typescript
export const authOptions = {
  // ... other config
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
  },
  // ... rest
}
```

**Critical:** maxAge should be 2,592,000 seconds (30 days), NOT 30 or 1800

### Fix 2: Check Cookie Configuration

**File:** `apps/web/src/lib/auth.ts`

Ensure cookies work on localhost:

```typescript
export const authOptions = {
  // ... other config
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax', // NOT 'strict' - breaks localhost navigation
        path: '/',
        secure: process.env.NODE_ENV === 'production', // false on localhost
      }
    }
  },
  // ... rest
}
```

### Fix 3: Verify JWT Callback Includes Profile Data

**File:** `apps/web/src/lib/auth.ts`

From CLAUDE.md notes, the JWT callback needs to include `profileCompletionScore`:

```typescript
callbacks: {
  async jwt({ token, user, trigger }) {
    if (user) {
      token.id = user.id
      token.email = user.email
      token.role = user.role
      // CRITICAL: Include profile completion score for middleware
      token.profileCompletionScore = user.profileCompletionScore
    }

    // On session refresh, fetch latest profile data
    if (trigger === 'update') {
      const updatedUser = await prisma.user.findUnique({
        where: { email: token.email },
        select: { profileCompletionScore: true }
      })
      if (updatedUser) {
        token.profileCompletionScore = updatedUser.profileCompletionScore
      }
    }

    return token
  },

  async session({ session, token }) {
    if (token) {
      session.user.id = token.id
      session.user.email = token.email
      session.user.role = token.role
      session.user.profileCompletionScore = token.profileCompletionScore
    }
    return session
  }
}
```

### Fix 4: Verify Middleware Properly Handles Protected Routes

**File:** `apps/web/middleware.ts`

Ensure middleware doesn't invalidate sessions:

```typescript
export default auth((req) => {
  const { pathname } = req.nextUrl
  const isAuthenticated = !!req.auth

  // Public routes
  const isPublicRoute = pathname.startsWith('/auth') ||
                        pathname === '/' ||
                        pathname.startsWith('/_next') ||
                        pathname.startsWith('/api/auth')

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Protected routes - if not authenticated, redirect to sign-in
  if (!isAuthenticated) {
    const signInUrl = new URL('/auth/sign-in', req.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }

  // IMPORTANT: Allow request to proceed - don't accidentally invalidate session
  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

---

## Testing Criteria

After implementing fixes, verify:

### Manual Testing:
1. ✅ Sign in with demo credentials
2. ✅ Navigate to /dashboard
3. ✅ Click "Klienten" → should navigate to /clients WITHOUT redirecting to login
4. ✅ Click "Kalender" → should navigate to /appointments
5. ✅ Click "Rechnungen" → should navigate to /invoices
6. ✅ Refresh page → should stay authenticated
7. ✅ Open new tab to localhost:3000 → should still be authenticated
8. ✅ Wait 5 minutes → navigate → session should persist

### Browser DevTools Check:
1. Open DevTools → Application → Cookies
2. After login, verify `next-auth.session-token` cookie exists
3. Check cookie properties:
   - Expires: Should be ~30 days from now
   - SameSite: Should be `Lax`
   - Secure: Should be blank/false (localhost)
   - HttpOnly: Should be checked
4. Navigate to another page
5. Cookie should still be present with same expiry

### Console Check:
- No errors about "Unauthorized" or "No active session" when navigating
- No AuthError stack traces in server logs

---

## Success Criteria

**Definition of Done:**
- ✅ User can navigate between all pages without losing session
- ✅ Session persists across page refreshes
- ✅ Session persists across new tabs (same domain)
- ✅ No console errors related to auth when navigating
- ✅ QA can complete Scenarios 2-7 without re-authentication

**Quality Gates:**
- ✅ `pnpm typecheck` passes
- ✅ `pnpm test` passes (ensure no test regressions)
- ✅ Manual testing checklist completed

---

## Files to Modify

**Primary Files:**
- `apps/web/src/lib/auth.ts` - Auth configuration
- `apps/web/middleware.ts` - Route protection logic

**Possibly Affected:**
- `apps/web/.env` or `.env.local` - Environment variables
- Type definitions if session shape changes

**DO NOT MODIFY:**
- Test files (unless they need updated mocks)
- Database schema
- API routes (unless auth logic is embedded)

---

## Additional Context

### Environment Variables to Check:
```bash
# In apps/web/.env or .env.local
NEXTAUTH_URL=http://localhost:3000  # Should match dev server port
NEXTAUTH_SECRET=<some-secret-value>  # Should exist and be non-empty
```

### Related Issues:
- QA Report: See `.agent-os/tasks/qa-wave2-report.md` (if exists)
- Previous fix: Commit bd0c931 (October 21) - "Fixed JWT refresh to pass profileCompletionScore"

### Debug Commands:
```bash
# Check current auth config
cat apps/web/src/lib/auth.ts | grep -A 30 "export.*authOptions\|export.*auth"

# Check middleware
cat apps/web/middleware.ts

# Check environment
cat apps/web/.env | grep NEXTAUTH

# Test auth endpoint
curl http://localhost:3000/api/auth/session
```

---

## Completion Checklist

- [ ] Investigated root cause using steps above
- [ ] Identified which hypothesis is correct
- [ ] Implemented appropriate fix(es)
- [ ] Verified JWT maxAge is reasonable (30 days)
- [ ] Verified cookie settings work on localhost
- [ ] Verified JWT callback includes all required fields
- [ ] Verified middleware doesn't invalidate sessions
- [ ] Tested manual navigation between pages
- [ ] Checked browser DevTools cookies
- [ ] Verified no console errors
- [ ] All quality gates passing (typecheck, tests)
- [ ] Committed changes with descriptive message
- [ ] Notified user that BUG-001 is fixed

---

**Estimated Time:** 1-2 hours (investigation + fix + testing)
**Next Action:** Codex to investigate and implement fix
