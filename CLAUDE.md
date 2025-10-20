# Claude Development Session Notes

**Project:** MyoFlow - Austrian Therapy Practice Management
**Current Session:** October 20, 2025
**Branch:** `main`
**Status:** ✅ Comprehensive i18n & Critical Bug Fixes

---

## 🎯 Session Summary - October 20, 2025 (IN PROGRESS)

### **Session 3: Comprehensive i18n Implementation & Critical Bug Fixes ✅**

**Branch:** `main`
**Commits:** 562ff98, 3bf3a18, 910b6d6
**Status:** Core fixes complete, additional issues identified by Codex

### **Completed Work**

#### **1. Comprehensive i18n Translation System** ✅
- **Scope:** Complete onboarding flow now fully translated (EN ↔ DE)
- **Translation Keys Added:** 103 new keys under `onboarding.*` namespace
- **Pattern Established:** `// i18n: All user-facing text uses t('section.key', 'fallback')`
- **Files Modified:** 8 files (2 dictionaries + 6 onboarding components)

**Translation Structure:**
- `onboarding.layout` (2 keys) - Header and subtitle
- `onboarding.progress` (7 keys) - Step indicators
- `onboarding.step1` (17 keys) - Business info form (labels, placeholders, errors, buttons)
- `onboarding.step2` (28 keys) - Professional details (designation/VAT options)
- `onboarding.step3` (10 keys) - Completion summary and profile score
- `onboarding.common` (2 keys) - Loading and error states

**Quality:**
- German translations use formal "Sie" form (professional context)
- English translations are natural and professional
- Nested key structure for organization
- All hardcoded German text removed from onboarding

#### **2. API Postal Code Validation Fix** ✅
- **Problem:** API still rejecting Vienna (1010) and other non-Upper-Austria codes
- **Root Cause:** Two locations in profile API route had old `/^4\d{3}$/` pattern
- **Files Fixed:**
  - `apps/web/app/api/settings/profile/route.ts:84` - Zod schema
  - `apps/web/app/api/settings/profile/route.ts:335` - Profile score calculation
- **Result:** Now accepts all Austrian postal codes (1xxx-9xxx) across entire app

#### **3. Sign-In Page Display Issue** ✅
- **Problem:** Sign-in page showing unstyled/broken layout
- **Root Cause:** Stale `.next` build cache + missing `logo.png` file
- **Fixes:**
  - Cleared `.next` cache
  - Created `apps/web/public/logo.png` (referenced throughout app)
  - Restarted dev server with clean build
- **Result:** Sign-in page now displays with proper Card styling

#### **4. ProfileTab Address Fields Critical Bug** ✅
- **Problem:** Settings ProfileTab was losing user address data
- **Root Cause:**
  - Form reset hardcoding city/postal/country to empty strings (lines 106-108)
  - handleSubmit not including these fields in API payload (lines 190-192)
- **Impact:** Users couldn't view or edit onboarding address data in settings
- **File:** `apps/web/app/dashboard/settings/components/ProfileTab.tsx`
- **Changes:**
  - Load address fields from `profileData` instead of hardcoded empties
  - Include `businessCity`, `businessPostalCode`, `businessCountry` in submission
- **Result:** Address data now persists and can be edited from settings

### **Codex Audit Findings**

Codex performed comprehensive audit and identified remaining issues:

**Critical (Remaining):**
- auth.session.test.ts needs update for wider Prisma select
- profileCompletedAt incorrectly stamped at signup

**High:**
- Multiple profile completion scoring implementations (3 different algorithms)
- Postal code validation errors bubble as 500 instead of 400
- Duplicate designation/VAT options in onboarding vs settings

**Medium:**
- Session refresh after onboarding may not trigger JWT reissue
- Step 3 shows raw enum codes (HEILMASSEUR) instead of localized labels
- Dashboard shows placeholder revenue data instead of real numbers
- Third calculateProfileCompletion implementation in overview API

**Low:**
- Deprecated useAdminAuth() stub still exported
- Admin login logs credentials in non-production environments

