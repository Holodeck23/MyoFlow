# Security Remediation - Task Breakdown

**Spec:** Security Remediation & Code Quality Hardening
**Created:** 2025-10-24
**Branch:** `security-remediation`
**Timeline:** 3 weeks

---

## Week 1 - P0 Critical Security (Days 1-5)

### 1.1 Middleware API Route Protection (2 days)

**Status:** ⏸️ Not Started
**Priority:** P0 - CRITICAL
**Assignee:** TBD
**Estimated:** 8 hours

#### Subtasks

- [ ] 1.1.1 Audit current middleware configuration (`apps/web/middleware.ts`)
  - Review existing matcher patterns
  - Identify all API routes requiring protection
  - Document public endpoints that should remain unprotected
  - **Files:** `apps/web/middleware.ts`
  - **Time:** 1 hour

- [ ] 1.1.2 Update middleware matcher to include API routes
  - Add `/api/:path*` to matcher array
  - Configure exclusions for public endpoints:
    - `/api/webhooks/*` (Stripe webhooks with signature validation)
    - `/api/health` (health check endpoint)
    - `/api/intake/public/:token` (public intake forms)
  - **Files:** `apps/web/middleware.ts:48-50`
  - **Time:** 2 hours

- [ ] 1.1.3 Implement authentication logic for API routes
  - Check session for all `/api/*` requests
  - Return 401 Unauthorized for missing/invalid sessions
  - Return 403 Forbidden for insufficient permissions (admin routes)
  - Ensure no data leakage in error responses
  - **Files:** `apps/web/middleware.ts`
  - **Time:** 3 hours

- [ ] 1.1.4 Create unit tests for middleware
  - Test matcher includes API routes
  - Test public endpoints excluded correctly
  - Test authentication check enforcement
  - Test error response formats
  - **Files:** `apps/web/middleware.test.ts` (new)
  - **Time:** 2 hours

**Validation:**
- [ ] All API routes return 401 when accessed without authentication
- [ ] Public endpoints remain accessible without authentication
- [ ] Admin routes return 403 for non-admin users
- [ ] Unit tests passing with 100% coverage
- [ ] No performance regression (< 50ms overhead)

---

### 1.2 E2E Security Test Suite (3 days)

**Status:** ⏸️ Not Started
**Priority:** P0 - CRITICAL
**Assignee:** TBD
**Estimated:** 16 hours

#### Subtasks

- [ ] 1.2.1 Enable E2E tests in CI configuration
  - Remove `if: false` condition from `.github/workflows/ci.yml`
  - Configure test environment variables (DATABASE_URL, AUTH_ENABLE_DEMO)
  - Install Playwright dependencies in CI
  - **Files:** `.github/workflows/ci.yml:82-83`
  - **Time:** 1 hour

- [ ] 1.2.2 Create authentication bypass test suite
  - Test unauthenticated API access blocked (401)
  - Test expired session tokens rejected
  - Test invalid session tokens rejected
  - Test session fixation attacks prevented
  - **Files:** `apps/web/e2e/security/auth-bypass.spec.ts` (new)
  - **Time:** 3 hours

- [ ] 1.2.3 Create authorization test suite
  - Test therapist cannot access admin endpoints (403)
  - Test admin can access admin endpoints (200)
  - Test role-based access control for different user types
  - Test cross-account data access prevented
  - **Files:** `apps/web/e2e/security/authorization.spec.ts` (new)
  - **Time:** 3 hours

- [ ] 1.2.4 Create session security test suite
  - Test session invalidation on logout
  - Test session expiry after 30 days
  - Test concurrent session handling
  - Test session refresh behavior
  - **Files:** `apps/web/e2e/security/session-security.spec.ts` (new)
  - **Time:** 3 hours

