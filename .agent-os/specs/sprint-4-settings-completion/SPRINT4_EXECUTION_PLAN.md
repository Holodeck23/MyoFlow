# Sprint 4: Settings Completion - Execution Plan

> **Status:** Ready for Execution
> **Created:** 2025-10-15
> **Owner:** Claude (Lead Dev) → Delegates to Codex/Jules/Gemini
> **Sprint Goal:** Complete all settings API endpoints + UI wiring to make every tab fully functional

---

## 🎯 Sprint Objective

Transform the settings page from read-only/placeholder state to **fully editable** with:
- All 8 API endpoints supporting GET/PUT/POST/DELETE
- Every settings tab wired to real backend data
- Full validation, error handling, and optimistic UI updates
- Test coverage for all new endpoints
- Zero placeholder/hardcoded data remaining

---

## 📊 Current State Audit (Oct 15, 2025)

### ✅ Already Complete
1. **Settings Page Infrastructure**
   - Server Component wrapper with auth check (`settings/page.tsx`)
   - Client component with lazy-loaded tabs (`settings-client.tsx`)
   - Professional UI with breadcrumbs, tab navigation
   - Error boundaries and loading states

2. **API Endpoints Created (8 total)**
   - `/api/settings/overview` (GET only - ✅ working)
   - `/api/settings/profile` (GET only)
   - `/api/settings/travel` (GET + PUT - ✅ pattern established)
   - `/api/settings/pricing` (GET + POST - ✅ pattern established)
   - `/api/settings/tax-compliance` (GET only)
   - `/api/settings/invoice-branding` (GET only)
   - `/api/settings/rksv` (GET only)
   - `/api/settings/system` (GET only)

3. **Database Schema**
   - TravelSettings table ✅
   - ServiceRateTemplate table ✅
   - TaxComplianceSettings table ✅
   - TherapistCredentials table ✅
   - Therapist table with settings fields ✅

### ⚠️ Gaps Requiring Work

#### API Layer Gaps
1. **Missing HTTP Methods**
   - `/api/settings/profile` - needs PUT handler
   - `/api/settings/tax-compliance` - needs PUT handler
   - `/api/settings/invoice-branding` - needs PUT handler
   - `/api/settings/rksv` - needs PUT handler
   - `/api/settings/system` - needs PUT handler
   - `/api/settings/pricing` - needs PUT/DELETE for individual templates

2. **Missing Endpoints**
   - `/api/settings/pricing/[id]` - for PUT/DELETE of specific service rate
   - `/api/settings/credentials` - for professional license management
   - `/api/settings/credentials/[id]` - for individual credential CRUD

3. **Validation Gaps**
   - Austrian postal code validation (4xxx format)
   - UID/VAT number validation (ATU12345678 format)
   - Business hours JSON schema validation
   - IBAN validation (Austrian format)

#### UI Layer Gaps
1. **ProfileTab** - Currently read-only placeholders
   - Needs editable form for business info
   - Needs Austrian address input with validation
   - Needs credentials management UI

2. **ComplianceTab** - Partially functional
   - Needs VAT/Kleinunternehmer toggle
   - Needs threshold tracking with visual progress
   - Needs tax advisor contact form

3. **TravelTab** - Has GET, needs save functionality
   - Needs form wiring to PUT endpoint
   - Needs map preview for service radius
   - Needs transport method selector

4. **PricingTab** - Has GET+POST, needs edit/delete
   - Needs individual rate edit modal
   - Needs delete confirmation flow
   - Needs bulk actions (archive/duplicate)

5. **SystemTab** - Needs complete implementation
   - Language preference toggle
   - Notification settings
   - Data export configuration

6. **InvoiceBrandingTab** - Needs complete implementation
   - Logo upload
   - Brand color picker
   - Invoice footer editor
   - Email template customization

7. **RKSVTab** - Needs complete implementation
   - RKSV status monitoring
   - Signature device configuration
   - Audit tracking

---

## 🗺️ Execution Roadmap (Based on Codex's Proposal)

### Phase 1: UI/API Audit & Documentation (2h)
**Owner:** Claude
**Deliverable:** Detailed gap analysis document

