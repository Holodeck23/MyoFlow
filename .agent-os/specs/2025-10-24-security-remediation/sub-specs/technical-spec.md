# Technical Specification - Security Remediation

**Spec:** Security Remediation & Code Quality Hardening
**Created:** 2025-10-24

## Architecture Overview

This specification addresses security vulnerabilities and code quality issues across three layers:
1. **Infrastructure Layer** - Middleware, authentication, rate limiting
2. **Application Layer** - API routes, encryption modules, secret management
3. **Quality Layer** - Testing, constants, technical debt tracking

## Component Specifications

### 1. API Route Authentication Protection (P0)

**Current State:**
```typescript
// apps/web/middleware.ts:48-50
export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/onboarding/:path*']
  // Missing: '/api/:path*' ❌
}
```

**Problem:** All API routes (`/api/*`) are unprotected by authentication middleware, allowing potential unauthorized access to sensitive endpoints.

**Target State:**
```typescript
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/onboarding/:path*',
    '/api/:path*', // ✅ Protect all API routes
    '/((?!auth|_next/static|_next/image|favicon.ico|logo.png|public).*)', // Public exclusions
  ]
}
```

**Implementation Details:**

1. **Update Middleware Matcher** (`apps/web/middleware.ts`)
   - Add `/api/:path*` to matcher array
   - Exclude public API endpoints: `/api/webhooks/*`, `/api/health`, `/api/intake/public/*`
   - Ensure proper ordering (most specific patterns first)

2. **Authentication Logic**
   ```typescript
   // Middleware auth check pseudocode
   if (pathname.startsWith('/api')) {
     const session = await auth()
     if (!session?.user) {
       return new NextResponse('Unauthorized', { status: 401 })
     }
     // For admin endpoints
     if (pathname.startsWith('/api/admin') && !session.user.isAdmin) {
       return new NextResponse('Forbidden', { status: 403 })
     }
   }
   ```

3. **Public Endpoint Exemptions**
   - `/api/webhooks/stripe` - Webhook handler (validates signature)
   - `/api/health` - Health check endpoint
   - `/api/intake/public/:token` - Public intake form submission
   - Document exemptions with security justification

4. **Error Responses**
   - 401 Unauthorized - No valid session token
   - 403 Forbidden - Valid session but insufficient permissions
   - No data leakage in error responses (generic messages only)

**Testing Requirements:**
- Unit tests for middleware matcher logic
- E2E tests attempting to access protected APIs without auth
- E2E tests verifying public endpoints remain accessible
- Performance tests measuring middleware overhead (target: < 50ms)

**Files Modified:**
- `apps/web/middleware.ts` - Matcher configuration
- `apps/web/middleware.test.ts` - Unit tests (new file)

---

### 2. E2E Security Test Suite (P0)

**Current State:**
```yaml
# .github/workflows/ci.yml:82-83
e2e-tests:
  if: false # TODO-CLAUDE: Enable once Playwright tests are written
```

**Problem:** Security regression tests disabled, allowing authentication/authorization bugs to reach production.

**Target State:**
- E2E security tests enabled in CI
- Comprehensive test coverage for authentication and authorization
- Automated security regression detection

**Implementation Details:**

1. **CI Workflow Configuration** (`.github/workflows/ci.yml`)
   ```yaml
   e2e-tests:
     runs-on: ubuntu-latest
     steps:
       - uses: actions/checkout@v4
       - uses: pnpm/action-setup@v2
       - uses: actions/setup-node@v4
       - run: pnpm install
       - run: pnpm --filter web exec playwright install --with-deps
       - run: pnpm --filter web test:e2e
         env:
           DATABASE_URL: postgresql://postgres:postgres@localhost:5432/myoflow_test
           AUTH_ENABLE_DEMO: true
   ```