- [ ] 1.2.5 Create API security test suite
  - Test all client endpoints require authentication
  - Test all invoice endpoints require authentication
  - Test all appointment endpoints require authentication
  - Test all settings endpoints require authentication
  - **Files:** `apps/web/e2e/security/api-security.spec.ts` (new)
  - **Time:** 3 hours

- [ ] 1.2.6 Create CSRF protection test suite
  - Test state parameter validation in OAuth flows
  - Test CSRF token enforcement for mutations
  - Test origin validation for requests
  - **Files:** `apps/web/e2e/security/csrf-protection.spec.ts` (new)
  - **Time:** 2 hours

- [ ] 1.2.7 Create test utilities and helpers
  - Implement `signInAsTherapist()` helper
  - Implement `signInAsAdmin()` helper
  - Implement test account seeding
  - Implement session token utilities
  - **Files:** `apps/web/e2e/utils/auth-helpers.ts` (new)
  - **Time:** 1 hour

**Validation:**
- [ ] Minimum 20 security tests across 5 test files created
- [ ] All tests passing (100% pass rate)
- [ ] CI job succeeds with E2E tests enabled
- [ ] Test runtime < 5 minutes
- [ ] Test coverage report generated

---

## Week 2 - P1 High-Risk Issues (Days 6-10)

### 2.1 Encryption Module Consolidation (2 days)

**Status:** ⏸️ Not Started
**Priority:** P1 - HIGH
**Assignee:** TBD
**Estimated:** 8 hours

#### Subtasks

- [ ] 2.1.1 Audit all encryption module usages
  - Search codebase for imports of `encryption.ts`
  - Search codebase for imports of `security/crypto.ts`
  - Document all locations using encryption
  - Identify migration requirements for each usage
  - **Command:** `grep -r "from '@myoflow/lib/encryption'" apps/ packages/`
  - **Time:** 2 hours

- [ ] 2.1.2 Verify crypto.ts implementation completeness
  - Review encrypt/decrypt functions
  - Verify key generation and validation
  - Ensure error handling comprehensive
  - Add missing functionality if needed
  - **Files:** `packages/lib/src/security/crypto.ts`
  - **Time:** 1 hour

- [ ] 2.1.3 Migrate all usages to crypto.ts
  - Update imports from `encryption` to `security/crypto`
  - Add decrypt calls where data needs to be read
  - Update key management to use ENCRYPTION_KEY_B64
  - Test each migration individually
  - **Files:** All files using encryption (estimated 8-12 files)
  - **Time:** 3 hours

- [ ] 2.1.4 Remove deprecated encryption module
  - Delete `packages/lib/src/encryption.ts`
  - Update `packages/lib/src/index.ts` exports
  - Verify no remaining imports of old module
  - **Files:** `packages/lib/src/encryption.ts`, `packages/lib/src/index.ts`
  - **Time:** 1 hour

- [ ] 2.1.5 Create integration tests
  - Test encrypt/decrypt roundtrip
  - Test key generation
  - Test error handling (invalid keys, corrupted data)
  - Test backward compatibility with existing encrypted data
  - **Files:** `packages/lib/src/security/crypto.test.ts` (new)
  - **Time:** 1 hour

**Validation:**
- [ ] Zero remaining imports of `encryption.ts`
- [ ] All encryption using `security/crypto.ts`
- [ ] All integration tests passing
- [ ] Existing encrypted data still decryptable
- [ ] TypeScript build succeeds with no errors

---

### 2.2 Secret Management Hardening (3 days)

**Status:** ⏸️ Not Started
**Priority:** P1 - HIGH
**Assignee:** TBD
**Estimated:** 12 hours

#### Subtasks

- [ ] 2.2.1 Document all required secrets in .env.example
  - Add comprehensive comments for each secret
  - Provide generation commands (e.g., `openssl rand -base64 32`)
  - Specify minimum length requirements
  - Document format requirements (e.g., base64 for ENCRYPTION_KEY_B64)
  - **Files:** `.env.example`
  - **Time:** 2 hours