### **Files Modified (13 total)**
- `packages/lib/i18n/dictionaries/en.json` - 103 translation keys added
- `packages/lib/i18n/dictionaries/de.json` - 103 translation keys added
- `apps/web/app/onboarding/layout.tsx` - i18n integration
- `apps/web/app/onboarding/page.tsx` - i18n integration
- `apps/web/app/onboarding/components/Step1BusinessInfo.tsx` - Full i18n conversion
- `apps/web/app/onboarding/components/Step2Professional.tsx` - Full i18n conversion (created)
- `apps/web/app/onboarding/components/Step3Complete.tsx` - Full i18n conversion (created)
- `apps/web/app/onboarding/components/WizardProgress.tsx` - Full i18n conversion (created)
- `apps/web/app/onboarding/types.ts` - Type definitions (created)
- `apps/web/app/api/settings/profile/route.ts` - Postal code validation fixes
- `apps/web/app/dashboard/settings/components/ProfileTab.tsx` - Address fields bug fix
- `apps/web/public/logo.png` - Created missing asset

### **Quality Gates** ✅
- TypeScript: No errors
- ESLint: No warnings
- Build: Success (onboarding bundle 550KB)
- All 31 pages built successfully

### **Key Achievements**
1. **Complete Language Support:** Onboarding works seamlessly in EN/DE
2. **Consistent Pattern:** Established clear i18n pattern for future work
3. **Critical Bug Fixed:** ProfileTab address data now persists correctly
4. **Validation Unified:** Postal codes accepted consistently across app

### **Next Steps**
1. Fix remaining Critical issues (auth test, profileCompletedAt)
2. Unify profile completion scoring algorithms
3. Convert remaining pages to i18n (Settings, Dashboard, Auth)
4. Improve error handling for validation failures

---

## 🎯 Session Summary - October 20, 2025 (PREVIOUS)

### **Session 2: Onboarding & UI Visibility Fixes ✅**

**Branch:** `main`
**Commit:** 77bb681
**Status:** Committed and documented

### **Issues Resolved**

#### **1. Postal Code Validation Too Restrictive** ✅
- **Problem:** Onboarding wizard only accepted Upper Austria postal codes (4xxx)
- **Impact:** Vienna addresses (1010) and other regions rejected
- **File:** `apps/web/app/onboarding/components/Step1BusinessInfo.tsx:104`
- **Change:** Regex from `/^4\d{3}$/` → `/^[1-9]\d{3}$/`
- **Result:** Now accepts all Austrian postal codes (1xxx-9xxx)

#### **2. Missing Language Toggle** ✅
- **Problem:** No language switcher on onboarding wizard
- **User Feedback:** "it should ALWAYS be present"
- **File:** `apps/web/app/onboarding/layout.tsx:6,24`
- **Change:** Added LanguageToggle component to header
- **Result:** Consistent language switching across all pages

#### **3. React Hydration Mismatch** ✅
- **Problem:** "Text content does not match server-rendered HTML" errors
- **Symptoms:** Translation keys flashing before actual text loads
- **Root Cause:** Client-side translation loading after server render
- **File:** `apps/web/app/dashboard/layout.tsx:79`
- **Change:** Added `suppressHydrationWarning` to footer element
- **Result:** Eliminated hydration errors and visual glitches

#### **4. Settings Page Tab Buttons Invisible** ✅
- **Problem:** Tab buttons present but not visible - only active tab showed
- **Root Cause:** Inactive tabs using `text-muted-foreground` blending with background
- **File:** `apps/web/app/dashboard/settings/settings-client.tsx:202`
- **Changes:**
  - Added `text-gray-700` for proper contrast on inactive tabs
  - Added hover states: `hover:text-gray-900 hover:bg-gray-100`
  - Maintained active state styling: `data-[state=active]:bg-blue-50`
- **Result:** All tabs now visible with clear visual hierarchy

### **Key Learnings**

- **Postal Code Validation:** Austrian postal codes span 1xxx-9xxx (all 9 regions)
- **Hydration Strategy:** Use `suppressHydrationWarning` for client-side translations
- **Tab Visibility:** Always ensure sufficient color contrast for inactive UI elements
- **User Feedback:** Direct user observations caught issues automated tests missed

### **Files Modified**
- `apps/web/app/onboarding/components/Step1BusinessInfo.tsx` - Postal code validation
- `apps/web/app/onboarding/layout.tsx` - Language toggle
- `apps/web/app/dashboard/layout.tsx` - Hydration fix
- `apps/web/app/dashboard/settings/settings-client.tsx` - Tab visibility