2. **Security Test Suite** (`apps/web/e2e/security/`)

   **File Structure:**
   ```
   e2e/
   ├── security/
   │   ├── auth-bypass.spec.ts       # Authentication bypass attempts
   │   ├── authorization.spec.ts     # Role-based access control
   │   ├── session-security.spec.ts  # Session management
   │   ├── api-security.spec.ts      # API endpoint protection
   │   └── csrf-protection.spec.ts   # CSRF token validation
   ```

   **Test Categories:**

   a) **Authentication Bypass Tests** (`auth-bypass.spec.ts`)
   ```typescript
   test('blocks unauthenticated API access', async ({ request }) => {
     const response = await request.get('/api/clients')
     expect(response.status()).toBe(401)
     expect(await response.text()).not.toContain('email') // No data leakage
   })

   test('blocks expired session tokens', async ({ page }) => {
     // Set expired cookie
     await page.context().addCookies([{
       name: 'next-auth.session-token',
       value: 'expired-token',
       domain: 'localhost',
       path: '/',
       expires: Date.now() - 86400,
     }])
     await page.goto('/api/clients')
     await expect(page).toHaveURL(/.*auth\/sign-in.*/)
   })
   ```

   b) **Authorization Tests** (`authorization.spec.ts`)
   ```typescript
   test('blocks therapist from admin endpoints', async ({ page }) => {
     await signInAsTherapist(page)
     const response = await page.goto('/api/admin/analytics')
     expect(response?.status()).toBe(403)
   })

   test('allows admin access to admin endpoints', async ({ page }) => {
     await signInAsAdmin(page)
     const response = await page.goto('/api/admin/analytics')
     expect(response?.status()).toBe(200)
   })
   ```

   c) **Session Security Tests** (`session-security.spec.ts`)
   ```typescript
   test('invalidates session on logout', async ({ page }) => {
     await signIn(page)
     await page.click('[data-testid="sign-out"]')

     // Attempt to access protected API with old session
     const response = await page.goto('/api/clients')
     expect(response?.status()).toBe(401)
   })

   test('session expires after 30 days', async ({ page }) => {
     // Test JWT maxAge enforcement
   })
   ```

   d) **API Security Tests** (`api-security.spec.ts`)
   ```typescript
   test('all /api/clients endpoints require auth', async ({ request }) => {
     const endpoints = [
       '/api/clients',
       '/api/clients/123',
       '/api/invoices',
       '/api/appointments',
     ]
     for (const endpoint of endpoints) {
       const response = await request.get(endpoint)
       expect(response.status()).toBe(401)
     }
   })
   ```

3. **Test Utilities** (`apps/web/e2e/utils/auth-helpers.ts`)
   ```typescript
   export async function signInAsTherapist(page: Page) {
     await page.goto('/auth/sign-in')
     await page.fill('[name="email"]', 'therapist@example.com')
     await page.fill('[name="password"]', 'demo')
     await page.click('[type="submit"]')
     await page.waitForURL('/dashboard')
   }

   export async function signInAsAdmin(page: Page) {
     await page.goto('/admin/login')
     await page.fill('[name="email"]', 'admin@myoflow.at')
     await page.fill('[name="password"]', 'admin123')
     await page.click('[type="submit"]')
     await page.waitForURL('/admin/dashboard')
   }
   ```

**Testing Requirements:**
- Minimum 20 security tests across 5 test files
- 100% pass rate required for CI success
- Tests run against local dev server (port 3001)
- Test database seeded with known test accounts

**Files Created:**
- `apps/web/e2e/security/*.spec.ts` - 5 new test files
- `apps/web/e2e/utils/auth-helpers.ts` - Shared utilities
- `.github/workflows/ci.yml` - Enable e2e-tests job

---

### 3. Encryption Module Consolidation (P1)

**Current State:**
- `packages/lib/src/encryption.ts` - Incomplete (only encrypt function)
- `packages/lib/security/crypto.ts` - Complete (encrypt + decrypt with libsodium)

**Problem:** Two encryption modules with different implementations create confusion and potential security issues.

**Target State:**
- Single encryption module: `packages/lib/src/security/crypto.ts`
- All imports migrated to unified module
- Complete API with encrypt/decrypt/key management

**Implementation Details:**

1. **Audit Existing Usages**
   ```bash
   # Find all imports of old encryption module
   grep -r "from '@myoflow/lib/encryption'" apps/ packages/
   grep -r "import.*encryption" apps/ packages/
   ```

2. **Migration Pattern**
   ```typescript
   // OLD (to be removed)
   import { encrypt } from '@myoflow/lib/encryption'
   const encrypted = await encrypt(data)
   // ❌ No decrypt function available

   // NEW (standardized)
   import { encrypt, decrypt } from '@myoflow/lib/security/crypto'
   const encrypted = await encrypt(data, key)
   const decrypted = await decrypt(encrypted, key)
   // ✅ Complete API with proper key management
   ```

