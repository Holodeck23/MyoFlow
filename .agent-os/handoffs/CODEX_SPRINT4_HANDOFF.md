# 🚀 CODEX HANDOFF: Sprint 4 - Settings Completion

**Lead Developer:** Claude
**Assigned To:** Codex
**Created:** October 15, 2025
**Priority:** HIGH
**Timeline:** Oct 15-20 (6 days, 42 hours total)

---

## 🎯 MISSION

Complete **Sprint 4: Settings Completion** - Make all settings tabs fully functional with working save/edit/delete operations. Transform read-only UI into production-ready CRUD interface.

---

## 📋 EXECUTION PLAN LOCATION

**Full Details:** `.agent-os/specs/sprint-4-settings-completion/SPRINT4_EXECUTION_PLAN.md`

**Key Sections:**
- Current State Audit (what's done vs. gaps)
- 5-Phase Roadmap with acceptance criteria
- Delegation matrix (Codex = 28h total work)
- Risk mitigation strategies

---

## 🎯 YOUR ASSIGNMENTS (Codex)

### Phase 2: Endpoint Enhancements (12h) - START HERE
**Priority:** CRITICAL PATH
**Branch:** `sprint4/codex/api-enhancements`

**Tasks:**
1. Add PUT handlers to 5 GET-only endpoints:
   - `/api/settings/profile`
   - `/api/settings/tax-compliance`
   - `/api/settings/invoice-branding`
   - `/api/settings/rksv`
   - `/api/settings/system`

2. Create new endpoints:
   - `/api/settings/pricing/[id]` (PUT/DELETE for individual service rates)
   - `/api/settings/credentials` (GET/POST for professional licenses)
   - `/api/settings/credentials/[id]` (PUT/DELETE)

3. Implement Austrian validation helpers:
   - Postal code validation (4xxx format)
   - UID/VAT number validation (ATUxxxxxxx format)
   - IBAN validation (Austrian format)

4. Align all DTOs with Prisma schema (zero name mismatches)

**Pattern to Follow:**
- Use `/api/settings/travel/route.ts` as reference (GET + PUT with upsert)
- Auth with `requireTherapist` helper
- Return `{ success: true, data: ... }` format
- Update `settingsLastUpdated` timestamp on writes
- Mark routes with `export const dynamic = 'force-dynamic'`

**Acceptance Criteria:**
- ✅ All endpoints support full CRUD where applicable
- ✅ Austrian validation prevents invalid data (postal 4xxx, UID ATU12345678)
- ✅ Response DTOs match Prisma exactly (no field name mismatches)
- ✅ Consistent error responses (400/401/500 with clear messages)

---

### Phase 3: API Integration (6h) - AFTER PHASE 2
**Priority:** HIGH
**Branch:** Continue on `sprint4/codex/api-enhancements`

**Tasks:**
1. Wire ProfileTab form to `/api/settings/profile` PUT endpoint
2. Wire ComplianceTab form to `/api/settings/tax-compliance` PUT
3. Wire TravelTab form to existing `/api/settings/travel` PUT
4. Wire PricingTab to `/api/settings/pricing` POST + new `[id]` endpoints

**Pattern:**
- Use `react-hook-form` for form state
- Optimistic UI updates on save
- Error handling with toast notifications
- Loading states prevent double-submits

**Acceptance Criteria:**
- ✅ Every tab saves data successfully
- ✅ Form validation prevents invalid Austrian data
- ✅ Optimistic UI provides instant feedback
- ✅ Error states display user-friendly messages

---

### Phase 3.5: Form Logic Support (Coordinate with Gemini) (10h)
**Priority:** MEDIUM
**Branch:** `sprint4/codex/form-logic`

**Tasks:**
- Implement form submission handlers for all tabs
- Add data transformation logic (form → API DTO)
- Handle server responses and error states
- Implement optimistic updates with rollback

**Coordination with Gemini:**
- Gemini builds UI components (inputs, modals, layouts)
- You wire up API calls and state management
- Share types/interfaces for form data

---

## 🗺️ DETAILED TIMELINE

**Day 1 (Oct 15 - Today):**
- ✅ Claude: Audit complete, execution plan ready
- 🚀 Codex START: Phase 2 - Create PUT handlers (6h target)
  - Start with `/api/settings/profile` (highest user value)
  - Then `/api/settings/tax-compliance`
  - Complete Austrian validation helpers

**Day 2-3 (Oct 16-17):**
- Codex: Finish Phase 2 endpoints (6h remaining)
  - Complete remaining PUT handlers
  - Create `/api/settings/pricing/[id]`
  - Create credentials endpoints
- Codex: Start Phase 3 API integration (3h)
  - Wire ProfileTab to backend
  - Wire ComplianceTab

**Day 4-5 (Oct 18-19):**
- Codex: Finish Phase 3 + Phase 3.5 (13h)
  - Complete all tab integrations
  - Coordinate with Gemini on form components
  - Implement optimistic updates

**Day 6 (Oct 20):**
- Claude: QA & merge
- Codex: Address feedback, polish

---

## 📁 FILES YOU'LL MODIFY

### API Routes (Primary Focus)
```
apps/web/app/api/settings/
├── profile/route.ts           ← Add PUT handler
├── tax-compliance/route.ts    ← Add PUT handler
├── invoice-branding/route.ts  ← Add PUT handler
├── rksv/route.ts              ← Add PUT handler
├── system/route.ts            ← Add PUT handler
├── pricing/
│   ├── route.ts               ← Existing GET/POST
│   └── [id]/route.ts          ← CREATE (PUT/DELETE)
└── credentials/
    ├── route.ts               ← CREATE (GET/POST)
    └── [id]/route.ts          ← CREATE (PUT/DELETE)
```

### Validation Utilities (New)
```
packages/lib/src/validation/
├── austrian-postal.ts         ← CREATE
├── austrian-vat.ts            ← CREATE
└── austrian-iban.ts           ← CREATE
```

### Tab Components (API Integration)
```
apps/web/app/dashboard/settings/components/
├── ProfileTab.tsx             ← Wire to API
├── ComplianceTab.tsx          ← Wire to API
├── TravelTab.tsx              ← Wire to API
└── PricingTab.tsx             ← Wire to API
```

---

## 🔧 CODE PATTERNS & STANDARDS

### 1. PUT Handler Template
```typescript
export async function PUT(request: NextRequest) {
  try {
    const { therapist } = await ensureTherapistAccount(request)
    const payload = await request.json()
    const parsed = UpdateSchema.parse(payload)

    const updated = await prisma.tableName.update({
      where: { therapistId: therapist.id },
      data: { ...parsed, updatedAt: new Date() },
    })

    await prisma.therapist.update({
      where: { id: therapist.id },
      data: {
        settingsLastUpdated: new Date(),
        settingsVersion: { increment: 1 },
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    // Handle Zod + generic errors
  }
}
```

### 2. Austrian Validation Example
```typescript
// packages/lib/src/validation/austrian-postal.ts
export function validateAustrianPostal(code: string): boolean {
  return /^[1-9]\d{3}$/.test(code) // 1000-9999
}

export function validateAustrianUID(uid: string): boolean {
  return /^ATU\d{8}$/.test(uid) // ATU12345678
}
```

### 3. API Integration Pattern
```typescript
// In Tab component
const handleSave = async (data: FormData) => {
  setIsSaving(true)
  setError(null)

  try {
    const response = await fetch('/api/settings/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message)
    }

    const result = await response.json()
    // Optimistic update or refetch
    toast.success('Settings saved successfully')
  } catch (err) {
    setError(err.message)
    toast.error('Failed to save settings')
  } finally {
    setIsSaving(false)
  }
}
```

---

## ✅ QUALITY GATES

**Before Commit:**
```bash
pnpm typecheck && pnpm lint && pnpm build
```

**Before PR:**
- ✅ All endpoints tested with Postman/curl
- ✅ Austrian validation works (try invalid postal 0000, invalid UID ATU1234)
- ✅ Error responses are user-friendly
- ✅ TypeScript errors = 0
- ✅ ESLint warnings = 0

---

## 🚨 RISK MITIGATION

### API Breaking Changes
- Version all DTOs if schema changes
- Maintain backward compat for existing clients
- Document breaking changes in PR description

### Performance Issues
- Use Prisma's `select` to limit fields returned
- Add `.where()` filters before complex queries
- Profile completion caching (already done in /overview)

### Data Integrity
- Always use transactions for multi-table updates
- Validate data at API boundary (Zod schemas)
- Test edge cases (null values, empty strings, max lengths)

---

## 📞 COORDINATION

**Questions/Blockers:**
- Tag Claude in PR comments for architectural decisions
- Use `.agent-os/meta/coordination-plan.md` template for progress updates
- Update `CLAUDE.md` session notes when complete

**With Gemini:**
- Share TypeScript interfaces for form data
- Coordinate on form field names (must match API DTOs)
- Test integration together before marking complete

**With Jules:**
- Jules will write tests AFTER your endpoints are complete
- Provide example requests/responses for test cases
- Flag any tricky validation edge cases

---

## 📚 REFERENCE DOCS

**Existing Patterns:**
- `/api/settings/travel/route.ts` - Perfect GET+PUT example
- `/api/settings/pricing/route.ts` - Good POST example
- `/api/therapist/profile/route.ts` - Profile completion logic

**Database Schema:**
- `packages/db/schema.prisma` - Source of truth for all models
- TravelSettings, TaxComplianceSettings, ServiceRateTemplate already exist

**Validation:**
- Austrian postal codes: 1000-9999 (4 digits, no leading zero)
- Austrian UID: ATU12345678 (ATU + 8 digits)
- Austrian IBAN: AT + 2 check digits + 16 digits

---

## 🎯 SUCCESS METRICS

**Functional Completeness:**
- 8/8 API endpoints fully CRUD-capable ✅
- 7/7 settings tabs save data successfully ✅
- 0 placeholder/hardcoded data remaining ✅

**Code Quality:**
- Zero TypeScript errors
- Zero ESLint warnings
- Consistent error handling across all endpoints

**User Experience:**
- Profile completion % updates correctly
- Settings persist across sessions
- Validation prevents invalid Austrian data

---

## 🚀 READY TO START

**Your first task:** Create PUT handler for `/api/settings/profile`

**Branch:** `sprint4/codex/api-enhancements`

**Estimated time:** 1-2 hours

**Test with:**
```bash
curl -X PUT http://localhost:3000/api/settings/profile \
  -H "Content-Type: application/json" \
  -d '{"businessName": "Test Practice", "businessEmail": "test@example.com"}'
```

---

**Questions?** Check the full execution plan or tag Claude in PR.

**LET'S SHIP SPRINT 4! 🚀**
