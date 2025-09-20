# Known Issues - User Settings Branch

## 🐛 Critical Issues

### 1. Translation System Layout Glitches
**Status:** Critical - Severe layout shifts during language switching
**Affected:** Sidebar navigation, footer, settings page
**Symptoms:**
- Multiple UI elements shifting positions when toggling EN/DE
- Layout becomes unstable and unprofessional
- Several areas affected simultaneously

**Root Cause:**
- German text significantly longer than English equivalents
- CSS layout not accounting for dynamic text length changes
- Translation system causing reflow throughout UI

**Temporary Fix Applied:**
- Added `min-w-0 truncate` CSS classes to sidebar
- Hardcoded dummy data in Current Profile section
- Still experiencing severe glitches

**Recommended Action:**
- Move translation work to separate feature branch
- Implement proper CSS layout strategy for bilingual content
- Consider fixed-width containers or text overflow handling

### 4. Settings Page Performance & Bundling (2025-09-19)
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

### 2. Performance Issues
**Status:** Medium - Development workflow impact
**Symptoms:**
- Settings page compilation: 12.7+ seconds
- Initial page load: 5+ seconds
- Multiple background processes causing conflicts

**Impact:**
- Development velocity significantly reduced
- Testing translation changes becomes time-consuming

### 3. Settings Backend / UI Gaps (2025-09-19)
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
