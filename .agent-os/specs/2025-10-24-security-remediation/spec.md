# Spec Requirements Document

> Spec: Security Remediation & Code Quality Hardening
> Created: 2025-10-24

## Overview

Comprehensive security hardening and code quality improvements to address critical vulnerabilities identified in security audit. This specification consolidates fixes for unprotected API routes, disabled security tests, encryption module conflicts, insecure secret management, and technical debt across the codebase into a single remediation branch.

## User Stories

### Therapist Creating Invoices via API

As a therapist using MyoFlow's invoice generation features, I want to be confident that my client data and business information are protected by proper authentication on all API endpoints, so that unauthorized users cannot access or manipulate sensitive financial and medical records.

**Workflow:** Therapist logs in → creates invoice → API validates session token → performs authorization checks → returns invoice data only if authenticated and authorized → unauthorized requests receive 401/403 errors with no data leakage.

**Problem Solved:** Eliminates critical security vulnerability where API routes are unprotected by authentication middleware, allowing potential unauthorized access to sensitive patient and financial data.

### Platform Admin Monitoring Security

As a platform administrator, I want comprehensive E2E security tests running in CI/CD to catch authentication bypasses and authorization failures before they reach production, so that we maintain GDPR compliance and protect our users' sensitive health data.

**Workflow:** Developer pushes code → CI runs E2E security tests → tests verify authentication on all protected routes → tests verify authorization logic for role-based access → deployment blocked if tests fail → security regressions caught before production.

**Problem Solved:** Addresses disabled E2E test suite (`if: false` in CI config) which leaves security vulnerabilities undetected until production.

### Developer Implementing Encryption

As a developer implementing data encryption features, I want a single, well-tested encryption module with clear API contracts, so that I don't accidentally use the wrong implementation or create security vulnerabilities through inconsistent encryption patterns.

**Workflow:** Developer needs to encrypt client notes → imports from `@myoflow/lib/security/crypto` → uses `encrypt()` with proper key management → data encrypted with XChaCha20-Poly1305 → later retrieves with `decrypt()` → no confusion about which module to use.

**Problem Solved:** Eliminates duplicate/conflicting encryption modules (`encryption.ts` with incomplete implementation vs `security/crypto.ts` with full implementation), preventing security issues from using wrong module.

### Operations Team Managing Secrets

As an operations engineer deploying MyoFlow, I want clear documentation and validation for all required secrets with secure generation methods, so that I don't accidentally deploy with weak keys or expose secrets in logs/version control.

**Workflow:** Deploy new environment → check `.env.example` for all required secrets → use provided generation commands (e.g., `openssl rand -base64 32`) → validation on startup confirms all secrets meet minimum requirements → clear error messages if secrets missing/weak → deployment succeeds with secure configuration.

**Problem Solved:** Addresses insecure secret management concerns including weak key generation, unclear secret requirements, and potential exposure in logs.

## Spec Scope

### Priority 0 - Critical Security Vulnerabilities

1. **API Route Authentication Protection** - Extend Next.js middleware matcher to protect `/api/*` routes with authentication, preventing unauthorized access to all API endpoints
2. **E2E Security Test Suite** - Enable and expand Playwright test suite with comprehensive security validation including authentication bypass tests, authorization tests, CSRF protection, and session security

### Priority 1 - High-Risk Issues

3. **Encryption Module Consolidation** - Remove duplicate encryption implementations, standardize on `@myoflow/lib/security/crypto`, migrate any legacy code using `encryption.ts`
4. **Secret Management Hardening** - Document all required secrets, implement startup validation, provide secure generation commands, audit for secret exposure in logs

### Priority 2 - Code Quality & Maintainability

5. **Magic Number Extraction** - Extract hardcoded values (e.g., `profileScore < 70`, rate limits, thresholds) into named constants with clear documentation
6. **TODO Inventory & Tracking** - Catalog all TODO/FIXME comments, create tracking issues, prioritize by impact, establish resolution timeline

