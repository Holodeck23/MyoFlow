# Codex Brief: Task 1 - Session Management & Authentication Performance

**Created:** 2025-11-08
**Priority:** P0 - DEMO BLOCKER
**Assigned To:** Codex
**Reviewed By:** Claude (Lead Dev)
**Branch:** `fix/pre-grant-critical-fixes`
**Estimated Time:** 2 hours

---

## Mission

Fix session management issues causing user logouts during navigation and slow authentication performance (16+ second delays).

---

## Context

**Project:** MyoFlow - Austrian therapy practice management system
**Status:** Preparing for tech2b grant interview
**Problem:** QA testing (Oct 23-24) revealed critical session management bugs
**Previous Fix:** Oct 23 - Added JWT caching for Edge runtime, but edge cases remain

---

## Problem Statement

### Issues Identified by QA

1. **Session Loss During Navigation**
   - Users randomly logged out when clicking between pages
   - Dashboard → Settings → Clients navigation causes session drop
   - Manifests as 401 errors or redirect to login

2. **Extremely Slow auth() Calls**
   - API endpoints taking 16+ seconds to respond
   - Root cause: JWT callback hitting database on every request
   - Should be < 500ms, measured at 10,000ms+

3. **Edge Runtime vs Node.js Issues**
   - JWT callback running in Edge runtime can't access Prisma
   - Previous fix added runtime detection but incomplete
   - Cached tokens not being used correctly

4. **API Data Loading Failures**
   - Appointment modal dropdowns empty (cascade from slow auth)
   - Client/Service/Location endpoints timing out
   - Users see placeholders instead of real data

---

## Previous Work (October 23, 2025)

### Fix Implemented
**File:** `apps/web/src/lib/auth.ts`
**Changes:**
- Added runtime detection (Edge vs Node.js)
- Implemented token caching strategy
- Prevented Prisma calls in Edge runtime

**Pattern Added:**
```typescript
callbacks: {
  async jwt({ token, user, trigger }) {
    // For regular session checks (not sign-in, not explicit update),
    // return cached token to avoid 10+ second database queries
    if (!user && trigger !== 'update') {
      return token // Cached path
    }
    // Otherwise, rehydrate from DB
  }
}
```

### What Worked
- ✅ Reduced API calls from 10+ seconds → < 500ms (when working)
- ✅ Edge runtime no longer crashes on Prisma calls
- ✅ QA validated performance improvement

### What Still Breaks
- ❌ Edge cases where session still drops during navigation
- ❌ Intermittent 401 errors on valid sessions
- ❌ Some routes still show 16+ second auth delays
- ❌ Unclear when token refresh should happen vs cache hit

---

## Your Tasks (Spec 1.1-1.6)

### 1.1 Write Tests for JWT Caching Behavior

**Goal:** Ensure JWT caching works correctly and doesn't regress

**Test Cases to Add:**
```typescript
// File: apps/web/src/test/auth.session.test.ts

describe('JWT Caching', () => {
  it('should NOT query database on regular session checks', async () => {
    // Given: Valid cached JWT token
    // When: Regular session validation (no sign-in, no update)
    // Then: Returns cached token without DB query
  })

  it('should query database on sign-in', async () => {
    // Given: User signing in
    // When: JWT callback triggered with user object
    // Then: Queries DB to get full user data
  })

  it('should query database on explicit update trigger', async () => {
    // Given: Session update triggered
    // When: trigger === 'update'
    // Then: Rehydrates from DB to get fresh data
  })

  it('should handle Edge runtime correctly', async () => {
    // Given: Request in Edge runtime
    // When: JWT callback invoked
    // Then: Returns cached token (no Prisma call)
  })

  it('should maintain session across page navigation', async () => {
    // Given: User authenticated
    // When: Navigate Dashboard → Settings → Clients
    // Then: Session remains valid, no 401 errors
  })
})
```

**Files to Modify:**
- `apps/web/src/test/auth.session.test.ts` (may already exist, extend it)

---

### 1.2 Validate JWT Callback Runtime Detection

**Goal:** Ensure Edge vs Node.js detection works correctly