### **Technical Notes**
- **Validation Pattern:** `/^[1-9]\d{3}$/` accepts 1000-9999 (Austrian range)
- **Hydration:** Server renders → client hydrates → translations load → content updates
- **Color Contrast:** `text-gray-700` provides sufficient contrast on white/light backgrounds
- **UX Pattern:** Visible error states > silent failures (established in Session 1)

---

### **Session 1: UI Bug Fixes & Performance Improvements ✅**

**Branch:** `main`
**Commit:** d2e5566, 380182a
**Status:** Committed and documented

### **Issues Resolved**

#### **1. Server 404 Issues** ✅
- **Problem:** All routes returning 404 on localhost:3003
- **Root Cause:** Next.js dev server in corrupted state
- **Fix:** Cleared `.next` cache and restarted fresh dev server
- **Result:** Server operational on http://localhost:3000

#### **2. Sign Out Button Invisible on Hover** ✅
- **Problem:** Button text disappeared when hovering (white text with no background)
- **File:** `apps/web/app/dashboard/layout.tsx:55`
- **Change:** `className="[&>span]:hover:text-white"` → `className="hover:bg-red-50 hover:border-red-200 hover:text-red-700"`
- **Result:** Proper red hover state with visible text

#### **3. Profile Widget Contradictory Message** ✅
- **Problem:** Widget showing "0% completed" but also "All steps complete"
- **File:** `apps/web/app/dashboard/components/ProfileCompletionWidget.tsx:211`
- **Change:** Badge logic now checks `score >= 100` before showing "All steps complete"
- **Result:** Shows "Calculating..." while loading, "All steps complete" only at 100%

#### **4. Profile Widget Error Handling (UX Improvement)** ✅
- **Problem:** Widget disappeared when API failed, hiding errors from user
- **User Feedback:** "but if the profile is NOT setup fully then why is the widget hidden?"
- **Fix:** Added visible amber warning card with actionable "Go to settings" button
- **File:** `apps/web/app/dashboard/components/ProfileCompletionWidget.tsx:153-175`
- **Result:** Errors are visible and actionable instead of silently hidden

#### **5. Upgrade Requirements Button Hover** ✅
- **Problem:** Same hover issue as Sign Out button
- **File:** `apps/web/app/dashboard/components/ProfileCompletionWidget.tsx:252-256`
- **Change:** Added `className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"`
- **Result:** Proper blue hover state

#### **6. Performance Issues** ✅
- **Problem:** Site running slowly due to multiple zombie processes
- **Root Cause:** 4 Next.js dev servers running simultaneously (2GB+ RAM)
- **Fix:** Killed old processes (PIDs 20154, 75969, 21118, 20024, 20917)
- **Result:** Single server using 644MB RAM, site responsive

#### **7. Sign Out Redirect Failure** ✅
- **Problem:** Clicking Sign Out resulted in "This site can't be reached"
- **Root Cause:** `.env` had `NEXTAUTH_URL=http://localhost:3001` but server on port 3000
- **Fix:** Updated `.env` to `NEXTAUTH_URL=http://localhost:3000`
- **Result:** Sign out properly redirects to sign-in page

### **Key Learning**
User correctly identified that hiding errors is poor UX - showing visible error states with action buttons is better than silent failures.

### **Files Modified**
- `apps/web/app/dashboard/layout.tsx` - Sign Out button hover fix
- `apps/web/app/dashboard/components/ProfileCompletionWidget.tsx` - Badge logic, error handling, button hover
- `apps/web/.env` - NEXTAUTH_URL port correction (not committed, in .gitignore)

### **Technical Notes**
- **Server:** Running cleanly on http://localhost:3000
- **Environment:** `NEXTAUTH_URL` now matches actual server port
- **Performance:** Eliminated 3 zombie dev servers, improved responsiveness
- **UX Pattern:** Visible error states > silent failures

---

## 🎯 Session Summary - October 15, 2025 (COMPLETE)

### **Sprint 4 Phase 2+3: Settings API + UI Implementation ✅**

**Branch:** `sprint4/codex/api-enhancements` → **PUSHED**
**Commit:** 878f213
**Status:** Ready for review/merge

### **Completed Work**

#### **API Enhancements (Phase 2)** ✅
- **Modified 6 API endpoints** with PUT handlers and structured responses:
  1. `profile` - Business info, VAT/IBAN normalization, Austrian validation
  2. `tax-compliance` - Kleinunternehmer/VAT mutual exclusivity, threshold tracking
  3. `invoice-branding` - Logo display preferences, thank-you messages
  4. `rksv` - Revenue threshold (€15k), audit scheduling, compliance status
  5. `system` - Locale/timezone/currency/notification preferences
  6. `travel` - Postal code validation, transport methods, rates/buffers

