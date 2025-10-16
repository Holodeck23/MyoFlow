# Codex Handoff: UX Polish & Launch Blockers

**Date:** October 16, 2025
**Spec:** UX Polish & Launch Blockers
**Priority:** Launch Blocker (High)
**Estimated Effort:** 3-4 days

---

## 🚨 IMPORTANT: Agent OS Workflow

**Before starting implementation, you MUST follow the Agent OS process:**

1. **Read the spec files** in this directory:
   - `spec.md` - Full requirements document
   - `sub-specs/technical-spec.md` - Implementation details
   - `sub-specs/database-schema.md` - Database changes

2. **Run the `/create-tasks` command** to generate a detailed task breakdown:
   - This will create `tasks.md` in this spec directory
   - Tasks will be organized by phase with clear acceptance criteria
   - Each task will have proper dependencies and sequencing

3. **Execute tasks systematically**:
   - Work through tasks in order (database → auth → UI → testing)
   - Update `tasks.md` with progress (mark items complete)
   - Run quality gates after each phase (typecheck, lint, build)

4. **Document decisions** in `.agent-os/docs/DECISION_LOG.md` if you deviate from spec

**DO NOT start coding until tasks.md is generated!** This ensures proper planning and tracking.

---

## Context

Based on comprehensive QA testing, several critical UX issues were identified that prevent a "WOW" first-user experience. **Critical insight:** All current accounts in the system are test accounts with dummy data. We need to implement an account type system to:

1. Label existing test accounts appropriately
2. Prevent user confusion about test vs. production data
3. Provide a clear path for users to convert to production accounts
4. Segregate admin accounts from main platform

---

## Objectives

Implement 7 interconnected features to deliver a polished, professional launch experience:

1. **Account Type System** - Database foundation for TEST/PRODUCTION/ADMIN/DEV accounts
2. **Visual Indicators** - Color-coded banners showing account type
3. **Field Validation** - Comprehensive inline validation for regulatory fields
4. **Contextual Tooltips** - Austrian-specific guidance for complex forms
5. **Admin Segregation** - Prevent admin login to main platform
6. **Profile Completion** - Automated prompts for incomplete profiles
7. **Account Conversion** - TEST → PRODUCTION upgrade flow with data archival

---

## Files to Reference

### Spec Documentation
- **Main Spec:** `.agent-os/specs/2025-10-16-ux-polish-launch-blockers/spec.md`
- **Technical Spec:** `.agent-os/specs/2025-10-16-ux-polish-launch-blockers/sub-specs/technical-spec.md`
- **Database Schema:** `.agent-os/specs/2025-10-16-ux-polish-launch-blockers/sub-specs/database-schema.md`