**Review Checklist:**
- [ ] Read current implementation in `apps/web/src/lib/auth.ts`
- [ ] Verify runtime detection logic is correct
- [ ] Check that Prisma imports are conditionally used
- [ ] Ensure cached token path is hit for regular checks
- [ ] Validate DB rehydration only happens when needed

**Expected Behavior:**
```typescript
// Pseudocode of correct logic
callbacks: {
  async jwt({ token, user, trigger, session }) {
    // CASE 1: Sign-in - Always rehydrate
    if (user) {
      // Query DB, build fresh token
      return freshToken
    }

    // CASE 2: Explicit update - Rehydrate
    if (trigger === 'update') {
      // Query DB, refresh token
      return refreshedToken
    }

    // CASE 3: Regular check - Use cache
    // This is 99% of requests!
    return token // Fast path
  }
}
```

**Common Bugs to Check:**
- Missing Edge runtime check before Prisma import
- Incorrect trigger detection
- Token expiry not handled
- Missing null checks

---

### 1.3 Test auth() Calls Complete Under 500ms

**Goal:** Benchmark and optimize authentication performance

**Implementation:**
```typescript
// Add to test suite
describe('Authentication Performance', () => {
  it('should complete auth() calls in < 500ms', async () => {
    const start = Date.now()
    await auth()
    const duration = Date.now() - start

    expect(duration).toBeLessThan(500)
  })

  it('should handle 100 concurrent auth checks efficiently', async () => {
    const start = Date.now()
    await Promise.all(
      Array(100).fill(0).map(() => auth())
    )
    const avgDuration = (Date.now() - start) / 100

    expect(avgDuration).toBeLessThan(100) // Even faster under load
  })
})
```

**Profiling:**
- Measure current performance
- Identify slow queries (if any)
- Check for N+1 problems
- Validate caching is working

---

### 1.4 Verify No Logout During Navigation

**Goal:** Test multi-page navigation doesn't drop sessions

**Test Scenario:**
```typescript
// Manual test checklist (can be automated later)
describe('Session Persistence', () => {
  it('should maintain session across route changes', async () => {
    // 1. Log in as test user
    // 2. Navigate: Dashboard → Settings
    // 3. Navigate: Settings → Clients
    // 4. Navigate: Clients → Calendar
    // 5. Navigate: Calendar → Dashboard
    // 6. Verify: Still authenticated, no 401 errors
  })

  it('should not trigger unnecessary token refreshes', async () => {
    // Monitor JWT callback invocations
    // Should only trigger on sign-in and explicit updates
    // NOT on every page load
  })
})
```

**Debugging Steps if Fails:**
- Check browser console for 401 errors
- Monitor network tab for failed API calls
- Review NextAuth debug logs
- Inspect JWT token structure

---

### 1.5 Add Monitoring for Session Persistence

**Goal:** Better observability for debugging session issues

**Add Logging:**
```typescript
// In auth.ts JWT callback
callbacks: {
  async jwt({ token, user, trigger }) {
    // Add structured logging
    console.log('[AUTH] JWT callback:', {
      hasCachedToken: !!token,
      hasUser: !!user,
      trigger,
      tokenExpiry: token?.exp,
      timestamp: Date.now()
    })

    // Existing logic...
  }
}
```

**Add Error Handling:**
```typescript
// Better error messages
try {
  const session = await auth()
  if (!session) {
    throw new AuthError('No active session found', {
      path: request.url,
      timestamp: Date.now()
    })
  }
} catch (error) {
  console.error('[AUTH] Session validation failed:', {
    error: error.message,
    stack: error.stack,
    context: 'requireTherapist'
  })
  throw error
}
```

---

### 1.6 Verify All Tests Pass

**Quality Gates:**
```bash
# Must all pass before submitting
pnpm typecheck           # 0 errors
pnpm lint                # < 5 warnings acceptable
pnpm test -- auth        # All auth tests passing
pnpm build               # Successful build
```

**Manual Validation:**
- [ ] Log in → navigate 5+ pages → still logged in
- [ ] No console errors during navigation
- [ ] API calls respond in < 3 seconds
- [ ] auth() calls measured < 500ms

