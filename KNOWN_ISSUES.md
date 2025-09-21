# Known Issues - User Settings Branch

**Last Updated:** 2025-09-21
**Critical Issues Resolved:** 4 of 8 issues ✅

## ✅ Recently Fixed (2025-09-21)
- **Public Invoice Security Vulnerability** - Implemented signed token authentication and removed PII exposure
- **GET Handler Side Effects** - Made API endpoints idempotent and side-effect free
- **Encryption Key Inconsistency** - Standardized on ENCRYPTION_KEY_B64 across all packages
- **Translation System Layout Glitches** - Applied CSS containment and flex layout improvements for stable internationalization

## 🐛 Outstanding Issues

### 1. Database Schema Synchronization Issue ⚠️ NEW
**Status:** Medium - Prisma client cache inconsistency
**Affected:** Settings page API, TaxComplianceSettings queries
**Symptoms:**
- Prisma client claims `TaxComplianceSettings.kleinunternehmer_start` column doesn't exist
- Database actually contains the column (verified via psql)
- Error persists despite schema pull, cache clearing, and client regeneration

**Technical Details:**
- Database table created correctly via migration `20250919120000_user_settings_infrastructure`
- Column exists: `kleinunternehmer_start timestamp without time zone`
- Prisma schema shows correct mapping: `@map("kleinunternehmer_start")`
- Multiple regeneration attempts failed to resolve cache issue

**Workaround Applied:**
- TaxComplianceSettings relation temporarily disabled in API
- Settings overview endpoint modified to handle missing relation
- Allows continued development while investigating root cause

**Next Steps:**
- Investigate Prisma client connection string discrepancies
- Consider fresh database rebuild if issue persists
- Document as potential deployment consideration

### 2. Public Invoice Endpoint Exposes Tenant Data ✅ FIXED
**Status:** ~~Critical~~ → Resolved (2025-09-20)
**Affected:** `GET /api/public/invoices/[id]`
**Solution Applied:**
- ✅ Implemented signed token authentication using existing intake token infrastructure
- ✅ Added tenant scoping to prevent cross-tenant access
- ✅ Removed PII exposure by limiting fields (only client name, no email/phone/address)
- ✅ Added expiring tokens (7-day default) with cryptographic verification
- ✅ Endpoint now requires `?token=<signed_token>` parameter for access

### 3. Idempotent API Regressions in Settings GET handlers ✅ FIXED
**Status:** ~~High~~ → Resolved (2025-09-20)
**Affected:** `/api/settings/overview`, `/api/clients`
**Solution Applied:**
- ✅ Created shared `requireTherapist()` helper for read-only authentication
- ✅ Removed upserts from GET handlers in settings/overview and clients endpoints
- ✅ Added `ensureTherapistAccount()` helper for POST endpoints that can create accounts
- ✅ Converted revenue calculation to cached approach with 24-hour cache window
- ✅ GET requests are now side-effect free and fail cleanly for missing accounts

### 4. Encryption Secrets Out of Sync ✅ FIXED
**Status:** ~~High~~ → Resolved (2025-09-20)
**Affected:** Client CRUD, consent submission, any encryption utility usage
**Solution Applied:**
- ✅ Standardized all encryption utilities to use `ENCRYPTION_KEY_B64` environment variable
- ✅ Updated `packages/lib/security/crypto.ts` to use consistent variable name
- ✅ Removed inconsistent `DATA_ENCRYPTION_KEY` usage from legacy code
- ✅ `.env.example` already correctly documents `ENCRYPTION_KEY_B64`

### 3. Settings Page Performance & Bundling (2025-09-19)
**Status:** Medium - Rebuilds ~12s, initial load sluggish

**Findings:**
- `apps/web/app/dashboard/settings/page.tsx` is a single 1,800+ line `'use client'` module; every tab (Overview, Profile, Travel, Pricing, Compliance, System) plus dozens of icons is bundled and hydrated even when hidden.
- On mount the page fires several fetches (`/api/settings/overview`, `/profile`, `/travel`, `/pricing`, `/system`), most of which 404 because the endpoints aren’t built yet—adds latency and console noise.
- `GET /api/settings/overview` upserts defaults and aggregates invoices on every request, so each page load performs multiple writes and a full revenue sum.

**Actions:**
- Split settings tabs into separate components/server components to reduce the client bundle.
- Lazy-load or gate fetches until their endpoints exist.
- Move default seeding out of GET handlers; cache or queue the revenue aggregate.
- Track in a follow-up branch before shipping settings UI.

### 4. Performance Issues
**Status:** Medium - Development workflow impact
**Symptoms:**
- Settings page compilation: 12.7+ seconds
- Initial page load: 5+ seconds
- Multiple background processes causing conflicts

**Impact:**
- Development velocity significantly reduced
- Testing translation changes becomes time-consuming

### 5. Settings Backend / UI Gaps (2025-09-19)
**Status:** High - Blocks user settings delivery

**Findings:**
- Only `/api/settings/overview` and `/api/settings/tax-compliance` exist; profile, travel, system preferences, credentials, and export APIs remain unimplemented.
- Settings tabs (Travel, Pricing, Compliance, System) still use placeholders and mock data; nothing calls the new endpoints.
- Legacy JSON blobs on `Therapist` (e.g., `travelSettings`, `notificationSettings`) coexist with the new structured tables. UI continues to read the old fields—plan a migration to avoid divergence.
- Migration `20250919120000_user_settings_infrastructure` enables PostGIS. Production rollout requires superuser privileges and confirmation that the target Postgres instance allows `CREATE EXTENSION`.
- Seed script only backfills the demo therapist. Existing tenants need a backfill before deployment.
- Overview API recalculates revenue live; frontend must consume and verify the numbers before shipping.

**Action:** Finish outstanding APIs/UI, schedule data migration/backfill, and add PostGIS + migration steps to the deployment checklist.

## 🔄 Handoff Notes

### Original Task Context
- **Primary Goal:** Implement Austrian Registrierkassenpflicht (RKSV) compliance
- **Status:** Interrupted by translation system fixes
- **Next Steps:** Resume RKSV implementation work
- **Coordination:** Hand off to Codex for completion

### Branch Status
- **Current Branch:** `user-settings-design`
- **Main Features Working:** Settings page structure, RKSV foundation
- **Can Merge:** Yes, core functionality intact despite UI glitches
- **Translation Work:** Should continue on separate branch

---
**Created:** 2025-09-19 16:35 CET
**Priority:** Address translation glitches in separate sprint
**Escalate to:** Codex for RKSV completion
