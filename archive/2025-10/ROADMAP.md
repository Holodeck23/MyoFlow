# MyoFlow Development Roadmap

_Last updated: October 4, 2025_

---

## ⚠️ CRITICAL: See `LAUNCH_BLOCKERS.md` for Pre-Launch Reality Check

**Key Issues Identified:**
1. 🔴 Legal/tax compliance needs professional Austrian validation
2. 🟡 Language barrier (German translation/support needed)
3. 🟢 Branding conflict (name change required)
4. ⚠️ Missing features (email auth, mini-sites, onboarding)

**Recommendation:** Complete manual QA → Pursue grant → Get professional validation → Launch

---

## Current Status: Technical Platform Complete, Market Entry Pending

### ✅ Technical Foundation (MVP + Sprints 1-2)
- **MVP Features:** Auth, clients, appointments, invoices, Austrian compliance
- **Sprint 1 (Hardening):** All 11 Code Quality Remediation items complete
  - Security hardening (invoice validation, auth fixes, secret enforcement)
  - Architecture consistency (error propagation, Prisma singleton, typed callbacks)
  - Performance optimization (PostgreSQL rate limiting, 6x faster analytics)
- **Sprint 2 (Performance):** Server Components, seed relocation, benchmarking
- **Quality Gates:** All passing (typecheck/lint/build)
- **Platform Status:** Production-ready code, **pending professional validation**

### ⚠️ Launch Blockers (Non-Technical)
- **Legal Compliance:** Tax calculations built by AI, need Austrian Steuerberater validation
- **Language:** German translations exist but unvalidated by native speaker
- **Branding:** "MyoFlow" name taken, requires rebrand
- **Support:** No German-speaking support capability

---

## Phase 0: Pre-Launch Validation (CURRENT PRIORITY)

**Goal:** Prove product works and is legally defensible

### Week 1: Manual QA & Bug Fixes
- [ ] Complete end-to-end user journey testing
- [ ] Document all bugs/issues
- [ ] Fix critical blockers
- [ ] Record demo video for grant application

### Week 2-4: Professional Validation
- [ ] Hire Austrian tax advisor (Steuerberater) - €2,000-4,000
  - Review Kleinunternehmer calculations
  - Validate VAT logic (10%, 13%, 20%)
  - Verify invoice PDF legal compliance (§11 UStG)
  - RKSV feature assessment
- [ ] German translation review - €500-1,500
  - Native Austrian German speaker
  - Legal/tax terminology validation
  - UI content review
- [ ] Compile findings and required fixes

**Budget Required:** €2,500 - €6,500
**Timeline:** 3-5 weeks
**Outcome:** Legal confidence OR clear fix roadmap

---

## Phase 1: Grant Application (Funding Path)

**Goal:** Secure funding for professional launch

### Grant Materials (1 week prep):
- [x] Technical assessment (completed Oct 4)
- [ ] Demo video showing working features
- [ ] Market analysis (Austrian therapy market size)
- [ ] Budget breakdown (validation, marketing, support)
- [ ] Compliance roadmap (GDPR, RKSV, ÖGK integration)
- [ ] Competitive analysis vs international SaaS

**Submit to:** Upper Austria business innovation grants
**Timeline:** 1 week prep + 4-8 weeks review
**Outcome:** Funding OR pivot to minimal launch

---

## Phase 2A: Minimal Launch (IF Grant Denied)

**Goal:** Beta validation with 5-10 therapists

### Pre-Launch Requirements:
- [ ] Manual QA complete (bugs fixed)
- [ ] Email authentication implemented
- [ ] German translations validated (native speaker review)
- [ ] Legal disclaimer added: "Tax calculations pending professional validation"
- [ ] Domain + hosting setup (€50/month budget)
- [ ] Name change + rebrand

### Beta Strategy:
- Free 6-month beta access
- Manual onboarding support
- Heavy involvement for feedback
- Build testimonials for next funding round

**Budget:** €50/month (Vercel + domain)
**Risk:** Legal liability from unvalidated tax features
**Timeline:** 2-3 weeks after grant decision

---

## Phase 2B: Professional Launch (IF Grant Approved)

**Goal:** Market-ready, legally compliant product

### Use Grant Funds For:
1. Professional validation (complete fixes from Phase 0)
2. German translation service (all legal text)
3. Austrian marketing partner OR co-founder
4. Customer support infrastructure (German-speaking)
5. Design polish (if budget permits)
6. RKSV compliance certification

**Timeline:** 2-3 months after grant approval
**Outcome:** Full market launch with legal confidence

---

## Technical Sprints (Paused - Resume After Phase 0)

### Remaining 5/7 Sprints:

3. **UX + i18n Cleanup (5d)** - DEFERRED
   - Translation layout glitches
   - String extraction completion
   - SSR-friendly locale persistence

4. **Settings Completion (7d)** - DEFERRED
   - Settings APIs finalization
   - JSON blob migration
   - PostGIS integration (if needed)

5. **Compliance & Reporting (6d)** - CRITICAL FOR LAUNCH
   - RKSV flows (after professional validation)
   - Audit log tightening
   - Live dashboard metrics (replace TODOs)

6. **E2E Reliability (5d)** - DEFERRED
   - Playwright coverage expansion
   - CI integration
   - Test infrastructure automation

7. **Polish & Launch Prep (4d)** - MERGE WITH PHASE 2
   - Documentation sweep
   - Localization QA
   - Release candidate preparation

**Note:** Technical sprints 3, 4, 6 are lower priority than legal validation and market entry preparation.

---

## Missing Features (Documented in LAUNCH_BLOCKERS.md)

### Pre-Launch Nice-to-Haves:
- [ ] Email authentication (verification, password reset) - 2-3 days
- [ ] Mini-websites (public booking pages) - 1 week
- [ ] Onboarding tutorial/tour - 3-4 days

### Post-Launch Phase 2:
- [ ] Multi-user/team support (receptionists, billing) - 2-3 weeks
- [ ] Clinic vs mobile logic refinement - 3-5 days
- [ ] White-labeling (custom branding) - 1 week
- [ ] Design enhancement (if needed) - AVOID PRE-LAUNCH

---

## Decision Points

### This Week:
1. **Complete Manual QA** → Identify critical bugs
2. **Research Austrian tax advisors** → Get quotes
3. **Decide:** Grant first OR minimal beta launch?

### After Phase 0:
1. **If validation finds major issues:** Fix before any launch
2. **If validation passes:** Choose grant OR beta path
3. **If language barrier too big:** Consider Austrian co-founder

### Long-term:
1. **If successful in Austria:** Expand to Germany, Switzerland
2. **If market traction weak:** Pivot OR sell codebase
3. **If funding secured:** Hire team, scale properly

## Future Planning (Archived)

Long-term planning documents moved to `docs/archive/`:
- Multi-tenancy migration plan
- GDPR compliance implementation
- Security hardening checklist (completed, archived for reference)
- Implementation roadmap (superseded by 7-sprint plan)

These will be revisited after Sprint 7 completion and initial launch.

## Development Workflow

See `DEVELOPMENT.md` for setup and `COORDINATION.md` for multi-agent workflow.

**Key Principles:**
- Sprint-based development on focused branches
- Quality gates before every merge
- Session notes in `CLAUDE.md`
- Decisions logged in `DECISION_LOG.md`