3. **Unified Crypto Module** (`packages/lib/src/security/crypto.ts`)
   ```typescript
   import sodium from 'libsodium-wrappers'

   export interface EncryptionResult {
     ciphertext: string
     nonce: string
   }

   export async function encrypt(
     plaintext: string,
     key: Buffer
   ): Promise<EncryptionResult> {
     await sodium.ready
     const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES)
     const ciphertext = sodium.crypto_secretbox_easy(
       plaintext,
       nonce,
       key
     )
     return {
       ciphertext: Buffer.from(ciphertext).toString('base64'),
       nonce: Buffer.from(nonce).toString('base64'),
     }
   }

   export async function decrypt(
     ciphertext: string,
     nonce: string,
     key: Buffer
   ): Promise<string> {
     await sodium.ready
     const decrypted = sodium.crypto_secretbox_open_easy(
       Buffer.from(ciphertext, 'base64'),
       Buffer.from(nonce, 'base64'),
       key
     )
     return Buffer.from(decrypted).toString('utf8')
   }

   export function generateKey(): Buffer {
     return sodium.crypto_secretbox_keygen()
   }
   ```

4. **Migration Checklist**
   - [ ] Audit all imports of `encryption.ts`
   - [ ] Update imports to `security/crypto.ts`
   - [ ] Add decrypt calls where needed
   - [ ] Update key management (ensure ENCRYPTION_KEY_B64 used)
   - [ ] Remove `packages/lib/src/encryption.ts`
   - [ ] Update exports in `packages/lib/src/index.ts`

**Testing Requirements:**
- Integration tests for encrypt/decrypt roundtrip
- Test key generation and validation
- Test error handling (invalid keys, corrupted data)
- Verify no remaining imports of old module

**Files Modified:**
- `packages/lib/src/security/crypto.ts` - Ensure complete implementation
- All files importing old encryption module
- `packages/lib/src/index.ts` - Update exports
- `packages/lib/src/encryption.ts` - DELETE

---

### 4. Secret Management Hardening (P1)

**Current State:**
- `.env.example` has some secrets but unclear requirements
- No validation at startup for required secrets
- Weak generation methods (unclear how to generate secure values)
- Potential exposure in logs

**Target State:**
- Comprehensive `.env.example` with all secrets documented
- Startup validation enforcing minimum requirements
- Secure generation commands for each secret
- Audit logging to prevent secret exposure

**Implementation Details:**

1. **Updated `.env.example`**
   ```bash
   # Auth - NextAuth.js Session Encryption
   # Generate with: openssl rand -base64 32
   # REQUIRED - Minimum 32 characters
   AUTH_SECRET=change-me-to-a-secure-random-string-min-32-chars

   # Admin Authentication - JWT Signing Key
   # Generate with: openssl rand -base64 32
   # REQUIRED - Minimum 32 characters
   ADMIN_JWT_SECRET=

   # Data Encryption - Field-Level Encryption Key
   # Generate with: openssl rand -base64 32
   # REQUIRED - Must be base64-encoded 32-byte key
   ENCRYPTION_KEY_B64=

   # Intake Forms - Token Signing Secret
   # Generate with: openssl rand -base64 32
   # REQUIRED - Minimum 32 characters
   INTAKE_TOKEN_SECRET=

   # Optional: Legacy compatibility (set to decoded value of ENCRYPTION_KEY_B64)
   ENCRYPTION_KEY=
   ```

2. **Startup Validation Script** (`packages/lib/src/config/validate-secrets.ts`)
   ```typescript
   interface SecretRequirement {
     name: string
     required: boolean
     minLength: number
     pattern?: RegExp
     description: string
   }

   const REQUIRED_SECRETS: SecretRequirement[] = [
     {
       name: 'AUTH_SECRET',
       required: true,
       minLength: 32,
       description: 'NextAuth.js session encryption key',
     },
     {
       name: 'ADMIN_JWT_SECRET',
       required: true,
       minLength: 32,
       description: 'Admin JWT signing key',
     },
     {
       name: 'ENCRYPTION_KEY_B64',
       required: true,
       minLength: 44, // Base64-encoded 32 bytes
       pattern: /^[A-Za-z0-9+/]+=*$/,
       description: 'Field-level encryption key (base64)',
     },
     {
       name: 'INTAKE_TOKEN_SECRET',
       required: true,
       minLength: 32,
       description: 'Intake form token signing key',
     },
   ]

   export function validateSecrets() {
     const errors: string[] = []

     for (const secret of REQUIRED_SECRETS) {
       const value = process.env[secret.name]

       if (!value && secret.required) {
         errors.push(`Missing required secret: ${secret.name}`)
         errors.push(`  Description: ${secret.description}`)
         errors.push(`  Generate with: openssl rand -base64 32`)
         continue
       }

       if (value && value.length < secret.minLength) {
         errors.push(`${secret.name} too short (${value.length} < ${secret.minLength})`)
       }

       if (value && secret.pattern && !secret.pattern.test(value)) {
         errors.push(`${secret.name} does not match required format`)
       }

       // Check for common weak values
       if (value && (
         value.includes('change-me') ||
         value.includes('example') ||
         value === 'secret'
       )) {
         errors.push(`${secret.name} contains placeholder value - must be changed`)
       }
     }

     if (errors.length > 0) {
       console.error('\n❌ Secret validation failed:\n')
       errors.forEach(err => console.error(err))
       console.error('\nSee .env.example for required secrets and generation commands\n')
       process.exit(1)
     }

     console.log('✅ All required secrets validated')
   }
   ```

