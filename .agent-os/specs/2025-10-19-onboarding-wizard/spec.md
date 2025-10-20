# Onboarding Wizard for New Users

**Created:** October 19, 2025
**Status:** Ready for Implementation
**Priority:** High (MVP Launch Blocker)
**Estimated:** 2-3 hours

---

## 🎯 Problem Statement

**Current Issue:**
New users sign up and land directly on the dashboard with default values (Linz address, KLEINUNTERNEHMER). They must manually navigate to Settings to update their actual business information.

**QA Finding:**
Perplexity agent tested with existing test@myoflow.com account (created before auto-setup existed) → hit "User account not found" errors because old accounts lack therapist profiles.

**Root Cause:**
- Registration creates defaults but no guided onboarding flow
- No middleware redirect to force profile completion
- Users can access full app with placeholder data

---

## 🎨 Solution: Linear 3-Step Wizard

**Flow:**
```
Registration → Onboarding Wizard → Dashboard

Wizard Steps:
1. Business Information (name, address, postal code)
2. Professional Details (designation, VAT status)
3. All Set! (confirmation, redirect to dashboard)
```

**Force Completion:**
- Middleware redirects `/dashboard` → `/onboarding` if `profileCompletionScore < 70`
- Users cannot access app until critical fields filled
- Optional fields can be completed later via Settings

---

## 📋 Requirements

### Step 1: Business Information
**Required Fields:**
- ✅ Business Name (pre-filled from registration)
- ✅ Street Address (replace Linz default)
- ✅ Postal Code (Austrian 4xxx validation)
- ✅ City
- ✅ Country (default: Austria)

**Validation:**
- Austrian postal code format (4xxx)
- All required fields non-empty
- Street must be different from "Hauptstraße 1" (default)

**Score Impact:** +30 points (total: 50)

---

### Step 2: Professional Details
**Required Fields:**
- ✅ Professional Designation (dropdown: HEILMASSEUR, PHYSIOTHERAPEUT, etc.)
- ✅ VAT Status (radio: KLEINUNTERNEHMER / VAT_LIABLE)

**Optional Fields (show but allow skip):**
- Chamber Registration ID
- Professional Certificates

**Validation:**
- Designation must be selected
- VAT status must be chosen (default: KLEINUNTERNEHMER)

**Score Impact:** +20 points (total: 70)

---

### Step 3: All Set!
**Display:**
- ✅ Confirmation message: "Your profile is ready!"
- ✅ Summary of entered data
- ✅ "Go to Dashboard" button
- ✅ Optional: "Complete advanced settings" link → Settings page

**Actions:**
- Set `profileCompletionScore = 70`
- Redirect to `/dashboard`

---

## 🔧 Technical Implementation

### 1. Create Onboarding Pages

**File Structure:**
```
apps/web/app/onboarding/
├── page.tsx                    # Main wizard wrapper
├── layout.tsx                  # Clean layout (no sidebar)
├── components/
│   ├── Step1BusinessInfo.tsx
│   ├── Step2Professional.tsx
│   ├── Step3Complete.tsx
│   └── WizardProgress.tsx      # Step indicator (1/3, 2/3, 3/3)
```

**Wizard State Management:**
- Use React state for current step (1, 2, or 3)
- Use react-hook-form for validation
- Call existing `/api/settings/profile` PUT endpoint
- Update `profileCompletionScore` on completion

---

### 2. Middleware Redirect Logic

**File:** `apps/web/middleware.ts`

**Add after line 12:**
```typescript
// Check if user needs onboarding
const therapist = session.user.therapist
const needsOnboarding = therapist?.profileCompletionScore < 70

// Redirect to onboarding if incomplete
if (needsOnboarding && !pathname.startsWith('/onboarding') && !pathname.startsWith('/api')) {
  const redirectUrl = new URL('/onboarding', req.url)
  return NextResponse.redirect(redirectUrl)
}

// Allow onboarding page when score >= 70 (in case they want to revisit)
// But don't force it
```

