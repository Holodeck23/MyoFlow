# Pre-Grant Demo Critical Fixes - Tasks

**Created:** 2025-11-08
**Priority:** P0 - DEMO BLOCKER
**Target:** Fix before tech2b grant interview
**Estimated Time:** 6-8 hours

---

## Tasks

### Phase 1: Critical Path (Must Complete)

- [ ] 1. Fix Session Management & Authentication Performance
  - [ ] 1.1 Write tests for JWT caching behavior across navigation
  - [ ] 1.2 Validate JWT callback runtime detection (Edge vs Node.js)
  - [ ] 1.3 Test auth() calls complete under 500ms consistently
  - [ ] 1.4 Verify users don't get logged out during page navigation
  - [ ] 1.5 Add monitoring for session persistence edge cases
  - [ ] 1.6 Verify all tests pass

- [ ] 2. Fix Appointment Modal Dropdowns (Empty Data Issue)
  - [ ] 2.1 Write tests for dropdown data loading
  - [ ] 2.2 Debug why Client/Service/Location API endpoints timing out
  - [ ] 2.3 Fix API response handling in calendar page (apps/web/app/dashboard/calendar/page.tsx)
  - [ ] 2.4 Ensure dropdowns populate with actual data (not just placeholders)
  - [ ] 2.5 Test appointment creation end-to-end flow
  - [ ] 2.6 Verify all tests pass

- [ ] 3. Quick Win Fixes
  - [ ] 3.1 Fix Country field default value (apps/web/app/dashboard/clients/new/page.tsx:28)
  - [ ] 3.2 Add ENCRYPTION_KEY_B64 to .env and .env.example with generation instructions
  - [ ] 3.3 Commit translation fix in OverviewTab.tsx (already implemented)
  - [ ] 3.4 Test client creation form with all validation scenarios
  - [ ] 3.5 Verify all tests pass

### Phase 2: High Priority (Should Complete)

- [ ] 4. Admin System Completion
  - [ ] 4.1 Write tests for admin login API with edge cases
  - [ ] 4.2 Fix JSON parsing error in admin login route (apps/web/app/api/admin/login/route.ts:18)
  - [ ] 4.3 Increase Playwright E2E timeout from 30s to 60s
  - [ ] 4.4 Test admin redirect flow (/admin → /admin/dashboard)
  - [ ] 4.5 Validate admin authentication works end-to-end
  - [ ] 4.6 Verify all tests pass

- [ ] 5. Client Notes Creation Fix
  - [ ] 5.1 Write tests for note creation API
  - [ ] 5.2 Debug POST /api/clients/[id]/notes endpoint failure
  - [ ] 5.3 Fix note persistence to database
  - [ ] 5.4 Test note creation from client detail page
  - [ ] 5.5 Verify success feedback displays correctly
  - [ ] 5.6 Verify all tests pass

- [ ] 6. Settings Profile Performance Optimization
  - [ ] 6.1 Profile current /api/settings/profile endpoint performance
  - [ ] 6.2 Identify slow database queries or N+1 issues
  - [ ] 6.3 Optimize profile data loading (target: < 3 seconds)
  - [ ] 6.4 Add proper loading states to prevent premature error display
  - [ ] 6.5 Test profile tab load time under various conditions
  - [ ] 6.6 Verify all tests pass

### Phase 3: Demo Preparation

- [ ] 7. End-to-End Demo Flow Testing
  - [ ] 7.1 Test: Fresh signup → onboarding completion
  - [ ] 7.2 Test: Create client → schedule appointment
  - [ ] 7.3 Test: Generate invoice PDF with complete profile
  - [ ] 7.4 Test: Travel calculations display correctly
  - [ ] 7.5 Test: Austrian compliance features (VAT, RKSV, postal codes)
  - [ ] 7.6 Document demo flow script for grant interview

---

## Success Criteria

**Critical (Must Work):**
- ✅ Users can navigate app without session loss
- ✅ Appointment modal dropdowns populate with data
- ✅ Client creation form works with clear validation
- ✅ Core API responses under 3 seconds

**High Priority (Should Work):**
- ✅ Admin panel accessible and functional
- ✅ Client notes can be created and saved
- ✅ Settings profile loads in reasonable time (< 5s)

**Demo Ready:**
- ✅ End-to-end user flow works smoothly
- ✅ Austrian compliance features showcase-ready
- ✅ No console errors during critical operations
- ✅ Professional UX with proper error handling

---

## Technical Notes

### Known Issues Being Fixed
1. **Session Management** - JWT callback Edge runtime issue (fixed Oct 23, needs validation)
2. **API Timeouts** - auth() taking 16+ seconds (cascade from #1)
3. **Admin Login** - JSON parsing on empty body (line 18)
4. **Dropdown Data** - API endpoints not returning data to modal
5. **Country Field** - Placeholder doesn't count as actual value
6. **Encryption Key** - Missing from .env causing note creation to fail

### Files Requiring Changes
- `apps/web/src/lib/auth.ts` - JWT caching logic
- `apps/web/app/dashboard/calendar/page.tsx` - Dropdown data handling
- `apps/web/app/dashboard/clients/new/page.tsx` - Country default value
- `apps/web/app/api/admin/login/route.ts` - JSON parsing fix
- `apps/web/app/api/clients/[id]/notes/route.ts` - Note creation
- `apps/web/app/api/settings/profile/route.ts` - Performance optimization
- `apps/web/.env.example` - ENCRYPTION_KEY_B64 documentation
- `apps/web/e2e/admin.spec.ts` - Timeout configuration

### Quality Gates
- TypeScript: 0 errors
- ESLint: < 5 warnings
- Unit tests: All passing
- E2E tests: Critical paths passing
- Build: Success
- Performance: API < 3s, auth < 500ms

---

## Execution Strategy

**Lead:** Claude (planning, review, git management)
**Execution:** Codex (implementation)
**Testing:** Manual validation + automated tests
**Approach:** One task at a time, PR per phase

**Branch Strategy:**
- Create feature branch: `fix/pre-grant-critical-fixes`
- One commit per major task
- Squash merge to `beta-readiness-core-workflow` after review
