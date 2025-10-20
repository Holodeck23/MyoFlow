# Codex Handoff: Onboarding Wizard Implementation

**Created:** October 19, 2025, 6:11 PM
**From:** Claude
**To:** Codex
**Priority:** High (MVP Launch Blocker)
**Branch:** `feature/onboarding-wizard`
**Estimated Time:** 2-3 hours

---

## 🎯 Objective

Implement a 3-step onboarding wizard that new users complete after registration before accessing the dashboard.

**Why This Matters:**
- Currently: New users land on dashboard with default Linz address → confusing
- QA found: Old test accounts have no therapist profile → "User not found" errors
- Fix: Guide new users through critical setup on first login

---

## 📋 Spec Location

**Read these first:**
- `.agent-os/specs/2025-10-19-onboarding-wizard/spec.md` - Full requirements
- `.agent-os/specs/2025-10-19-onboarding-wizard/tasks.md` - Implementation checklist

---

## 🚀 Implementation Summary

### What You're Building

**3-Step Linear Wizard:**
1. **Business Information** - Address, postal code, city
2. **Professional Details** - Designation, VAT status
3. **All Set!** - Confirmation, redirect to dashboard

**Middleware Logic:**
- If `profileCompletionScore < 70` → redirect to `/onboarding`
- After wizard completion → score = 70+ → allow dashboard access

---

## 📂 Files to Create

```
apps/web/app/onboarding/
├── page.tsx                          # NEW - Main wizard wrapper
├── layout.tsx                        # NEW - Clean layout (no sidebar)
└── components/
    ├── Step1BusinessInfo.tsx         # NEW - Address form
    ├── Step2Professional.tsx         # NEW - Designation + VAT
    ├── Step3Complete.tsx             # NEW - Confirmation
    └── WizardProgress.tsx            # NEW - Step indicator
```

---

## 📝 Files to Modify

1. **`apps/web/middleware.ts`**
   - Add redirect logic (see spec lines 92-105)
   - Check `profileCompletionScore < 70`
   - Redirect to `/onboarding`

2. **`apps/web/app/api/settings/profile/route.ts`**
   - Add `calculateProfileScore()` function
   - Update score on profile save
   - Return score in response

---

## 🔧 Key Technical Details

### Session Data Available

```typescript
import { auth } from '@/lib/auth'

const session = await auth()
session.user.therapist = {
  id: string
  businessName: string              // Pre-filled from registration
  profileCompletionScore: number    // Use for redirect logic
}
```

### API Endpoint to Use

**DO NOT create new endpoints.** Use existing:
```typescript
// PUT /api/settings/profile
// Already handles profile updates
// Just needs score calculation added
```

### Validation Helpers to Reuse

```typescript
import {
  assertValidAustrianPostalCode,
  normalizeVatNumber,
} from '@myoflow/lib'
```

### Form Components Reference