## Out of Scope

- Penetration testing by external security firm (separate engagement post-remediation)
- OAuth2/OIDC provider integration beyond existing Google auth (separate spec)
- Advanced rate limiting with Redis clustering (separate performance spec)
- Data retention and GDPR right-to-erasure automation (separate compliance spec)
- Security incident response playbook (separate operational spec)
- Bug bounty program establishment (post-launch initiative)

## Expected Deliverables

### P0 - Critical Security (Week 1)

1. **Middleware Configuration** (`apps/web/middleware.ts`)
   - Matcher updated to include `/api/:path*` with proper exclusions for public endpoints
   - Authentication check enforced on all protected API routes
   - Clear error responses (401/403) for unauthorized access
   - Unit tests for middleware matching logic

2. **E2E Security Test Suite** (`.github/workflows/ci.yml`, `apps/web/e2e/security/`)
   - CI workflow enabled (`if: false` removed)
   - Authentication bypass tests for all protected routes
   - Authorization tests for role-based access (therapist vs admin)
   - Session security tests (expiry, invalidation, CSRF)
   - API endpoint security tests (require valid session tokens)
   - Test coverage report in CI output

### P1 - High-Risk Issues (Week 2)

3. **Unified Encryption Module** (`packages/lib/src/security/crypto.ts`)
   - Remove `packages/lib/src/encryption.ts` (incomplete implementation)
   - Audit all imports of old encryption module
   - Migrate legacy code to standardized crypto module
   - Add usage documentation and examples
   - Integration tests for encrypt/decrypt roundtrip

4. **Secret Management System**
   - Updated `.env.example` with all required secrets documented
   - Startup validation script checking secret presence and minimum length
   - Secure generation commands provided for each secret
   - Audit logging code for secret exposure (remove or mask)
   - Documentation in `docs/deployment/secrets.md`

### P2 - Code Quality (Week 3)

5. **Constants Extraction**
   - Create `packages/lib/src/constants/` directory structure
   - Extract profile scoring thresholds → `constants/profile.ts`
   - Extract rate limits → `constants/rate-limits.ts`
   - Extract compliance thresholds → `constants/compliance.ts`
   - Update all references to use named constants
   - Documentation for each constant group

6. **Technical Debt Tracking**
   - Generate TODO inventory report (script scanning codebase)
   - Create GitHub issues for high-priority TODOs
   - Add TODO tracking to `.agent-os/tasks/technical-debt.md`
   - Establish resolution timeline and assignment
   - Remove obsolete TODOs that no longer apply

## Success Criteria

- **Security:** All API routes protected by authentication middleware, no unauthorized access possible
- **Testing:** E2E security tests running in CI, 100% pass rate on security test suite
- **Code Quality:** Zero duplicate encryption modules, all magic numbers extracted to constants
- **Documentation:** Complete secret management documentation, clear TODO inventory and resolution plan
- **Validation:** All quality gates passing (typecheck, lint, build, test)
- **Performance:** No performance regression from security enhancements (< 50ms overhead per request)

## Dependencies

- Existing NextAuth v5 authentication system
- Playwright E2E test framework
- libsodium encryption library
- PostgreSQL database for rate limiting
- CI/CD pipeline (GitHub Actions)

## Risks & Mitigation

**Risk:** Breaking changes to API authentication may disrupt existing integrations
**Mitigation:** Comprehensive E2E testing before deployment, gradual rollout with feature flags

**Risk:** Performance impact from middleware authentication checks on every API request
**Mitigation:** JWT token validation is already cached (< 500ms), middleware adds minimal overhead

**Risk:** Encryption module migration may miss some usages causing runtime failures
**Mitigation:** TypeScript strict mode will catch import errors at compile time, comprehensive search for old imports

**Risk:** TODO inventory may be overwhelming and delay delivery
**Mitigation:** Prioritize TODOs by impact, defer low-priority items to backlog, focus on security-critical items first