- [x] Map every settings tab against current API responses
- [x] Document missing fields, mismatched enum values
- [x] Identify read-only placeholders blocking data entry
- [x] Create prioritized work breakdown

### Phase 2: Endpoint Enhancements (12h)
**Owner:** Codex
**Tasks:**
1. Add PUT handlers to all GET-only endpoints
2. Create `/api/settings/pricing/[id]` for rate updates/deletes
3. Create `/api/settings/credentials` + `/api/settings/credentials/[id]`
4. Implement Austrian validation helpers (postal, VAT, IBAN)
5. Align all DTOs with Prisma schema (no name mismatches)
6. Add comprehensive Zod validation schemas

**Acceptance Criteria:**
- All endpoints support full CRUD where applicable
- Austrian-specific validation working (postal 4xxx, UID ATUxxxxx)
- Response DTOs match Prisma model fields exactly
- Error responses follow consistent format (400/401/500)

### Phase 3: UI Wiring (16h)
**Owner:** Gemini (for UI components)
**Owner:** Codex (for form logic/API integration)

**3.1 ProfileTab (4h)**
- Editable business info form (name, address, email, phone)
- Austrian address input with postal code validation
- Credentials management table with add/edit/archive
- Form state management with react-hook-form
- Optimistic updates on save

**3.2 ComplianceTab (3h)**
- VAT/Kleinunternehmer radio group (mutually exclusive)
- Revenue threshold progress bar with warning at 80%
- Tax advisor contact form (name, email, phone)
- Real-time threshold calculation from /api/settings/overview

**3.3 TravelTab (3h)**
- Form for base location (address, city, postal, country)
- Transport method dropdown (CAR/BIKE/PUBLIC/WALK/MOTORCYCLE)
- Rate per km input with currency formatting (€0.80/km)
- Minimum charge, max distance, buffer time inputs
- Save button wired to PUT /api/settings/travel

**3.4 PricingTab (4h)**
- Service rate cards with edit/delete actions
- Create/edit modal with category, duration, price, VAT rate
- Delete confirmation dialog
- Default rate toggle (one per category)
- Bulk actions (archive multiple rates)

**3.5 SystemTab (2h)**
- Language toggle (DE/EN) persisted to database
- Notification preferences checkboxes (email/SMS for appointments/compliance)
- Timezone selector (defaults to Europe/Vienna)
- Data export configuration section (placeholder for now)

**Acceptance Criteria:**
- Every tab has working save functionality
- Form validation prevents invalid Austrian data
- Optimistic UI updates provide instant feedback
- Error states display user-friendly messages
- Loading states prevent double-submits

### Phase 4: Test Coverage (8h)
**Owner:** Jules
**Tasks:**
1. Write Vitest unit tests for Austrian validation functions
2. Create API integration tests for all endpoints (happy path + validation failures)
3. Build Playwright E2E test for complete settings workflow
4. Add performance tests for profile completion calculation

**Acceptance Criteria:**
- 80%+ code coverage for settings endpoints
- All Austrian validation edge cases tested (invalid postal, bad UID format)
- E2E test covers: login → settings → edit profile → save → verify
- Performance tests ensure <500ms response times

### Phase 5: Rollout & QA (4h)
**Owner:** Claude (Lead Dev)
**Tasks:**
1. Review all PRs from Codex/Gemini/Jules
2. Run full quality gate (typecheck/lint/build/test)
3. Manual QA checklist for each tab
4. Create migration scripts for any schema changes
5. Update CLAUDE.md with completion status

**QA Checklist:**
- [ ] All tabs save data successfully
- [ ] Profile completion % updates correctly
- [ ] Austrian validation prevents invalid data
- [ ] Error messages are user-friendly
- [ ] Mobile responsive on all tabs
- [ ] No console errors in browser
- [ ] Build passes without warnings

---

## 🎯 Success Metrics

1. **Functional Completeness**
   - 8/8 API endpoints fully CRUD-capable ✅
   - 7/7 settings tabs fully editable ✅
   - 0 placeholder/hardcoded data remaining ✅