**Look at (but don't copy):**
`apps/web/app/dashboard/settings/components/ProfileTab.tsx`

This shows:
- Field structure
- Validation patterns
- react-hook-form usage

**Build wizard-specific versions** with:
- Simpler layout (wizard steps)
- Only required fields per step
- Navigation buttons (Next/Back)

---

## ✅ Implementation Phases

### Phase 1: UI Components (1h)
1. Create wizard page with step state
2. Build 3 step components
3. Add progress indicator
4. Wire up navigation (Next/Back)

### Phase 2: Middleware (15min)
1. Add redirect logic to `middleware.ts`
2. Test redirect works

### Phase 3: API Integration (30min)
1. Connect Step 1 to profile API
2. Connect Step 2 to profile API
3. Add score calculation
4. Handle errors

### Phase 4: Testing (30min)
1. Create test4@myoflow.com
2. Complete wizard
3. Verify redirect logic
4. Test existing users unaffected

---

## 🎯 Acceptance Criteria

**Must work:**
- [ ] New user → redirected to `/onboarding`
- [ ] Complete 3 steps → score updates to 70+
- [ ] After completion → allowed to access dashboard
- [ ] Existing users (score >= 70) → no redirect
- [ ] Austrian postal code validation works
- [ ] Form errors show clearly

**Quality gates:**
- [ ] TypeScript: Clean
- [ ] ESLint: Clean
- [ ] Build: Success
- [ ] Manual test: Signup → wizard → dashboard

---

## 📊 Profile Scoring Logic

```typescript
function calculateProfileScore(data: ProfileData): number {
  let score = 20 // Base from registration

  // Business info (+30)
  if (validAddress(data)) score += 30

  // Professional details (+20)
  if (data.designation && data.vatStatus) score += 20

  // Optional fields (+10 each, max 30)
  if (data.chamberRegistration) score += 10
  if (data.certificates?.length > 0) score += 10
  if (data.iban) score += 10

  return Math.min(score, 100)
}

// After wizard: 20 (base) + 30 (address) + 20 (professional) = 70 ✓
```

---

## 🔍 Testing Scenarios

### Happy Path
1. Register as test4@myoflow.com
2. Redirected to `/onboarding`
3. Fill Step 1 → Next
4. Fill Step 2 → Next
5. See Step 3 confirmation
6. Click "Go to Dashboard"
7. Land on dashboard (score = 70)

### Edge Cases
1. Type `/dashboard` in URL → redirect to `/onboarding`
2. Complete wizard → manually go back to `/onboarding` → allowed (not forced)
3. Sign in with existing account (score = 100) → no redirect
4. Close browser at Step 2 → resume where left off

### Validation
1. Leave business name empty → error
2. Enter postal code "123" → error
3. Enter postal code "5000" → error (must start with 4)
4. Enter "4020" → success

---

## 🚨 Important Notes

**Middleware Configuration:**
```typescript
export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/onboarding'],
  // Add /onboarding to matcher
}
```

**Score Threshold:**
- Incomplete: `< 70` → force onboarding
- Complete: `>= 70` → allow dashboard

**Existing Users:**
- Don't break accounts with score >= 70
- Check session exists before accessing therapist data

**Component Architecture:**
- Use `'use client'` for wizard components (need React state)
- Layout can be server component
- Keep components focused (one step per file)

---

## 📦 Deliverables

**When you're done, commit with:**
```bash
git add apps/web/app/onboarding apps/web/middleware.ts apps/web/app/api/settings/profile/route.ts
git commit -m "feat: add onboarding wizard for new users

- 3-step wizard (business info, professional details, confirmation)
- Middleware redirects users with profileCompletionScore < 70
- Reuses existing profile API endpoints
- Updates profile completion scoring
- Forces critical field completion before dashboard access

Closes #[issue-number]"
```

**Run quality gates:**
```bash
pnpm typecheck && pnpm lint && pnpm build
```

**Test manually:**
- Create test4@myoflow.com
- Complete wizard
- Verify dashboard access works

---

## 🤝 Coordination

**Current State:**
- Dev server running on port 3003
- QA instructions created but not yet run
- Waiting for onboarding wizard before full QA

**After Implementation:**
- Update QA instructions to test wizard flow
- Run Perplexity QA agent with test3@myoflow.com
- Verify no "User not found" errors with fresh accounts

---

## 🔗 Reference Files

**Existing (don't modify, just reference):**
- `apps/web/app/api/auth/register/route.ts` - Creates defaults
- `apps/web/app/dashboard/settings/components/ProfileTab.tsx` - Field examples
- `packages/lib/src/validation/postal.ts` - Austrian postal validation

**Modify:**
- `apps/web/middleware.ts` - Add redirect logic
- `apps/web/app/api/settings/profile/route.ts` - Add score calculation

**Create:**
- Everything in `apps/web/app/onboarding/`

---

## ⏱️ Time Estimate: 2-3 Hours

Start now. Follow tasks.md checklist. Report when done.

**Good luck, Codex!** 🚀
