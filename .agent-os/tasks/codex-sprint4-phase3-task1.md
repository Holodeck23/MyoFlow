# Codex Brief: Sprint 4 Phase 3 - Task 1: ProfileTab UI Implementation

**Date:** November 9, 2025
**Branch:** Create `sprint4/phase3/profile-tab` from `main`
**Priority:** P1 - Settings Completion
**Estimated Time:** 4 hours
**Owner:** Codex

---

## 🎯 Mission

Convert ProfileTab from read-only placeholders to a fully functional editable form with Austrian compliance validation and credentials management.

---

## 📋 Task Reference

**Full Task List:** `.agent-os/specs/sprint-4-settings-completion/tasks.md`
**Execution Plan:** `.agent-os/specs/sprint-4-settings-completion/SPRINT4_EXECUTION_PLAN.md`
**Focus:** Task 1 (subtasks 1.1 - 1.8)

---

## ✅ Subtasks (Follow in Order)

### 1.1 Write Unit Tests for ProfileTab Component
- [ ] Test form initialization with existing profile data
- [ ] Test Austrian postal code validation (4xxx format)
- [ ] Test VAT number format validation (ATUxxxxxxxx)
- [ ] Test IBAN validation for Austrian accounts (AT##)
- [ ] Mock API responses for `/api/settings/profile` GET/PUT endpoints
- **File:** Create `apps/web/app/dashboard/settings/components/__tests__/ProfileTab.test.tsx`

### 1.2 Create ProfileTab Form with react-hook-form
- [ ] Import useForm hook and setup form state management
- [ ] Add form fields: business name, email, phone
- [ ] Add Austrian address fields: street, city, postal, country
- [ ] Add business legal form selector (Einzelunternehmen/OG/KG/GmbH)
- [ ] Implement field-level validation with error messages
- **File:** `apps/web/app/dashboard/settings/components/ProfileTab.tsx`

### 1.3 Implement VAT/IBAN Input Fields with Austrian Validation
- [ ] Create VAT number input with ATUxxxxxxxx format validation
- [ ] Create IBAN input with Austrian IBAN format (AT##)
- [ ] Implement real-time format suggestions and feedback
- [ ] Add help text explaining Austrian compliance requirements
- **Use existing validation:** `packages/lib/src/validation/vat.ts`, `iban.ts`

### 1.4 Add Credentials Management UI
- [ ] Create credentials table showing professional licenses
- [ ] Add modal for adding new credentials (type, number, issue date, expiry)
- [ ] Implement edit functionality for existing credentials
- [ ] Add archive button with confirmation dialog
- [ ] Wire to `/api/settings/credentials` endpoint
- **New Component:** Consider `apps/web/app/dashboard/settings/components/CredentialsManager.tsx`

### 1.5 Wire Form Submission to PUT /api/settings/profile
- [ ] Implement handleSubmit with optimistic update
- [ ] Show loading spinner during API call
- [ ] Update local state immediately for UX feedback
- [ ] Handle validation errors (400) with field-level error display
- [ ] Handle auth errors (401) with redirect to sign-in
- **Endpoint:** Already exists - check `apps/web/app/api/settings/profile/route.ts`

### 1.6 Implement Optimistic Updates and Error Recovery
- [ ] Update ProfileCompletionWidget % immediately on save
- [ ] Revert optimistic update if API call fails
- [ ] Show toast notification on success/error
- [ ] Implement retry mechanism for failed submissions

### 1.7 Add Loading States and Prevent Double-Submits
- [ ] Disable form inputs while submitting
- [ ] Show loading spinner on save button
- [ ] Prevent multiple concurrent submissions
- [ ] Show "Saving..." text during submission

### 1.8 Verify All ProfileTab Tests Pass
- [ ] Run: `pnpm test ProfileTab`
- [ ] Verify form submission flow end-to-end
- [ ] Test error handling for invalid postal codes
- [ ] Test credentials CRUD operations

---

## 🔧 Technical Requirements

### Validation Rules (Austrian-Specific)
```typescript
// Postal Code: 4-digit, starting with 1-9 (Upper Austria = 4xxx)
/^[1-9]\d{3}$/

// VAT Number: ATU + 8 digits
/^ATU\d{8}$/

// IBAN: AT + 2 digits + 16 alphanumeric
/^AT\d{2}[A-Z0-9]{16}$/
```

### API Endpoints to Use
- `GET /api/settings/profile` - Fetch profile data
- `PUT /api/settings/profile` - Update profile data
- `GET /api/settings/credentials` - List credentials
- `POST /api/settings/credentials` - Add credential
- `PUT /api/settings/credentials/[id]` - Update credential
- `DELETE /api/settings/credentials/[id]` - Archive credential

### Form Library
- **Use:** `react-hook-form` (already in package.json)
- **Pattern:** Follow existing TravelTab implementation (if available)

### UI Components
- **Use:** Existing components from `@/components/ui/*`
- **Toast:** Use existing toast system
- **Modal:** Use Dialog component for credentials management

---

## 📁 Key Files to Modify/Create

**Modify:**
1. `apps/web/app/dashboard/settings/components/ProfileTab.tsx` - Main form implementation

**Create:**
1. `apps/web/app/dashboard/settings/components/__tests__/ProfileTab.test.tsx` - Unit tests
2. `apps/web/app/dashboard/settings/components/CredentialsManager.tsx` - Credentials CRUD UI (optional separate component)

**Reference (Don't Modify):**
- `packages/lib/src/validation/vat.ts` - VAT validation helper
- `packages/lib/src/validation/iban.ts` - IBAN validation helper
- `packages/lib/src/validation/postal.ts` - Postal code validation helper
- `apps/web/app/api/settings/profile/route.ts` - API endpoint (already implemented Oct 15)

---

## ✅ Acceptance Criteria

**Must Pass:**
- [x] TypeScript: 0 errors
- [x] ESLint: No new warnings
- [x] Unit tests: All ProfileTab tests passing
- [x] Manual test: Can edit and save profile data
- [x] Validation: Austrian postal codes, VAT, IBAN validated correctly
- [x] Error handling: 400/401 errors display user-friendly messages
- [x] Loading states: Form disabled during submission
- [x] Optimistic updates: UI updates immediately, reverts on failure
- [x] Credentials: Can add/edit/archive professional licenses

**Quality Gates:**
```bash
pnpm typecheck  # Must pass
pnpm lint       # No new warnings
pnpm test ProfileTab  # All tests pass
pnpm build      # Must succeed
```

---

## 🚨 Important Notes

### What Already Exists (Don't Duplicate)
- ✅ API endpoint `/api/settings/profile` with PUT handler (created Oct 15)
- ✅ Validation helpers in `packages/lib/src/validation/`
- ✅ Austrian postal code validation already used in client forms
- ✅ Settings page structure and tab navigation

### What Needs Creation
- ❌ ProfileTab form implementation (currently read-only)
- ❌ Credentials management UI
- ❌ ProfileTab unit tests
- ❌ Form validation integration

### Austrian Compliance Requirements
- **Postal Codes:** Must be 4 digits, 1000-9999 (1xxx Vienna, 4xxx Upper Austria)
- **VAT Numbers:** Must start with ATU + 8 digits
- **IBAN:** Must start with AT + 2-digit checksum + 16 alphanumeric
- **Legal Forms:** Einzelunternehmen, OG, KG, GmbH (Austrian business entities)

### Testing Strategy
- **Unit Tests:** Test validation, form state, error handling
- **Manual Tests:** Use local dev server to test full workflow
- **No E2E:** E2E tests will be added in Phase 4 (Jules)

---

## 🎯 Success Definition

ProfileTab is complete when:
1. ✅ User can edit business info (name, email, phone, address)
2. ✅ Austrian validation prevents invalid postal codes/VAT/IBAN
3. ✅ Form submits to API and updates profile data
4. ✅ Optimistic updates provide instant feedback
5. ✅ Error messages are clear and actionable
6. ✅ Credentials can be added/edited/archived
7. ✅ All tests pass, no TypeScript errors, build succeeds

---

## 📝 Commit Strategy

**Branch Naming:** `sprint4/phase3/profile-tab`

**Commit Messages:**
```bash
test(settings): add ProfileTab unit tests
feat(settings): implement ProfileTab editable form
feat(settings): add Austrian validation for VAT/IBAN
feat(settings): add credentials management UI
feat(settings): wire ProfileTab to API endpoint
fix(settings): improve error handling and loading states
```

**Final Commit:**
```bash
git add .
git commit -m "feat(sprint4): complete ProfileTab UI implementation (Task 1)

- Editable business info form with react-hook-form
- Austrian postal code, VAT, IBAN validation
- Credentials management (add/edit/archive)
- Optimistic updates with error recovery
- Loading states and double-submit prevention
- Comprehensive unit test coverage

Closes Task 1 of Sprint 4 Phase 3"
```

---

## 🤝 Handoff Back to Claude

When complete, report:
1. ✅ Summary of changes made
2. ✅ Test results (passing/failing)
3. ✅ Any issues encountered
4. ✅ Screenshots/demo if possible
5. ✅ Recommended next steps (Task 2: ComplianceTab?)

---

## 📚 Reference Documentation

- **Sprint 4 Plan:** `.agent-os/specs/sprint-4-settings-completion/SPRINT4_EXECUTION_PLAN.md`
- **Task List:** `.agent-os/specs/sprint-4-settings-completion/tasks.md`
- **API Validation:** Check existing `apps/web/app/api/settings/profile/route.ts`
- **Validation Helpers:** `packages/lib/src/validation/`
- **Similar Pattern:** `apps/web/app/dashboard/settings/components/TravelTab.tsx` (if exists)

---

**Ready to execute!** Start with 1.1 (write tests), then proceed through 1.8. Focus on code quality and Austrian compliance. Good luck! 🚀