3. **Integration** (`apps/web/app/layout.tsx` or `apps/web/instrumentation.ts`)
   ```typescript
   import { validateSecrets } from '@myoflow/lib/config/validate-secrets'

   // Run validation at startup (only in production)
   if (process.env.NODE_ENV === 'production') {
     validateSecrets()
   }
   ```

4. **Log Auditing** - Search for potential secret exposure
   ```bash
   # Audit for console.log statements that may leak secrets
   grep -r "console.log.*env\." apps/ packages/
   grep -r "console.log.*SECRET" apps/ packages/
   grep -r "console.log.*password" apps/ packages/
   ```

   **Mitigation:** Replace with masked logging
   ```typescript
   // BAD
   console.log('Config:', process.env)

   // GOOD
   console.log('Config:', {
     DATABASE_URL: '***REDACTED***',
     AUTH_SECRET: process.env.AUTH_SECRET ? '***SET***' : '***MISSING***',
   })
   ```

**Testing Requirements:**
- Unit tests for validation logic (valid/invalid secrets)
- Test startup failure with missing secrets
- Test startup success with valid secrets
- Manual audit of logs for secret exposure

**Files Created:**
- `packages/lib/src/config/validate-secrets.ts` - Validation logic
- `docs/deployment/secrets.md` - Documentation

**Files Modified:**
- `.env.example` - Complete documentation
- `apps/web/instrumentation.ts` - Validation integration

---

### 5. Magic Number Extraction (P2)

**Current State:**
- Hardcoded values scattered throughout codebase
- Examples: `profileScore < 70`, `maxAge: 30 * 24 * 60 * 60`, rate limits

**Target State:**
- All magic numbers extracted to named constants
- Constants organized by domain
- Clear documentation for each constant

**Implementation Details:**

1. **Constants Directory Structure**
   ```
   packages/lib/src/constants/
   ├── index.ts                 # Re-exports all constants
   ├── profile.ts               # Profile completion thresholds
   ├── rate-limits.ts           # API rate limiting
   ├── compliance.ts            # Austrian compliance thresholds
   ├── session.ts               # Session/JWT configuration
   └── validation.ts            # Validation rules
   ```

2. **Example: Profile Constants** (`packages/lib/src/constants/profile.ts`)
   ```typescript
   /**
    * Profile completion scoring thresholds
    */
   export const PROFILE_COMPLETION = {
     /** Minimum score to hide completion widget */
     COMPLETE_THRESHOLD: 100,

     /** Score below which widget shows warning state */
     WARNING_THRESHOLD: 70,

     /** Points per completed field */
     FIELD_POINTS: {
       BUSINESS_NAME: 10,
       VAT_NUMBER: 10,
       IBAN: 10,
       ADDRESS: 5,
       LOGO: 5,
     },
   } as const
   ```

3. **Example: Session Constants** (`packages/lib/src/constants/session.ts`)
   ```typescript
   /**
    * Authentication and session configuration
    */
   export const SESSION = {
     /** JWT token max age in seconds (30 days) */
     JWT_MAX_AGE: 30 * 24 * 60 * 60,

     /** Session cookie max age in seconds (30 days) */
     COOKIE_MAX_AGE: 30 * 24 * 60 * 60,

     /** Cookie name in production */
     COOKIE_NAME_PRODUCTION: '__Secure-next-auth.session-token',

     /** Cookie name in development */
     COOKIE_NAME_DEVELOPMENT: 'next-auth.session-token',
   } as const
   ```