- [ ] 2.2.2 Create startup validation script
  - Implement `validateSecrets()` function
  - Define `REQUIRED_SECRETS` configuration array
  - Check for missing required secrets
  - Validate minimum length requirements
  - Validate format patterns (e.g., base64)
  - Check for placeholder values (e.g., "change-me")
  - **Files:** `packages/lib/src/config/validate-secrets.ts` (new)
  - **Time:** 3 hours

- [ ] 2.2.3 Integrate validation into startup flow
  - Import validation in production builds
  - Run validation before app initialization
  - Exit with clear error messages if validation fails
  - **Files:** `apps/web/instrumentation.ts` or `apps/web/app/layout.tsx`
  - **Time:** 1 hour

- [ ] 2.2.4 Audit codebase for secret exposure
  - Search for `console.log` statements with env vars
  - Search for logging of passwords/secrets
  - Search for error messages exposing secrets
  - Implement masked logging where needed
  - **Command:** `grep -r "console.log.*env\." apps/ packages/`
  - **Time:** 2 hours

- [ ] 2.2.5 Create secret management documentation
  - Document all required secrets with descriptions
  - Provide secure generation methods
  - Document rotation procedures
  - Document emergency revocation process
  - **Files:** `docs/deployment/secrets.md` (new)
  - **Time:** 2 hours

- [ ] 2.2.6 Create validation tests
  - Test validation passes with valid secrets
  - Test validation fails with missing secrets
  - Test validation fails with weak secrets
  - Test validation fails with placeholder values
  - **Files:** `packages/lib/src/config/validate-secrets.test.ts` (new)
  - **Time:** 2 hours

**Validation:**
- [ ] All required secrets documented in .env.example
- [ ] Validation script catches all missing/weak secrets
- [ ] Production build fails with invalid secrets
- [ ] No secrets exposed in logs or error messages
- [ ] Unit tests passing with 100% coverage
- [ ] Documentation complete and reviewed

---

## Week 3 - P2 Code Quality (Days 11-15)

### 3.1 Magic Number Extraction (2 days)

**Status:** ⏸️ Not Started
**Priority:** P2 - MEDIUM
**Assignee:** TBD
**Estimated:** 10 hours

#### Subtasks

- [ ] 3.1.1 Identify all magic numbers in codebase
  - Search for hardcoded numeric values
  - Search for string literals used as configuration
  - Prioritize by frequency and impact
  - Document each magic number with context
  - **Time:** 2 hours

- [ ] 3.1.2 Create constants directory structure
  - Create `packages/lib/src/constants/` directory
  - Create domain-specific constant files:
    - `profile.ts` - Profile completion thresholds
    - `session.ts` - Session/JWT configuration
    - `rate-limits.ts` - API rate limiting
    - `compliance.ts` - Austrian compliance thresholds
    - `validation.ts` - Validation rules
  - Create `index.ts` with re-exports
  - **Files:** `packages/lib/src/constants/` (new directory)
  - **Time:** 1 hour

- [ ] 3.1.3 Extract profile completion constants
  - Extract `COMPLETE_THRESHOLD: 100`
  - Extract `WARNING_THRESHOLD: 70`
  - Extract field scoring points
  - Document each constant with comments
  - **Files:** `packages/lib/src/constants/profile.ts` (new)
  - **Time:** 1 hour

- [ ] 3.1.4 Extract session/JWT constants
  - Extract `JWT_MAX_AGE: 30 * 24 * 60 * 60`
  - Extract `COOKIE_MAX_AGE: 30 * 24 * 60 * 60`
  - Extract cookie names
  - Document session configuration
  - **Files:** `packages/lib/src/constants/session.ts` (new)
  - **Time:** 1 hour

- [ ] 3.1.5 Extract rate limiting constants
  - Extract invoice generation limits
  - Extract client creation limits
  - Extract general API limits
  - Document rate limiting strategy
  - **Files:** `packages/lib/src/constants/rate-limits.ts` (new)
  - **Time:** 1 hour