### Existing Validation Library
- **Location:** `packages/lib/src/validation/`
- **Existing Validators:**
  - `iban.ts` - Austrian IBAN format (AT## #### #### #### ####)
  - `vat.ts` - Austrian VAT/UID format (ATU########)
  - `postal.ts` - Austrian postal codes (4xxx)
  - `index.ts` - Central exports

### Key Files to Modify
- `packages/db/prisma/schema.prisma` - Add AccountType enum and ArchivedData model
- `apps/web/src/lib/auth.ts` - Extend MyoFlowSession with accountType
- `apps/web/middleware.ts` - Route protection for admin segregation
- `apps/web/app/layout.tsx` - Add AccountTypeBanner component
- Settings pages - Integrate validation and tooltips

---

## Implementation Sequence

### Phase 1: Database Foundation (Day 1)

**Tasks:**
1. Add `AccountType` enum to Prisma schema (TEST, PRODUCTION, ADMIN, DEV)
2. Add `accountType` field to `User` model (default: TEST)
3. Create `ArchivedData` model for test data storage
4. Generate and run migration: `npx prisma migrate dev --name add-account-type-system`
5. Update existing admin users to ADMIN type (manual SQL if needed)

**Verification:**
```bash
# Check migration applied
npx prisma migrate status

# Verify all users have accountType
DATABASE_URL=postgresql://ZOD@localhost:5432/myoflow psql -c "SELECT id, email, accountType FROM \"User\" LIMIT 10;"
```

---

### Phase 2: Authentication & Session (Day 1-2)

**Tasks:**
1. Extend `MyoFlowSession` interface in `apps/web/src/lib/auth.ts`:
   ```typescript
   interface MyoFlowSession extends Session {
     user: {
       email: string
       name: string | null
       accountType: AccountType  // ← NEW
       isTestAccount: boolean    // ← NEW (computed from accountType)
       isAdmin: boolean          // ← EXISTING
     }
   }
   ```

2. Update NextAuth session callback to populate `accountType` from database

3. Update middleware (`apps/web/middleware.ts`) for admin segregation:
   ```typescript
   if (session.user.accountType === 'ADMIN' && !pathname.startsWith('/admin')) {
     return NextResponse.redirect(new URL('/admin', request.url))
   }
   ```

**Verification:**
- Log in as test user → session includes `accountType: 'TEST'`
- Try accessing `/admin` → redirected to `/dashboard`
- Log in as admin → automatically routed to `/admin`

---

### Phase 3: Visual Indicators (Day 2)

**Tasks:**
1. Create `AccountTypeBanner` component in `apps/web/components/ui/`
2. Implement color-coded banners:
   - TEST: `bg-yellow-50 border-b border-yellow-200 text-yellow-900` + AlertTriangle icon
   - DEV: `bg-blue-50 border-b border-blue-200 text-blue-900` + Code icon
   - ADMIN: `bg-red-50 border-b border-red-200 text-red-900` + Shield icon
   - PRODUCTION: No banner
3. Add dismiss functionality (sessionStorage, reappears on reload)
4. Include tooltip: "This is a test account with sample data. Upgrade when ready."
5. Place in root layout: `apps/web/app/layout.tsx`

**Visual Specs:**
- Height: 48px (mobile), 40px (desktop)
- Font: 14px, medium weight
- Icons: Lucide React (AlertTriangle, Code, Shield)

**Verification:**
- TEST accounts see yellow banner on all pages
- Banner can be dismissed but reappears on reload
- PRODUCTION accounts see no banner

---

### Phase 4: Field Validation Framework (Day 2-3)

**Tasks:**
1. Create Chamber ID validator in `packages/lib/src/validation/chamber.ts`
2. Create Logo URL validator in `packages/lib/src/validation/logo.ts`
3. Export new validators in `packages/lib/src/validation/index.ts`
4. Create reusable `FormField` component with validation support:
   - Real-time validation on blur
   - Inline error messages (Radix Alert)
   - Format hints below input
   - Success checkmark on valid input
5. Integrate validators into all settings forms:
   - Profile settings → IBAN, VAT, postal code
   - Tax compliance → VAT/UID, Chamber ID
   - Invoice branding → Logo URL

**Example Usage:**
```typescript
<FormField
  name="iban"
  label="IBAN"
  placeholder="AT## #### #### #### ####"
  validation={{
    validate: validateAustrianIBAN,
    errorMessage: "Invalid Austrian IBAN format"
  }}
  hint="Example: AT48 1234 5123 4567 8901"
/>
```

**Verification:**
- Enter invalid IBAN → see error message on blur
- Enter valid IBAN → see green checkmark
- Format hints visible before user interaction

---

### Phase 5: Contextual Tooltips (Day 3)

**Tasks:**
1. Create `InfoTooltip` component using Radix UI Tooltip
2. Create tooltip content map for compliance fields:
   ```typescript
   export const TOOLTIP_CONTENT = {
     vatNumber: {
       content: "Your Austrian VAT identification number (UID). Format: ATU########.",
       example: "ATU12345678",
       note: "Only required if you charge VAT."
     },
     chamberId: {
       content: "Your professional chamber registration number.",
       note: "Format varies by Austrian province."
     },
     // ... more fields
   }
   ```
3. Add info icons next to all complex field labels
4. Style tooltips: dark background, white text, max-width 300px, 200ms fade

**Verification:**
- Hover over info icon → see tooltip
- Tooltip includes Austrian-specific context and examples
- Keyboard accessible (focus trigger)

---

### Phase 6: Profile Completion Widget (Day 3)

**Tasks:**
1. Create `ProfileCompletionWidget` component for dashboard
2. Implement completion calculation:
   - Query `TherapistProfile` and `Settings` tables
   - Calculate percentage: (completed fields / total required fields) × 100
   - Required fields: businessName, firstName, lastName, email, country, phone, address, taxId/vatNumber, ibanAccount
3. Display progress bar with color coding:
   - 0-50%: Red, "Complete your profile to start"
   - 51-79%: Yellow, "Almost there!"
   - 80-100%: Green, "Profile complete" (auto-hide after 3s)
4. Show list of missing fields with "Complete Now" quick links
5. Store dismissal in localStorage, reappear if completion drops

**Verification:**
- Dashboard shows widget if profile < 80% complete
- Click "Complete Now" link → navigate to correct settings tab
- Complete field → progress bar updates immediately
- Reach 80% → widget disappears

---

### Phase 7: Account Conversion Flow (Day 4)

**Tasks:**
1. Create settings page: `apps/web/app/settings/account-upgrade/page.tsx`
2. Add "Upgrade to Production" button in Settings sidebar (TEST accounts only)
3. Create confirmation modal with checklist:
   - ✓ Profile 100% complete
   - ✓ IBAN validated
   - ✓ Tax compliance configured
   - ✓ Invoice branding uploaded
   - ✓ Understand test data will be archived
4. Create API endpoint: `apps/web/app/api/settings/account/upgrade/route.ts`
5. Implement upgrade logic:
   ```typescript
   // 1. Validate checklist
   // 2. Serialize test data to JSON
   // 3. Create ArchivedData record
   // 4. Delete test clients/invoices/appointments
   // 5. Update user.accountType to PRODUCTION
   // 6. Clear session, force re-login
   // 7. Send confirmation email
   ```
6. Add dashboard card: "Ready to go live? Upgrade your account"

**Verification:**
- Try to upgrade with incomplete profile → blocked with error
- Complete all requirements → upgrade succeeds
- Test data archived in `ArchivedData` table
- Yellow banner disappears after upgrade
- Email received confirming production activation

---

## Testing Requirements

### Unit Tests (Add to existing test suites)

1. **Validation functions:**
   - `packages/lib/src/validation/__tests__/chamber.test.ts`
   - `packages/lib/src/validation/__tests__/logo.test.ts`

2. **Account upgrade API:**
   - `apps/web/app/api/settings/account/upgrade/route.test.ts`
   - Test validation, archival, and error cases

3. **Middleware routing:**
   - Test admin segregation logic
   - Test TEST/PRODUCTION account routing

### Manual Testing Checklist

- [ ] Create new user → defaults to TEST account type
- [ ] TEST account sees yellow banner on all pages
- [ ] Admin account cannot access `/dashboard`
- [ ] Regular user cannot access `/admin`
- [ ] All regulatory fields show inline validation
- [ ] Tooltips display on hover with Austrian context
- [ ] Profile completion widget calculates percentage correctly
- [ ] Complete profile to 100% → "Upgrade to Production" button enabled
- [ ] Upgrade to production → test data archived, banner disappears
- [ ] PRODUCTION account has clean interface (no banners)

---

## Quality Gates

Before marking complete:

```bash
# 1. TypeScript check
pnpm typecheck

# 2. Lint check
pnpm lint

# 3. Build check
pnpm build

# 4. Database migration status
npx prisma migrate status

# 5. Run existing tests
pnpm test
```

All must pass with zero errors.

---

## Potential Gotchas

### 1. Session Synchronization
**Issue:** Session might not immediately reflect `accountType` changes.
**Solution:** Force session refresh after account upgrade, or require re-login.

### 2. Middleware Redirect Loops
**Issue:** Improper route logic could cause infinite redirects.
**Solution:** Carefully test admin/user routing with both account types.

### 3. Data Archival Performance
**Issue:** Large test datasets could slow down upgrade process.
**Solution:** Archive asynchronously, show loading state during conversion.

### 4. Tooltip Content Management
**Issue:** Hardcoded tooltip text difficult to maintain.
**Solution:** Centralize in `TOOLTIP_CONTENT` map, easy to update.

### 5. Validation Library Integration
**Issue:** Existing validators might not be exported correctly.
**Solution:** Verify `packages/lib/src/validation/index.ts` exports all validators.

---

## Success Criteria

✅ All current test accounts display yellow "Test Account" banner
✅ Admin accounts cannot access main platform routes
✅ All regulatory fields have inline validation with Austrian formats
✅ Complex fields display contextual tooltips with examples
✅ Profile completion widget accurately tracks progress
✅ TEST → PRODUCTION conversion works with data archival
✅ PRODUCTION accounts have clean interface (no test banners)
✅ All quality gates pass (typecheck, lint, build, tests)

---

## Questions or Blockers?

If you encounter issues:
1. Check technical spec for detailed implementation guidance
2. Review database schema for migration details
3. Reference existing validation library patterns
4. Ask user for clarification if requirements unclear

---

## Workflow Summary for Codex

**Step-by-step process:**

```bash
# 1. Read this handoff document (you're here!)

# 2. Review all spec files
# - spec.md
# - sub-specs/technical-spec.md
# - sub-specs/database-schema.md

# 3. Generate task breakdown
/create-tasks

# 4. Review generated tasks.md in this directory

# 5. Begin implementation (Phase 1 → Phase 7)
# - Mark tasks complete as you go
# - Run quality gates after each phase
# - Update DECISION_LOG.md if deviating from spec

# 6. Final verification
pnpm typecheck && pnpm lint && pnpm build && pnpm test
```

**Estimated Timeline:** 3-4 days for complete implementation and testing.

**Remember:** Follow Agent OS workflow = Better planning, tracking, and coordination!

Good luck! 🚀
