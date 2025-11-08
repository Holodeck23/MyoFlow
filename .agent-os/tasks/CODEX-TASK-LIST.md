# Codex Task List - Pre-Grant Critical Fixes

**Date:** November 8, 2025
**Branch:** Start from `beta-readiness-core-workflow`, create `fix/session-management`
**Priority:** P0 - DEMO BLOCKER
**Deadline:** Before tech2b grant interview

---

## Task 1: Fix Session Management & Authentication Performance

**Goal:** Eliminate session drops during navigation and reduce auth() call time from 16s to < 500ms

**Estimated Time:** 2-3 hours

### Subtasks:

**1.1 Write Tests for JWT Caching**
- [ ] Add tests to `apps/web/src/test/auth.session.test.ts`
- [ ] Test: JWT callback doesn't query DB on regular session checks
- [ ] Test: Edge runtime returns cached token
- [ ] Test: Server runtime rehydrates from DB when needed (sign-in, update trigger)
- [ ] Test: Navigation between pages maintains session
- [ ] Test: Performance benchmark - auth() calls < 500ms

**1.2 Review & Fix JWT Callback Implementation**
- [ ] Review current code in `apps/web/src/lib/auth.ts`
- [ ] Verify Edge vs Node.js runtime detection works correctly
- [ ] Ensure Prisma calls only happen in Node.js runtime
- [ ] Confirm cached token returned for regular session checks (99% of requests)
- [ ] Check token expiry handling
- [ ] Fix any edge cases causing session drops

**1.3 Add Performance Benchmarking**
- [ ] Measure current auth() call times
- [ ] Identify slow database queries (if any)
- [ ] Target: 95th percentile < 500ms
- [ ] Add performance tests to test suite

**1.4 Test Multi-Page Navigation**
- [ ] Manual test: Dashboard → Settings → Clients → Calendar → back to Dashboard
- [ ] Verify: No 401 errors
- [ ] Verify: No unexpected logouts
- [ ] Verify: Session stays valid throughout

**1.5 Add Session Monitoring**
- [ ] Add structured logging for session validation failures
- [ ] Track JWT refresh events
- [ ] Monitor session timeout edge cases
- [ ] Add helpful error messages for debugging

**1.6 Quality Gates**
- [ ] All new tests passing
- [ ] TypeScript: 0 errors
- [ ] Existing tests still passing
- [ ] Manual navigation test successful
- [ ] Performance benchmarks met

### Key Files:
- `apps/web/src/lib/auth.ts` - Main fix location
- `apps/web/src/test/auth.session.test.ts` - Test coverage
- `apps/web/src/lib/shared-helpers.ts` - auth() usage

### Reference:
- `.agent-os/tasks/codex-brief-task1-session-management.md` - Detailed briefing
- `.agent-os/tasks/bug-001-session-management-fix.md` - Previous fix (Oct 23)
- `.agent-os/tasks/qa-retest-briefing-oct24.md` - QA findings

### Success Criteria:
- ✅ Zero session loss during normal navigation
- ✅ auth() calls consistently < 500ms
- ✅ All tests passing with good coverage
- ✅ No TypeScript errors
- ✅ Build succeeds

---

## Task 2: Fix Appointment Modal Dropdowns

**Goal:** Client/Service/Location dropdowns populate with real data instead of showing placeholders only

**Estimated Time:** 1-2 hours

### Subtasks:

**2.1 Write Tests for Dropdown Data Loading**
- [ ] Add tests for `/api/clients`, `/api/services`, `/api/locations` endpoints
- [ ] Test: Endpoints return data in < 500ms
- [ ] Test: Response format matches what modal expects
- [ ] Test: Empty state handled gracefully

**2.2 Debug API Endpoint Timeouts**
- [ ] Investigate why endpoints timing out (16+ seconds)
- [ ] Check if this is cascade from slow auth() (Task 1)
- [ ] Profile database queries
- [ ] Fix any N+1 query problems

**2.3 Fix Calendar Page API Response Handling**
- [ ] Review `apps/web/app/dashboard/calendar/page.tsx:102-114`
- [ ] Fix array handling: `Array.isArray(data) ? data : []`
- [ ] Ensure modal receives data in correct format
- [ ] Test dropdown population after data fetch