**Exempt Routes:**
- `/api/*` - API calls
- `/auth/*` - Authentication
- `/onboarding` - The wizard itself

---

### 3. Profile Completion Scoring

**Update:** `apps/web/app/api/settings/profile/route.ts`

**Scoring Logic:**
```typescript
function calculateProfileScore(data: ProfileData): number {
  let score = 20 // Base score from registration

  // Business info complete (+30)
  if (data.businessName &&
      data.businessAddress &&
      data.businessAddress !== 'Hauptstraße 1' &&
      data.postalCode?.match(/^4\d{3}$/)) {
    score += 30
  }

  // Professional details complete (+20)
  if (data.designation && data.vatStatus) {
    score += 20
  }

  // Optional fields (+10 each, max 30)
  if (data.chamberRegistration) score += 10
  if (data.certificates?.length > 0) score += 10
  if (data.iban) score += 10

  return Math.min(score, 100)
}
```

---

### 4. Reuse Existing Components

**DO NOT rebuild forms from scratch.** Reuse:
- `apps/web/app/dashboard/settings/components/ProfileTab.tsx` - Field definitions
- Austrian validation helpers from `@myoflow/lib` (postal codes, IBAN)
- Existing API endpoint `/api/settings/profile` PUT

**Wizard-specific changes:**
- Split ProfileTab into Step 1 (address) + Step 2 (professional)
- Add step navigation (Next/Back buttons)
- Add progress indicator
- Simplified validation (only required fields)

---

## 🎯 Acceptance Criteria

**Functionality:**
- [ ] New user signs up → redirected to `/onboarding`
- [ ] Cannot access `/dashboard` until onboarding complete
- [ ] Step 1: Business address validation works
- [ ] Step 2: VAT status selection saves correctly
- [ ] Step 3: Confirmation shows, redirects to dashboard
- [ ] Profile completion score updates to 70+
- [ ] Middleware allows dashboard access after completion

**UX:**
- [ ] Progress indicator shows current step (1/3, 2/3, 3/3)
- [ ] "Back" button works between steps
- [ ] Form validation shows errors clearly
- [ ] Clean layout (no dashboard sidebar during onboarding)
- [ ] Mobile responsive

**Edge Cases:**
- [ ] User closes browser mid-wizard → progress saved, can resume
- [ ] User manually navigates to `/dashboard` → redirected back
- [ ] Existing users with score >= 70 → no redirect
- [ ] API errors handled gracefully with retry option

---

## 🚀 Implementation Order

1. **Create wizard UI components** (1h)
   - 3 step components
   - Wizard wrapper with navigation
   - Progress indicator

2. **Add middleware redirect** (15min)
   - Check `profileCompletionScore < 70`
   - Redirect to `/onboarding`

3. **Wire up API calls** (30min)
   - Call existing `/api/settings/profile` PUT
   - Update score calculation
   - Handle errors

4. **Testing** (30min)
   - Create fresh test account
   - Complete wizard flow
   - Verify redirect logic
   - Test validation

---

## 📊 Success Metrics

**Before:**
- New users land on dashboard with defaults
- Manual settings update required
- Confusion about placeholder data

**After:**
- 100% of new users complete critical profile setup
- 0% placeholder data in production
- Clean first-run experience

---

## 🔗 Related Files

**Existing (reuse):**
- `apps/web/app/api/auth/register/route.ts` - Creates defaults
- `apps/web/app/api/settings/profile/route.ts` - Profile API
- `apps/web/app/dashboard/settings/components/ProfileTab.tsx` - Field definitions
- `packages/lib/src/validation/` - Austrian validators

**New (create):**
- `apps/web/app/onboarding/page.tsx`
- `apps/web/app/onboarding/components/`
- `apps/web/middleware.ts` (modify)

---

## 💡 Future Enhancements (Post-MVP)

- Email verification step
- Profile photo upload
- Calendar sync setup
- Invite team members
- Tour of dashboard features

---

**Ready for Codex implementation.**