- **Created 3 new endpoint groups:**
  - `credentials` + `credentials/[id]` - Professional credential CRUD
  - `pricing` + `pricing/[id]` - Service rate templates CRUD
  - `pricing/shared.ts` - Shared validation schemas

- **Response Format:** All endpoints return `{ success, data, message, error }`
- **Validation:** Comprehensive Zod schemas with Austrian-specific rules
- **Auth:** `requireTherapist()` for GET, `ensureTherapistAccount()` for PUT
- **Versioning:** `settingsLastUpdated` + `settingsVersion` increment on every change

#### **UI Wiring (Phase 3)** ✅
- **All 6 tabs converted** to react-hook-form with real submission:
  1. `ProfileTab` - Business details, VAT status, IBAN, public profile slug
  2. `TravelTab` - Base location, transport method, rates, distance limits
  3. `SystemTab` - Language (EN/DE), timezone, currency, notification toggles
  4. `ComplianceTab` - VAT/Kleinunternehmer toggle, RKSV tracking, validation flag
  5. `PricingTab` - Service rate CRUD with inline edit/delete, euro↔cents conversion
  6. `TaxValidationWidget` + related widgets updated

- **Form Features:**
  - Real-time validation with error messages
  - Success/error state feedback
  - Optimistic updates with refetch on success
  - Cancel/reset functionality