- [ ] 3.1.6 Extract compliance constants
  - Extract RKSV revenue threshold (€15,000)
  - Extract VAT thresholds
  - Extract postal code patterns
  - Document Austrian compliance rules
  - **Files:** `packages/lib/src/constants/compliance.ts` (new)
  - **Time:** 1 hour

- [ ] 3.1.7 Update all references to use constants
  - Replace hardcoded values with named constants
  - Import constants from `@myoflow/lib/constants`
  - Verify functionality unchanged
  - **Files:** Estimated 20-30 files across apps/web and packages
  - **Time:** 3 hours

**Validation:**
- [ ] All magic numbers identified and categorized
- [ ] Constants extracted to organized files
- [ ] All references updated to use named constants
- [ ] TypeScript build succeeds with no errors
- [ ] Functionality unchanged (all tests passing)
- [ ] Constants documented with clear comments

---

### 3.2 TODO Inventory & Tracking (1 day)

**Status:** ⏸️ Not Started
**Priority:** P2 - MEDIUM
**Assignee:** TBD
**Estimated:** 6 hours

#### Subtasks

- [ ] 3.2.1 Create TODO scanning script
  - Implement file scanning logic
  - Implement TODO pattern matching (TODO, FIXME, HACK, NOTE)
  - Extract TODO metadata (file, line, type, author, text)
  - Implement priority classification logic
  - **Files:** `scripts/scan-todos.ts` (new)
  - **Time:** 2 hours

- [ ] 3.2.2 Generate technical debt inventory
  - Run scanning script on entire codebase
  - Group TODOs by priority (P0, P1, P2, P3)
  - Generate markdown report
  - Save to tracking document
  - **Files:** `.agent-os/tasks/technical-debt.md` (generated)
  - **Command:** `pnpm scan-todos`
  - **Time:** 1 hour

- [ ] 3.2.3 Create GitHub issues for high-priority TODOs
  - Identify P0 and P1 TODOs
  - Create GitHub issue for each (using `gh` CLI)
  - Link issues to TODO comments in code
  - Apply appropriate labels (technical-debt, security, etc.)
  - **Time:** 1 hour

- [ ] 3.2.4 Document TODO policy
  - Add TODO comment guidelines to DEVELOPMENT.md
  - Specify format: `TODO-<AUTHOR>: description`
  - Define priority indicators
  - Establish resolution timeline expectations
  - Document when to create GitHub issues
  - **Files:** `DEVELOPMENT.md`
  - **Time:** 1 hour

- [ ] 3.2.5 Add scan-todos to package.json scripts
  - Add `"scan-todos": "tsx scripts/scan-todos.ts"` to scripts
  - Document usage in README
  - Consider adding to pre-release checks
  - **Files:** `package.json`
  - **Time:** 0.5 hours

- [ ] 3.2.6 Review and categorize existing TODOs
  - Review generated inventory
  - Update priority classifications if needed
  - Remove obsolete TODOs
  - Add resolution timelines to high-priority items
  - **Time:** 0.5 hours

**Validation:**
- [ ] Scanning script successfully finds all TODOs
- [ ] Technical debt inventory generated
- [ ] P0/P1 TODOs have GitHub issues created
- [ ] TODO policy documented in DEVELOPMENT.md
- [ ] Script added to package.json
- [ ] Inventory reviewed and prioritized

---

### 3.3 Documentation & Final Testing (2 days)

**Status:** ⏸️ Not Started
**Priority:** P2 - MEDIUM
**Assignee:** TBD
**Estimated:** 8 hours

#### Subtasks

- [ ] 3.3.1 Update README.md with security improvements
  - Document new security features
  - Update authentication section
  - Add E2E testing information
  - Add secret management section
  - **Files:** `README.md`
  - **Time:** 1 hour