---

## Key Files

### Primary Files to Modify
1. `apps/web/src/lib/auth.ts` - NextAuth configuration
2. `apps/web/src/test/auth.session.test.ts` - Test coverage

### Supporting Files (Reference Only)
3. `apps/web/src/lib/shared-helpers.ts` - auth() usage
4. `.agent-os/tasks/bug-001-session-management-fix.md` - Previous fix docs
5. `.agent-os/tasks/qa-retest-briefing-oct24.md` - QA findings

---

## Technical Constraints

### Must NOT Break
- ✅ Existing authentication flows (Google, credentials)
- ✅ Admin authentication system
- ✅ Password reset functionality
- ✅ Profile completion tracking

### Must Improve
- ❌ Session persistence across navigation → ✅
- ❌ auth() call performance (16s → 500ms) → ✅
- ❌ JWT caching correctness → ✅

### Edge Cases to Handle
- User token expires during active session
- Database connection failures
- Edge runtime limitations
- Concurrent auth() calls
- Session refresh timing

---

## Expected Deliverables

When complete, report back with:

### 1. Code Changes Summary
```markdown
**Files Modified:**
- apps/web/src/lib/auth.ts
  - Added: [describe changes]
  - Fixed: [describe bug fixes]
  - Improved: [describe optimizations]

- apps/web/src/test/auth.session.test.ts
  - Added: X new test cases
  - Coverage: [percentage or description]
```

### 2. Test Results
```markdown
**Test Coverage:**
- ✅ JWT caching tests: 5/5 passing
- ✅ Performance tests: 2/2 passing
- ✅ Navigation tests: 3/3 passing
- ✅ Edge runtime tests: 1/1 passing

**Performance Benchmarks:**
- auth() call average: XXXms (target: < 500ms)
- 95th percentile: XXXms
- Database queries per request: X (target: 0 for cached)
```

### 3. Issues Encountered
```markdown
**Blockers:** (if any)
- [Describe any blocking issues]

**Workarounds Applied:**
- [Describe any workarounds needed]

**Questions for Claude:**
- [Any architectural questions]
```

### 4. Recommended Next Steps
```markdown
**Follow-up Items:**
- [ ] [Any additional work needed]
- [ ] [Performance monitoring to add]
- [ ] [Documentation updates]
```

---

## Success Criteria

### Must Achieve (Demo Blockers)
- ✅ Zero session loss during normal navigation
- ✅ auth() calls consistently < 500ms
- ✅ All tests passing
- ✅ No TypeScript errors
- ✅ Build succeeds

### Nice to Have
- ✅ Detailed performance metrics
- ✅ Comprehensive logging
- ✅ Documentation of caching strategy

---

## Common Pitfalls to Avoid

1. **Breaking Edge Runtime**
   - Don't import Prisma unconditionally
   - Always check runtime before DB calls

2. **Caching Too Aggressively**
   - Must still refresh on sign-in
   - Must still refresh on explicit updates
   - Don't cache expired tokens

3. **Poor Error Handling**
   - Don't silently swallow auth errors
   - Provide actionable error messages
   - Log enough context for debugging

4. **Ignoring Token Expiry**
   - Check token.exp before using cached token
   - Handle refresh token flow properly
   - Don't return expired tokens

---

## References

**Previous Fix (Oct 23):**
- Commit: f2277e5
- Summary: "Added token caching check before DB lookup"

**QA Validation (Oct 24):**
- Tester: Comet agent
- Result: ✅ Performance validated, ⚠️ Edge cases remain

**Performance Target:**
- API calls: < 500ms (currently hitting this when working)
- Page loads: < 3 seconds (currently meeting this)
- Session persistence: 100% (currently ~85%)

---

## Questions?

If blocked or need clarification:
1. Check `.agent-os/tasks/bug-001-session-management-fix.md` for context
2. Review Oct 23-24 commits for previous fixes
3. Ask Claude for architectural guidance
4. Consult NextAuth v5 docs for JWT callback patterns

---

**Ready to begin!** Start by reading `auth.ts` and understanding the current implementation. Good luck! 🚀