4. **Example: Rate Limits** (`packages/lib/src/constants/rate-limits.ts`)
   ```typescript
   /**
    * API rate limiting thresholds
    */
   export const RATE_LIMITS = {
     /** Invoice generation - requests per minute */
     INVOICE_GENERATION: {
       MAX_REQUESTS: 10,
       WINDOW_MS: 60 * 1000,
     },

     /** Client creation - requests per minute */
     CLIENT_CREATION: {
       MAX_REQUESTS: 20,
       WINDOW_MS: 60 * 1000,
     },

     /** API general - requests per minute */
     API_GENERAL: {
       MAX_REQUESTS: 100,
       WINDOW_MS: 60 * 1000,
     },
   } as const
   ```

5. **Migration Example**
   ```typescript
   // BEFORE
   if (profileScore < 70) {
     return <Warning />
   }

   // AFTER
   import { PROFILE_COMPLETION } from '@myoflow/lib/constants'
   if (profileScore < PROFILE_COMPLETION.WARNING_THRESHOLD) {
     return <Warning />
   }
   ```

**Testing Requirements:**
- Verify all magic numbers identified and extracted
- Test that constants are used consistently
- Ensure no duplicate constant definitions

**Files Created:**
- 6 new files in `packages/lib/src/constants/`

**Files Modified:**
- All files containing magic numbers (estimated 20-30 files)

---

### 6. TODO Inventory & Tracking (P2)

**Current State:**
- TODO/FIXME comments throughout codebase
- No centralized tracking or prioritization
- Unknown resolution timeline

**Target State:**
- Complete inventory of technical debt
- GitHub issues created for high-priority items
- Tracking document with resolution timeline
- Process for handling new TODOs

**Implementation Details:**