**2.4 Test Appointment Creation End-to-End**
- [ ] Open appointment modal
- [ ] Verify: Client dropdown shows actual clients (not "Client Placeholder")
- [ ] Verify: Service dropdown shows services
- [ ] Verify: Location dropdown shows locations
- [ ] Create appointment successfully

**2.5 Quality Gates**
- [ ] All dropdown tests passing
- [ ] API endpoints respond < 500ms
- [ ] TypeScript: 0 errors
- [ ] Manual test: Can create appointment with all fields

### Key Files:
- `apps/web/app/dashboard/calendar/page.tsx` - Data loading logic
- `apps/web/app/dashboard/calendar/components/AppointmentModal.tsx` - Dropdown rendering
- `apps/web/app/api/clients/route.ts` - Client data endpoint
- `apps/web/app/api/services/route.ts` - Service data endpoint
- `apps/web/app/api/locations/route.ts` - Location data endpoint

### Success Criteria:
- ✅ Dropdowns populate with real data
- ✅ API calls < 500ms
- ✅ Can create appointments successfully
- ✅ No "Placeholder" text visible

---

## Task 3: Quick Win Fixes

**Goal:** Fix easy bugs that improve UX

**Estimated Time:** 1 hour

### Subtasks:

**3.1 Fix Country Field Default Value**
- [ ] Edit `apps/web/app/dashboard/clients/new/page.tsx:28`
- [ ] Change `country: ''` to `country: 'Austria'`
- [ ] Test: Country field pre-filled on page load
- [ ] Test: Form submits successfully with pre-filled country

**3.2 Add ENCRYPTION_KEY_B64 to Environment**
- [ ] Add to `.env.example` with generation command
- [ ] Document in README setup instructions
- [ ] Generate key: `openssl rand -base64 32`
- [ ] Test: Client notes creation no longer fails

**3.3 Test Client Creation Form**
- [ ] Fill all required fields
- [ ] Submit form
- [ ] Verify: Client created successfully
- [ ] Verify: Redirects to client detail page
- [ ] Verify: No validation errors with default country

**3.4 Quality Gates**
- [ ] TypeScript: 0 errors
- [ ] Client creation tests passing
- [ ] Manual test successful

### Key Files:
- `apps/web/app/dashboard/clients/new/page.tsx` - Country default
- `.env.example` - Encryption key documentation
- `README.md` - Setup instructions

### Success Criteria:
- ✅ Country field works intuitively
- ✅ Client notes creation works
- ✅ No silent form failures

---

## Execution Instructions

### Setup:
```bash
# Ensure on latest beta branch
git checkout beta-readiness-core-workflow
git pull origin beta-readiness-core-workflow

# Create feature branch
git checkout -b fix/session-management

# Ensure dependencies installed
pnpm install

# Start dev server
pnpm dev
```

### Work Order:
1. **Start with Task 1** (session management) - this fixes root cause
2. **Then Task 2** (dropdowns) - likely fixed by Task 1 but verify
3. **Then Task 3** (quick wins) - easy fixes to round it out

### After Each Task:
```bash
# Quality gates
pnpm typecheck  # Must pass
pnpm lint       # < 5 warnings OK
pnpm test       # All tests passing
pnpm build      # Must succeed

# Commit
git add .
git commit -m "fix(task-name): description"
```

### When Complete:
```bash
# Push branch
git push origin fix/session-management

# Report back to Claude with:
# 1. Summary of changes
# 2. Test results
# 3. Any issues encountered
# 4. Recommended next steps
```

---

## Important Notes

### Must Not Break:
- ✅ Existing auth flows (Google, credentials)
- ✅ Admin authentication
- ✅ Password reset
- ✅ Profile completion tracking

### Common Pitfalls:
- Edge runtime can't use Prisma - use cached tokens
- Don't cache too aggressively - must refresh on sign-in/update
- Check token expiry before using cached token
- Handle auth errors gracefully with good messages

### Testing Strategy:
- Unit tests for logic
- Manual tests for UX flows
- Performance benchmarks for speed
- TypeScript for type safety

### Questions?
- Check detailed brief: `.agent-os/tasks/codex-brief-task1-session-management.md`
- Review previous fixes: `.agent-os/tasks/bug-001-session-management-fix.md`
- Ask Claude for clarification

---

**Ready to execute!** Start with Task 1, report progress after each subtask, and we'll get this app demo-ready! 🚀