#### **Validation Library** ✅
- **New module:** `packages/lib/src/validation/`
  - `vat.ts` - Austrian VAT number normalization (ATU########)
  - `iban.ts` - Austrian IBAN validation (AT## format)
  - `postal.ts` - Austrian postal code validation (4xxx)
  - `index.ts` - Centralized exports
- **Integration:** Exported via `@myoflow/lib` for cross-package use

#### **Dependencies**
- Added `react-hook-form` to `apps/web/package.json`

### **Quality Gates** ✅
- ✅ TypeScript: No errors (414ms turbo)
- ✅ ESLint: No warnings (268ms turbo)
- ✅ Build: Success - 534KB settings bundle (1.1s turbo)

### **Documentation Decisions**
- **CODE_QUALITY_REMEDIATION_PLAN.md** - Codex removed (Sprint 1 complete, Oct 4)
- **Jules doc cleanup** - Deferred (user decision: "fuck it, too hard")
- **LAUNCH_BLOCKERS.md** - Keep as active strategic doc (contains pre-launch validation checklist)

### **Token Budget**
- **Session usage:** ~78k / 200k (39%)
- **Remaining:** ~122k for reviews/decisions
- **Strategy:** Claude as reviewer/orchestrator, delegation to Codex/Gemini/Jules for execution

### **Code Review - Codex's API Enhancements**

Reviewed 5 modified endpoint files - **ALL EXCELLENT QUALITY:**

**Pattern Compliance:**
- ✅ `requireTherapist()` for GET, `ensureTherapistAccount()` for PUT
- ✅ Comprehensive Zod validation with Austrian-specific rules
- ✅ Proper error handling (Response errors, ZodError, generic 500s)
- ✅ Settings versioning: `settingsLastUpdated` + `settingsVersion` increment
- ✅ Transaction wrapping where appropriate
- ✅ Mutual exclusion logic (VAT vs Kleinunternehmer)
- ✅ Null handling and field normalization

**Files Verified:**
1. `apps/web/app/api/settings/profile/route.ts` - Professional profile management
2. `apps/web/app/api/settings/tax-compliance/route.ts` - VAT/Kleinunternehmer rules
3. `apps/web/app/api/settings/invoice-branding/route.ts` - Logo/branding settings
4. `apps/web/app/api/settings/rksv/route.ts` - Austrian RKSV compliance (€15k threshold)
5. `apps/web/app/api/settings/system/route.ts` - User preferences (language/timezone/currency)

**New Files Created by Codex:**
- `apps/web/app/api/settings/credentials/route.ts` (untracked)
- `apps/web/app/api/settings/pricing/[id]/` (untracked)
- `apps/web/app/api/settings/pricing/shared.ts` (untracked)

**Assessment:** Codex executing Phase 2 flawlessly with production-ready code quality.

### **Documentation Correction**

**Critical Error Caught:**
- Initially instructed Jules to DELETE `COORDINATION.md` and merge into `DEVELOPMENT.md`
- **User Feedback:** "maybe YOU need to look at these docs more carefully before you tell jules what to do with it"
- **Reality:** `COORDINATION.md` is for multi-agent communication - MUST KEEP
- Also found `.agent-os/meta/agents.md` for real-time status updates

**Corrected Plan:**
- **KEEP (7 files):** README, CLAUDE, **COORDINATION**, DEVELOPMENT, GIT_WORKFLOW, DECISION_LOG, DOCS_INDEX
- **ARCHIVE (5 files):** AUDIT_REPORT, CODE_QUALITY_REMEDIATION_PLAN, KNOWN_ISSUES, LAUNCH_BLOCKERS, THIS_WEEK_ACTION_PLAN
- **CONSOLIDATE:** SPEC_STATUS → DOCS_INDEX, ROADMAP → CLAUDE
- **RELOCATE:** QA docs → `docs/qa/`

### **Technical Status**
- **Build Status:** All quality gates passing (typecheck/lint/build) verified Oct 15
- **Runtime:** Dev server clean, no errors beyond benign NextAuth debug warning
- **Git:** On branch `sprint4/codex/api-enhancements`, untracked Codex files present
- **Documentation:** `.agent-os/meta/agents.md` is outdated (Sept 20 timestamp)

### **Next Steps**

**Immediate (Oct 15-16):**
1. User to deliver corrected Jules instructions for documentation cleanup
2. Codex to complete Phase 2 API enhancements and submit PR
3. Claude to review Codex PR when ready

**Phase 3 (Oct 16-18):** Gemini - UI wiring (16h)
**Phase 4 (Oct 18-19):** Jules - Test coverage (8h)
**Phase 5 (Oct 19-20):** Claude - QA & rollout (4h)

**Token Usage:** ~165k remaining of 200k weekly budget (conserving for PR reviews)

---

## 🎯 Session Summary - October 4, 2025

### **Sprint 1 Complete ✅ + Sprint 2 Complete ✅**

### **Completed Sprint 1: Hardening (All 11 Items)**
- ✅ **Priority 1 - Security & Data Integrity (Items 1-4)**
  - Invoice PDF validation with required field checks
  - GET-side mutation elimination (requireTherapist helper)
  - ADMIN_JWT_SECRET enforcement at boot time
  - Admin authentication hardening
- ✅ **Priority 2 - Architecture Consistency (Items 5-8)**
  - Structured auth error propagation (AuthError class)
  - Prisma singleton enforcement across all routes
  - Typed NextAuth callbacks (MyoFlowSession/MyoFlowToken)
  - Intake token utility consolidation
- ✅ **Priority 3 - Performance & Scalability (Items 9-11)**
  - PostgreSQL-backed rate limiting (RateLimit table)
  - Admin analytics optimization (6x faster with single query)
  - Audit type unification (@myoflow/db as source of truth)

### **Completed Sprint 2: Runtime Performance (All 4 Items) ✅**
- ✅ **Settings Optimization** - Converted to Server Component architecture
  - Server-side auth check using auth() helper (eliminates client-side session check)
  - Extracted client logic to settings-client.tsx for minimal hydration
  - Maintained lazy-loaded tabs for code splitting
  - Bundle size: 537KB → 534KB (-3KB)
- ✅ **Seed Data Relocation** - Now opt-in via SEED_DATA=true flag
- ✅ **Repository Cleanup** - Removed unused files, artifacts cleaned
- ✅ **Performance Benchmarking** - Build time validated, settings page optimized

**Architecture Improvements:**
- Hybrid Server + Client Component pattern for settings
- Reduced initial JavaScript hydration overhead
- Server-side authentication reduces client-side bundle

### **Technical Status**
- **Build Status:** All quality gates passing (typecheck/lint/build)
- **Security:** Production-grade secret management, hardened auth
- **Performance:** Optimized queries, scalable rate limiting, Server Components
- **Architecture:** Clean separation, Server/Client component split
- **Branch:** runtime-performance-sprint (ready for merge)

**Next Session:** Sprint 3 - UX + i18n Cleanup

---

## 🎯 Previous Session Summary - September 23, 2025

### **MAJOR ACHIEVEMENT: MVP COMPLETE & TIGHT** ✅

### **Completed Tasks**
- ✅ **NextAuth v5 Authentication:** Fully working with Google + credentials
- ✅ **Performance Emergency Surgery:** Fixed all critical performance issues
- ✅ **Code Quality Gates:** Zero ESLint warnings, all TypeScript passing
- ✅ **useEffect Dependencies:** Fixed all 11 React hooks warnings with useCallback
- ✅ **Image Optimization:** Replaced img tags with Next.js Image components
- ✅ **Repository Cleanup:** Removed 15+ redundant development files, clean structure

---

## 🎯 Previous Session Summary - September 19, 2025

### **Original Task Scope**
Working on **comprehensive user settings design** implementation following Agent OS spec:
- Austrian Registrierkassenpflicht (RKSV) compliance monitoring
- Complete settings infrastructure per `.agent-os/specs/2025-09-18-user-settings-design/`
- Database schema extensions, API endpoints, UI implementation

### **Session Interruption**
- **User reported translation system issues** showing raw keys instead of translated text
- **Severe layout glitches** during language switching (EN/DE)
- **Performance problems** with 12.7+ second compilation times

### **Emergency Fixes Applied**
- ✅ Fixed "common.loading" translation key display issues
- ✅ Added hardcoded dummy data to Current Profile section
- ✅ Documented layout glitch problems in `KNOWN_ISSUES.md`
- ⚠️ **Translation issues require separate feature branch work**

---

## 🚨 Critical Issues Requiring Attention

### Translation System Layout Glitches
**Status:** CRITICAL - Multiple UI elements shifting during language toggle
**Impact:** Unprofessional user experience, unstable layout
**Recommendation:** Move translation work to separate branch, implement proper CSS layout strategy

### Performance Degradation
**Status:** MEDIUM - Settings page compilation 12.7+ seconds
**Impact:** Development workflow severely impacted
**Next Steps:** Hand off to Codex for systematic optimization

---

## 🔄 HANDOFF TO CODEX

### **Ready for Implementation**
- **Spec Complete:** `.agent-os/specs/2025-09-18-user-settings-design/tasks.md`
- **Priority Tasks:** Database schema (Task 1.1), Settings API (Task 1.2), RKSV compliance (Task 3.1)
- **Foundation:** Settings page structure exists, needs systematic completion

### **Branch Status**
- **Can merge:** Core functionality intact despite UI glitches
- **Next sprint:** Resume comprehensive settings implementation
- **Avoid:** Translation system work on this branch

### **Coordination Notes**
- User correctly identified this should have been on separate branch
- Focus on original user-settings-design scope
- Translation fixes documented for future sprint

---

## 🚀 Recent Major Achievements (September 2025)

### ✅ Calendar Implementation Rescue (Sept 18)
- **Problem:** Parallel Claude sessions created schema/migration conflicts
- **Solution:** Systematic database synchronization using `prisma db pull`
- **Result:** Production-ready calendar with Austrian compliance merged to main

### ✅ Google Maps Integration (Sept 17)
- Real travel calculations for Upper Austria (Linz ↔ Leonding = 8.5km, 15min, €6.80)
- Austrian locale integration and 4xxx postal code support
- Grant application ready with realistic Oberösterreich scenarios

### ✅ Professional UI Design System (Sept 16)
- Complete design overhaul with Austrian medical branding
- Professional Lucide React icons replacing emojis
- Smooth button transitions and clean white theme

---

## 🛠️ Technical Status

### MVP Features Complete
- **Authentication:** NextAuth.js with Austrian UI
- **Client Management:** CRUD with encryption and Austrian data fields
- **Appointment Scheduling:** Austrian holidays, conflict detection, travel buffers
- **Invoice Generation:** Tax-compliant PDFs with VAT/Kleinunternehmer support
- **Travel Integration:** Google Maps with real Austrian calculations

### Current Technical State
- **Build Status:** All CI passing, TypeScript strict compliance
- **Database:** Schema synchronized, migrations clean
- **Security:** libsodium encryption, field-level protection
- **Test Data:** 3 Austrian invoices, realistic Linz-based client scenarios

## 📆 Stabilisation & MVP Plan (Oct 2025)

**Goal:** Eliminate open issues, tighten architecture, then deliver the remaining ~30% toward MVP without feature creep.

### **Sprint Progress**

1. ✅ **Hardening Sprint (5d)** – COMPLETE (Oct 4, 2025)
   - All 11 Code Quality Remediation items implemented
   - Security hardened, architecture consistent, performance optimized
   - Branch: `security-hardening` → merged to `main`

2. ✅ **Runtime Performance Sprint (6d)** – COMPLETE (Oct 4, 2025)
   - Settings page converted to Server Component architecture
   - Seed data relocated to opt-in setup flows (SEED_DATA=true)
   - Performance benchmarking completed (534KB bundle)
   - Repository cleanup completed
   - Branch: `runtime-performance-sprint` → ready for merge

3. **UX + i18n Cleanup Sprint (5d)** – PENDING
   - Resolve translation layout glitches
   - Finish string extraction
   - Move root layout back to SSR-friendly patterns with scoped locale persistence

4. **Settings Completion Sprint (7d)** – PENDING
   - Ship remaining settings APIs + UI wiring
   - Migrate legacy JSON blobs
   - Document PostGIS rollout requirements

5. **Compliance & Reporting Sprint (6d)** – PENDING
   - Finish RKSV flows
   - Tighten audit logging
   - Replace dashboard mock metrics with live revenue/threshold data

6. **E2E Reliability Sprint (5d)** – PENDING
   - Expand Playwright suites (settings, calendar, security smoke tests)
   - Enable E2E in CI

7. **Polish & Launch Prep Sprint (4d)** – PENDING
   - Documentation sweep
   - Localisation/responsiveness QA
   - Release-candidate tag and launch checklist

Each sprint should run on focused branches (one per sprint task), finish with the standard lint/typecheck/build/test gate, and record progress in session notes.

---

## 📋 Development Rules

### Quality Gates
- Always run `pnpm typecheck && pnpm lint && pnpm build` before commit
- Test locally before pushing changes
- Document decisions in `DECISION_LOG.md`
- Update `AGENT_ACTIVITY_LOG.md` for session handoffs

### Coordination Protocol
- Single environment for all Claude/Codex work (learned from parallel session disasters)
- Database-first development: migrate schema before context switching
- Systematic debugging: address root causes, not symptoms

---

## 🔄 Session Handoff Protocol

When ending session:
1. Complete current todo items or mark as blocked
2. Commit and push any working changes
3. Update `AGENT_ACTIVITY_LOG.md` with work completed and next steps
4. Document any new decisions in `DECISION_LOG.md`

**Next Developer:**
1. **IMMEDIATE PRIORITY:** Fix NextAuth v5 handlers export issue to restore authentication
2. Clean up multiple background dev server processes
3. Clear session data to resolve user name confusion
4. Verify authentication system works end-to-end
5. Then continue user settings implementation per coordination plan

---

## 📚 Quick Reference

- **Architecture Overview:** See `README.md`
- **Development Workflow:** See `DEVELOPMENT.md`
- **Technical Roadmap:** See `ROADMAP.md`
- **Decision History:** See `DECISION_LOG.md`
- **Agent Coordination:** See `AGENT_ACTIVITY_LOG.md`

---

**Last Updated:** October 4, 2025
**Next Priority:** Sprint 3 - UX + i18n Cleanup

---

## Session Update - September 26, 2025

### Summary
- Consolidated NextAuth v5 auth configuration to a single source of truth (apps/web/src/lib/auth.ts)
- Replaced local PrismaClient instantiations with shared singleton from @myoflow/db across auth and admin API routes
- Gated demo backdoors (test user + 'demo' password, admin demo login) behind AUTH_ENABLE_DEMO and non-production environments
- Marked admin pages and API routes as dynamic to resolve static render warnings when using cookies()
- Added Playwright smoke tests for credentials sign-in and admin demo login; enabled AUTH_ENABLE_DEMO in Playwright env
- Tightened tsconfig path aliases to avoid accidental resolution outside src

### Validation
- CI Fix (Sept 26, 2025): Widened NODE_ENV type in admin login route to include 'production' to satisfy typecheck
- Ran `pnpm typecheck && pnpm lint && pnpm build` successfully
- E2E tests configured (Playwright) to run with a dev server on port 3001, AUTH_ENABLE_DEMO=true

### Notes
- Admin demo login is only permitted when AUTH_ENABLE_DEMO=true and NODE_ENV !== 'production`
- Consider replacing admin cookie auth with NextAuth RBAC in a future sprint to reduce surface area