- [ ] 3.3.2 Create secret management documentation
  - Document all required secrets
  - Provide generation commands
  - Document validation process
  - Document rotation procedures
  - **Files:** `docs/deployment/secrets.md` (if not done in 2.2.5)
  - **Time:** 2 hours (if needed)

- [ ] 3.3.3 Update DEVELOPMENT.md
  - Add security testing section
  - Add TODO policy (if not done in 3.2.4)
  - Update contribution guidelines
  - Document constants usage pattern
  - **Files:** `DEVELOPMENT.md`
  - **Time:** 1 hour

- [ ] 3.3.4 Run full quality gate checks
  - Run `pnpm typecheck` (ensure 0 errors)
  - Run `pnpm lint` (ensure 0 errors)
  - Run `pnpm build` (ensure success)
  - Run `pnpm test` (ensure 100% pass)
  - **Time:** 1 hour

- [ ] 3.3.5 Run comprehensive E2E test suite
  - Run all security tests
  - Run all functional tests
  - Verify 100% pass rate
  - Review test coverage report
  - **Time:** 1 hour

- [ ] 3.3.6 Performance validation
  - Measure middleware overhead (target: < 50ms)
  - Measure E2E test runtime (target: < 5min)
  - Measure encryption performance (target: < 100ms)
  - Verify no regression from baseline
  - **Time:** 1 hour

- [ ] 3.3.7 Create HANDOFF.md for spec
  - Document all changes made
  - List all files modified/created
  - Document validation results
  - Provide next steps and recommendations
  - **Files:** `.agent-os/specs/2025-10-24-security-remediation/HANDOFF.md` (new)
  - **Time:** 1 hour

**Validation:**
- [ ] All documentation updated and reviewed
- [ ] All quality gates passing (typecheck, lint, build, test)
- [ ] All E2E tests passing (100% pass rate)
- [ ] Performance targets met
- [ ] HANDOFF.md complete and comprehensive

---

## Summary

### Task Statistics

**Total Tasks:** 6 major components
**Total Subtasks:** 38 individual tasks
**Total Estimated Time:** 68 hours (~3 weeks with 1 developer)

### Priority Breakdown

- **P0 (Critical):** 2 components, 11 subtasks, 24 hours
- **P1 (High):** 2 components, 11 subtasks, 20 hours
- **P2 (Medium):** 2 components, 16 subtasks, 24 hours

### Week-by-Week Timeline

**Week 1 (P0):**
- Middleware API protection (2 days)
- E2E security test suite (3 days)

**Week 2 (P1):**
- Encryption consolidation (2 days)
- Secret management (3 days)

**Week 3 (P2):**
- Magic number extraction (2 days)
- TODO inventory (1 day)
- Documentation & testing (2 days)

### Success Criteria

- [ ] All API routes protected by authentication middleware
- [ ] E2E security tests enabled and passing in CI (100% pass rate)
- [ ] Single unified encryption module (security/crypto.ts)
- [ ] All secrets validated at startup with clear documentation
- [ ] All magic numbers extracted to named constants
- [ ] Technical debt inventory complete with tracking
- [ ] All quality gates passing (typecheck, lint, build, test)
- [ ] Performance targets met (< 50ms middleware, < 5min E2E)
- [ ] Documentation complete and comprehensive

### Risk Mitigation

- **Daily standup:** Review progress, identify blockers
- **Weekly checkpoint:** Validate deliverables, adjust timeline if needed
- **Continuous testing:** Run quality gates after each component
- **Incremental commits:** Commit after each subtask completion
- **Code review:** Review all P0/P1 changes before Week 2

### Handoff Requirements

Before marking this spec complete:
1. All tasks marked as completed ✅
2. HANDOFF.md created with comprehensive summary
3. All quality gates passing
4. All E2E tests passing in CI
5. Documentation reviewed and approved
6. Performance validated against targets
