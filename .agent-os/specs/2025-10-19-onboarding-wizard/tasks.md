# Onboarding Wizard - Implementation Tasks

**Spec:** `spec.md`
**Priority:** High (MVP Launch Blocker)
**Assignee:** Codex
**Estimated Time:** 2-3 hours

---

## ✅ Task Checklist

### Phase 1: UI Components (1h)

- [ ] **Task 1.1: Create onboarding page structure**
  - File: `apps/web/app/onboarding/page.tsx`
  - Create client component with step state (1, 2, 3)
  - Add step navigation (Next/Back buttons)
  - Handle form submission and step transitions

- [ ] **Task 1.2: Create clean onboarding layout**
  - File: `apps/web/app/onboarding/layout.tsx`
  - No dashboard sidebar/navigation
  - Clean centered card design
  - MyoFlow logo header

- [ ] **Task 1.3: Build Step 1 - Business Information**
  - File: `apps/web/app/onboarding/components/Step1BusinessInfo.tsx`
  - Fields: businessName, street, postalCode, city, country
  - Pre-fill businessName from session
  - Austrian postal code validation (4xxx)
  - Required field validation

- [ ] **Task 1.4: Build Step 2 - Professional Details**
  - File: `apps/web/app/onboarding/components/Step2Professional.tsx`
  - Designation dropdown (HEILMASSEUR, PHYSIOTHERAPEUT, etc.)
  - VAT status radio (KLEINUNTERNEHMER / VAT_LIABLE)
  - Optional: chamberRegistration, certificates

- [ ] **Task 1.5: Build Step 3 - Completion**
  - File: `apps/web/app/onboarding/components/Step3Complete.tsx`
  - Success message
  - Summary of entered data
  - "Go to Dashboard" button

- [ ] **Task 1.6: Create progress indicator**
  - File: `apps/web/app/onboarding/components/WizardProgress.tsx`
  - Show "Step 1 of 3", "Step 2 of 3", "Step 3 of 3"
  - Visual progress bar or step circles

---

### Phase 2: Middleware & Routing (15min)

- [ ] **Task 2.1: Add onboarding redirect logic**
  - File: `apps/web/middleware.ts`
  - Check `session.user.therapist.profileCompletionScore < 70`
  - Redirect to `/onboarding` if incomplete
  - Exempt: `/api/*`, `/auth/*`, `/onboarding`
  - Allow dashboard access if score >= 70

---

### Phase 3: API Integration (30min)

- [ ] **Task 3.1: Wire Step 1 to profile API**
  - Call `PUT /api/settings/profile` with address fields
  - Handle success/error states
  - Update profile completion score

- [ ] **Task 3.2: Wire Step 2 to profile API**
  - Call `PUT /api/settings/profile` with designation + VAT
  - Update score to 70+
  - Handle validation errors

- [ ] **Task 3.3: Update profile score calculation**
  - File: `apps/web/app/api/settings/profile/route.ts`
  - Add `calculateProfileScore()` function (see spec)
  - Return updated score in response
  - Ensure score persists to database

---

### Phase 4: Testing & QA (30min)

- [ ] **Task 4.1: Test new user flow**
  - Create test4@myoflow.com account
  - Verify redirect to `/onboarding` after signup
  - Complete all 3 steps
  - Verify redirect to `/dashboard` after completion

- [ ] **Task 4.2: Test validation**
  - Try invalid postal code (non-4xxx)
  - Try empty required fields
  - Verify error messages show

- [ ] **Task 4.3: Test middleware logic**
  - Manually visit `/dashboard` during onboarding → redirected
  - Complete onboarding, score = 70+
  - Visit `/dashboard` → allowed

- [ ] **Task 4.4: Test existing users**
  - Sign in with account where score >= 70
  - Verify NO redirect to onboarding
  - App works normally

---

## 🎯 Acceptance Criteria

**Must Pass:**
- [x] New users redirected to onboarding
- [x] Cannot access dashboard until complete
- [x] All 3 steps render correctly
- [x] Form validation works
- [x] Profile score updates to 70+
- [x] Middleware redirect logic works
- [x] Existing users unaffected

**Quality Gates:**
- [x] TypeScript: No errors
- [x] ESLint: No warnings
- [x] Build: Success
- [x] Manual test: Fresh signup → complete wizard → dashboard

---

## 📦 Component Reuse

**DO NOT rebuild from scratch:**

Reuse these components/functions:
```typescript
// Validation helpers
import {
  assertValidAustrianPostalCode,
  normalizeVatNumber,
} from '@myoflow/lib'

// Form components (reference for fields)
// apps/web/app/dashboard/settings/components/ProfileTab.tsx

// API endpoint (already exists)
// PUT /api/settings/profile

// Auth session
import { auth } from '@/lib/auth'
```

**Build new:**
- Wizard wrapper with step state
- 3 step components
- Progress indicator
- Middleware redirect logic

---

## 🔍 Testing Checklist

**Happy Path:**
1. Sign up as test4@myoflow.com
2. Redirected to `/onboarding`
3. Step 1: Enter business address
4. Click "Next" → Step 2
5. Select designation + VAT status
6. Click "Next" → Step 3
7. See confirmation
8. Click "Go to Dashboard"
9. Land on dashboard
10. Settings → Profile shows entered data

**Edge Cases:**
1. Close browser at Step 2 → reopen → resume at Step 2
2. Manually type `/dashboard` in URL → redirect to `/onboarding`
3. Complete wizard → score = 70+ → can access dashboard freely
4. Existing user (score = 100) → no onboarding redirect

**Validation:**
1. Leave businessName empty → error
2. Enter postal code "123" → error "Must be 4 digits starting with 4"
3. Enter postal code "5000" → error "Must start with 4"
4. Enter "4020" → accepted

---

## 🚀 Implementation Notes

**Session Data Available:**
```typescript
const session = await auth()
session.user.therapist = {
  id: string
  businessName: string  // Pre-filled from registration
  profileCompletionScore: number  // Check this for redirect
  // ... other fields
}
```

**Profile Score After Wizard:**
- Registration default: 20
- After Step 1 (address): 50
- After Step 2 (professional): 70 ✓ (threshold met)

**Middleware Logic:**
```typescript
const needsOnboarding = session.user.therapist?.profileCompletionScore < 70
const isOnboardingRoute = pathname.startsWith('/onboarding')
const isExemptRoute = pathname.startsWith('/api') || pathname.startsWith('/auth')

if (needsOnboarding && !isOnboardingRoute && !isExemptRoute) {
  return redirect('/onboarding')
}
```

---

## 📝 Deliverables

**Created Files:**
1. `apps/web/app/onboarding/page.tsx`
2. `apps/web/app/onboarding/layout.tsx`
3. `apps/web/app/onboarding/components/Step1BusinessInfo.tsx`
4. `apps/web/app/onboarding/components/Step2Professional.tsx`
5. `apps/web/app/onboarding/components/Step3Complete.tsx`
6. `apps/web/app/onboarding/components/WizardProgress.tsx`

**Modified Files:**
1. `apps/web/middleware.ts` - Add redirect logic
2. `apps/web/app/api/settings/profile/route.ts` - Add score calculation

**Testing:**
- Manual QA completed
- Quality gates passing

---

## ⏱️ Time Breakdown

- UI Components: 1h
- Middleware: 15min
- API Integration: 30min
- Testing: 30min
- **Total: 2h 15min**

---

**Ready to implement. Start with Phase 1 (UI), then Phase 2 (middleware), then Phase 3 (API), then Phase 4 (testing).**