2. **Code Quality**
   - 80%+ test coverage for settings code
   - Zero TypeScript errors
   - Zero ESLint warnings
   - All quality gates passing

3. **User Experience**
   - Profile completion tracking works end-to-end
   - Settings persist across sessions
   - Validation prevents invalid Austrian data
   - Mobile-responsive on all screen sizes

---

## 📋 Delegation Matrix

| Task | Owner | Estimated Hours | Priority |
|------|-------|-----------------|----------|
| UI/API Audit | Claude | 2h | ✅ DONE |
| Endpoint Enhancements | Codex | 12h | HIGH |
| ProfileTab UI | Gemini + Codex | 4h | HIGH |
| ComplianceTab UI | Gemini + Codex | 3h | HIGH |
| TravelTab UI | Gemini + Codex | 3h | MEDIUM |
| PricingTab UI | Gemini + Codex | 4h | MEDIUM |
| SystemTab UI | Gemini + Codex | 2h | LOW |
| Test Coverage | Jules | 8h | HIGH |
| QA & Rollout | Claude | 4h | CRITICAL |

**Total Estimated Effort:** 42 hours (5-6 working days)

---

## 🚨 Risk Mitigation

### Technical Risks
1. **API Breaking Changes** - Mitigation: Version all DTOs, maintain backward compat
2. **Database Migration Issues** - Mitigation: Test migrations in dev DB first
3. **Performance Degradation** - Mitigation: Add indexes, profile completion caching

### Coordination Risks
1. **Parallel Agent Conflicts** - Mitigation: Assign distinct files per agent, Claude reviews all PRs
2. **Schema Drift** - Mitigation: Database-first development, always migrate before coding
3. **Test Failures Blocking** - Mitigation: Jules runs tests in isolation, fixes before merge

---

## 📅 Timeline

**Day 1 (Today - Oct 15):**
- ✅ Claude: Complete audit and create this execution plan
- Codex: Start Phase 2 (Endpoint Enhancements) - 6h
- Jules: Set up test infrastructure for settings endpoints - 2h

**Day 2-3 (Oct 16-17):**
- Codex: Finish Phase 2 + start Phase 3 API integration - 10h
- Gemini: Start Phase 3 UI components (ProfileTab, ComplianceTab) - 7h
- Jules: Write unit + integration tests - 4h

**Day 4-5 (Oct 18-19):**
- Codex: Finish Phase 3 API integration - 6h
- Gemini: Finish Phase 3 UI components (TravelTab, PricingTab, SystemTab) - 9h
- Jules: Write E2E tests + performance tests - 4h

**Day 6 (Oct 20):**
- Claude: Phase 5 QA, review all PRs, merge to main - 4h
- All: Address QA findings, final polish

**Sprint Complete:** Oct 20, 2025 ✅

---

## 🔄 Handoff Notes

**For Codex:**
- Start with `/api/settings/profile` PUT handler (highest user value)
- Follow pattern from `/api/settings/travel` (GET + PUT with upsert)
- Use `requireTherapist` helper for auth
- Return `isDefaultData: false` for real DB records
- Update `settingsLastUpdated` timestamp on every write

**For Gemini:**
- Use `react-hook-form` for all forms
- Follow existing tab component patterns (ProfileTab.tsx structure)
- Austrian currency formatting: `€X.XXX,XX` (period for thousands, comma for decimals)
- Austrian date format: `DD.MM.YYYY`
- Mobile-first responsive design

**For Jules:**
- Test files go in `packages/db/src/__tests__/` for DB logic
- Use `DATABASE_URL` from `.env` (now properly loaded via vitest config)
- E2E tests in `apps/web/e2e/settings.spec.ts`
- Mock Google Maps API calls in tests

**For All Agents:**
- Branch naming: `sprint4/[agent-name]/[feature]` (e.g., `sprint4/codex/profile-endpoint`)
- Commit messages: Follow conventional commits (feat/fix/chore)
- PR to `main` when complete, tag Claude for review
- Run `pnpm typecheck && pnpm lint && pnpm build` before pushing

---

**Next Step:** Codex begins Phase 2 (Endpoint Enhancements) 🚀