1. **TODO Scanning Script** (`scripts/scan-todos.ts`)
   ```typescript
   import fs from 'fs'
   import path from 'path'
   import { glob } from 'glob'

   interface TodoItem {
     file: string
     line: number
     type: 'TODO' | 'FIXME' | 'HACK' | 'NOTE'
     author?: string
     text: string
     priority: 'P0' | 'P1' | 'P2' | 'P3'
   }

   async function scanTodos(): Promise<TodoItem[]> {
     const files = await glob('**/*.{ts,tsx,js,jsx}', {
       ignore: ['node_modules/**', '.next/**', 'dist/**'],
     })

     const todos: TodoItem[] = []
     const todoPattern = /\/\/\s*(TODO|FIXME|HACK|NOTE)(-[A-Z]+)?:\s*(.+)/g

     for (const file of files) {
       const content = fs.readFileSync(file, 'utf8')
       const lines = content.split('\n')

       lines.forEach((line, index) => {
         const match = todoPattern.exec(line)
         if (match) {
           todos.push({
             file,
             line: index + 1,
             type: match[1] as TodoItem['type'],
             author: match[2]?.replace('-', ''),
             text: match[3].trim(),
             priority: determinePriority(match[3]),
           })
         }
       })
     }

     return todos
   }

   function determinePriority(text: string): TodoItem['priority'] {
     if (text.includes('CRITICAL') || text.includes('SECURITY')) return 'P0'
     if (text.includes('IMPORTANT') || text.includes('ASAP')) return 'P1'
     if (text.includes('NICE') || text.includes('CONSIDER')) return 'P3'
     return 'P2'
   }

   async function generateReport() {
     const todos = await scanTodos()

     // Group by priority
     const byPriority = todos.reduce((acc, todo) => {
       acc[todo.priority] = acc[todo.priority] || []
       acc[todo.priority].push(todo)
       return acc
     }, {} as Record<string, TodoItem[]>)

     // Generate markdown report
     let report = '# Technical Debt Inventory\n\n'
     report += `**Generated:** ${new Date().toISOString()}\n\n`
     report += `**Total TODOs:** ${todos.length}\n\n`

     for (const priority of ['P0', 'P1', 'P2', 'P3']) {
       const items = byPriority[priority] || []
       report += `\n## ${priority} - ${items.length} items\n\n`

       items.forEach(item => {
         report += `- [ ] **${item.file}:${item.line}** - ${item.text}\n`
         report += `  - Type: ${item.type}\n`
         if (item.author) report += `  - Author: ${item.author}\n`
         report += `\n`
       })
     }

     fs.writeFileSync('.agent-os/tasks/technical-debt.md', report)
     console.log(`✅ Generated report: ${todos.length} TODOs found`)
   }

   generateReport()
   ```

2. **Tracking Document** (`.agent-os/tasks/technical-debt.md`)
   ```markdown
   # Technical Debt Inventory

   **Generated:** 2025-10-24T10:00:00Z
   **Total TODOs:** 47

   ## P0 - Critical (3 items)

   - [ ] **apps/web/middleware.ts:15** - TODO-SECURITY: Add API route protection
     - Type: TODO
     - Author: CLAUDE
     - GitHub Issue: #123

   ## P1 - High Priority (12 items)

   - [ ] **packages/lib/src/encryption.ts:10** - TODO: Consolidate with crypto module
     - Type: TODO
     - Resolution: Spec #2025-10-24-security-remediation

   ## P2 - Medium Priority (25 items)

   ## P3 - Low Priority (7 items)
   ```

3. **GitHub Issue Creation**
   ```bash
   # For P0/P1 items, create GitHub issues
   gh issue create \
     --title "TODO: Add API route protection to middleware" \
     --body "File: apps/web/middleware.ts:15\n\nCurrent middleware doesn't protect /api/* routes..." \
     --label "technical-debt,security,P0"
   ```

4. **TODO Policy** - Add to `DEVELOPMENT.md`
   ```markdown
   ## TODO Comment Guidelines

   - Use `TODO-<AUTHOR>:` format for attribution
   - Include priority indicators: CRITICAL, IMPORTANT, NICE-TO-HAVE
   - Link to GitHub issues for P0/P1 items: `TODO: Fix auth bug (see #123)`
   - Set resolution timeline: `TODO: Remove deprecated function (by 2025-11-01)`
   - Run `pnpm scan-todos` before major releases
   ```

**Testing Requirements:**
- Verify scan script finds all TODOs
- Test priority classification logic
- Ensure report generation succeeds

**Files Created:**
- `scripts/scan-todos.ts` - TODO scanning script
- `.agent-os/tasks/technical-debt.md` - Inventory report
- GitHub issues for P0/P1 items

**Files Modified:**
- `DEVELOPMENT.md` - Add TODO policy
- `package.json` - Add `scan-todos` script

---

## Cross-Cutting Concerns

### Performance Requirements

- Middleware authentication check: < 50ms overhead per request
- E2E test suite: < 5 minutes total runtime
- Encryption operations: < 100ms per encrypt/decrypt
- TODO scanning: < 10 seconds for full codebase scan

### Security Requirements

- All secrets minimum 32 characters (256-bit entropy)
- No secret exposure in logs or error messages
- All API routes protected by default (opt-in public access)
- E2E tests verify authentication on all protected routes

### Monitoring & Observability

- Track middleware authentication failures (401/403 responses)
- Monitor E2E test pass rate in CI (alert on < 100%)
- Log encryption errors for investigation
- Weekly technical debt reports

### Documentation Requirements

- Update README.md with security improvements
- Document secret management in docs/deployment/secrets.md
- Add inline code comments for all constants
- Update DEVELOPMENT.md with TODO policy

## Dependencies & Integration Points

### External Dependencies
- NextAuth.js v5 - Authentication
- Playwright - E2E testing
- libsodium - Encryption
- PostgreSQL - Rate limiting

### Internal Dependencies
- `@myoflow/db` - Database access
- `@myoflow/lib` - Shared utilities
- `apps/web` - Main application

### Breaking Changes
- None expected - all changes are additive security enhancements
- Encryption module migration is internal implementation detail

## Rollout Strategy

### Week 1 - P0 Critical Security
1. Day 1-2: Middleware API route protection
2. Day 3-4: E2E security test suite
3. Day 5: Testing and validation

### Week 2 - P1 High-Risk Issues
1. Day 1-2: Encryption module consolidation
2. Day 3-4: Secret management hardening
3. Day 5: Testing and validation

### Week 3 - P2 Code Quality
1. Day 1-2: Magic number extraction
2. Day 3: TODO inventory and tracking
3. Day 4-5: Documentation and final testing

### Validation Checkpoints
- End of Week 1: All API routes protected, E2E tests passing
- End of Week 2: Single encryption module, secrets validated
- End of Week 3: No magic numbers, technical debt tracked

## Success Metrics

- **Security:** Zero unauthorized API access attempts succeed
- **Testing:** 100% E2E security test pass rate maintained
- **Code Quality:** Zero duplicate encryption modules, < 10 magic numbers remaining
- **Documentation:** 100% of secrets documented with generation commands
- **Performance:** < 50ms middleware overhead, < 5min E2E test runtime
- **Maintainability:** All P0/P1 TODOs tracked with GitHub issues
