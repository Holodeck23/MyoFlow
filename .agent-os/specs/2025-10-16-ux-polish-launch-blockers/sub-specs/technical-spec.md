# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-10-16-ux-polish-launch-blockers/spec.md

> Created: 2025-10-16
> Version: 1.0.0

## Technical Requirements

### 0. Account Type System (Foundation)

**Implementation:**
- Add `accountType` enum field to `User` model in Prisma schema
- Enum values: `TEST`, `PRODUCTION`, `ADMIN`, `DEV`
- Default value: `TEST` (current state: all existing accounts are test)
- Add `isTestAccount` helper function to check account type
- Update NextAuth session to include `accountType` field

**Database Migration:**
```prisma
enum AccountType {
  TEST
  PRODUCTION
  ADMIN
  DEV
}

model User {
  // ... existing fields
  accountType AccountType @default(TEST)
}
```

**Session Extension:**
```typescript
// In apps/web/src/lib/auth.ts
interface MyoFlowSession extends Session {
  user: {
    // ... existing fields
    accountType: AccountType
    isTestAccount: boolean
    isAdmin: boolean
  }
}
```

**Acceptance Criteria:**
- All existing users are migrated to `TEST` account type
- Session includes accountType for routing logic
- Helper functions available for type checking throughout app

---

### 1. Visual Account Type Indicators

**Implementation:**
- Create `AccountTypeBanner` component that reads `session.user.accountType` and `process.env.NODE_ENV`
- Display persistent banner at top of all pages with distinct styling based on account type:
  - **TEST Account**: Yellow/amber banner with "Test Account - Sample Data Only" message and warning icon
  - **DEV Account**: Blue banner with "Development Mode" message and code icon
  - **ADMIN Account**: Red/burgundy banner with "Admin Panel" message and shield icon
  - **PRODUCTION Account**: No banner (clean interface for paying customers)
- Banner includes:
  - Account type badge
  - Brief explanation tooltip ("This is a test account with sample data. Switch to production when ready to launch your practice.")
  - Dismiss button (per-session via sessionStorage, reappears on reload)
- Place in root layout (`apps/web/app/layout.tsx`) for app-wide visibility

**Visual Specifications:**
- TEST: `bg-yellow-50 border-b border-yellow-200 text-yellow-900`
- DEV: `bg-blue-50 border-b border-blue-200 text-blue-900`
- ADMIN: `bg-red-50 border-b border-red-200 text-red-900`
- Height: 48px (mobile), 40px (desktop)
- Icons: Lucide React (AlertTriangle, Code, Shield)

**Acceptance Criteria:**
- Banner appears on all authenticated pages based on account type
- Styling is prominent but non-intrusive
- Does not interfere with page functionality or mobile layouts
- TEST accounts always show yellow banner until converted to PRODUCTION

---

### 2. Field Validation Framework

**Implementation:**
- Extend existing validation library (`packages/lib/src/validation/`) with comprehensive validators:
  - **IBAN Validator**: Already exists at `packages/lib/src/validation/iban.ts` - integrate into all payment/banking forms
  - **VAT/UID Validator**: Already exists at `packages/lib/src/validation/vat.ts` (ATU######## format) - integrate into tax compliance forms
  - **Postal Code Validator**: Already exists at `packages/lib/src/validation/postal.ts` (4xxx format) - integrate into address forms
  - **Chamber ID Validator**: Create new validator for Austrian professional chamber IDs (format varies by province)
  - **Logo URL Validator**: Create validator for image URLs with format/size checks

**React Hook Form Integration:**
- Update all forms using react-hook-form to include:
  - Real-time validation on blur events
  - Inline error messages with Radix UI Alert components
  - Format hints/examples displayed below input fields
  - Success indicators (green checkmark) on valid input

**Example Pattern:**
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

**Acceptance Criteria:**
- All regulatory fields have inline validation
- Error messages are specific and actionable
- Format examples are visible before user interaction
- Validation runs on blur and before form submission

---

### 3. Contextual Tooltips System

**Implementation:**
- Create reusable `InfoTooltip` component using Radix UI Tooltip primitive
- Component accepts:
  - `content`: Tooltip text/description
  - `example`: Optional example value
  - `learnMoreUrl`: Optional link to documentation (for future help center)
  - `position`: Tooltip placement (top/bottom/left/right)

**Content Strategy:**
- Create tooltip content map for all compliance fields:
  - **VAT Number**: "Your Austrian VAT identification number (UID). Format: ATU########. Only required if you charge VAT."
  - **Chamber ID**: "Your professional chamber registration number. Format varies by Austrian province."
  - **Kleinunternehmer**: "Small business tax exemption under §6(1)27 UStG. Turnover must be under €35,000/year."
  - **RKSV**: "Registrierkassenpflicht - Austrian cash register compliance. Required when revenue exceeds €15,000/year."
  - **IBAN**: "Your Austrian bank account number for receiving payments. Format: AT## #### #### #### ####."

**Visual Design:**
- Icon trigger: Lucide `Info` icon next to field labels
- Tooltip styling: Dark background, white text, max-width 300px
- Animation: Smooth fade-in (200ms)

**Acceptance Criteria:**
- All compliance and complex fields have info icons
- Tooltips display on hover and focus (keyboard accessible)
- Content is concise, specific to Austrian context
- Examples are provided where applicable

---

### 4. Admin Account Segregation

**Implementation:**
- Update authentication middleware to use `accountType` field (already added in Section 0)
- NextAuth session already includes `accountType` and `isAdmin` boolean
- Enhance route protection logic in `middleware.ts`:
  - ADMIN accounts accessing `/` or `/dashboard` → redirect to `/admin`
  - Non-ADMIN accounts accessing `/admin/*` → redirect to `/dashboard` with error message
  - TEST accounts display warning banner on all pages
  - PRODUCTION accounts have clean interface

**Route Logic:**
```typescript
// In middleware.ts
if (session.user.accountType === 'ADMIN' && !pathname.startsWith('/admin')) {
  return NextResponse.redirect('/admin')
}
if (session.user.accountType !== 'ADMIN' && pathname.startsWith('/admin')) {
  return NextResponse.redirect('/dashboard?error=unauthorized')
}
```

**UI Updates:**
- Remove or disable main navigation for ADMIN accounts
- Display account type badge in user menu dropdown
- Add account type indicator in page header
- Show "Switch to Production" option in settings for TEST accounts

**Acceptance Criteria:**
- ADMIN accounts cannot access main platform routes
- Regular users cannot access admin routes
- Redirects are seamless with clear messaging
- Account type badge visible in user menu
- TEST accounts can see path to convert to PRODUCTION

---

### 5. Profile Completion Prompts

**Implementation:**
- Create `ProfileCompletionWidget` component for dashboard
- Query user's `TherapistProfile` and `Settings` tables to calculate completion percentage:
  - **Required fields**: businessName, firstName, lastName, email, country
  - **Important fields**: phone, address, postalCode, city, professionalTitle, chamberRegistration
  - **Compliance fields**: taxId/vatNumber, ibanAccount, publicProfileSlug
- Display progress bar with percentage (0-100%)
- Show prioritized list of missing fields with "Complete Now" quick links

**Visual Design:**
- Prominent card at top of dashboard (if < 80% complete)
- Progress bar with color coding:
  - Red (0-50%): "Complete your profile to start using MyoFlow"
  - Yellow (51-79%): "Almost there! Complete these fields"
  - Green (80-100%): "Profile complete" (auto-hide after 3 seconds)
- Each missing field links directly to relevant settings tab

**Persistence:**
- Track dismissal state per user in browser localStorage
- Reappear if completion percentage drops (e.g., user deletes required field)

**Acceptance Criteria:**
- Widget appears on dashboard when profile < 80% complete
- Missing fields are accurately detected and displayed
- Quick links navigate to correct settings sections
- Progress updates in real-time as user completes fields

---

### 6. Account Conversion Flow (TEST → PRODUCTION)

**Implementation:**
- Create new settings page: `/settings/account-upgrade`
- Add confirmation modal with checklist before conversion:
  - ✓ Profile is 100% complete
  - ✓ Bank details verified (IBAN validated)
  - ✓ Tax compliance configured (VAT/Kleinunternehmer)
  - ✓ Invoice branding uploaded and previewed
  - ✓ Understand that test data will be archived (not deleted)
- Create API endpoint: `POST /api/settings/account/upgrade`
- Upgrade process:
  1. Validate all checklist items
  2. Archive test data (move to separate `_archived` schema)
  3. Update `accountType` from TEST to PRODUCTION
  4. Send confirmation email
  5. Clear test data warnings from UI
  6. Redirect to dashboard with success message

**Data Migration Strategy:**
- Test clients/invoices/appointments → Move to `ArchivedData` table
- Keep user profile intact (just change account type)
- Preserve settings (tax, branding, etc.)
- Clear any demo/placeholder content

**UI Placement:**
- Add "Upgrade to Production" button in Settings sidebar (TEST accounts only)
- Show card in dashboard: "Ready to go live? Upgrade your account"
- Display in account type banner: "Test Account (Upgrade when ready)"

**Acceptance Criteria:**
- TEST users can only convert when profile is 100% complete
- Conversion is irreversible (confirmation required)
- Test data is safely archived, not deleted
- PRODUCTION accounts never see test banners again
- Email confirmation sent on successful upgrade

---

## External Dependencies

No new external dependencies required. All features leverage existing packages:
- **Radix UI**: Already installed (Tooltip, Alert components)
- **Lucide React**: Already installed (Info, AlertTriangle, Code, Shield icons)
- **React Hook Form**: Already installed and in use
- **Zod**: Already installed for validation schemas
- **NextAuth.js**: Already configured for authentication
- **Prisma**: Already installed for database operations

---

## Performance Considerations

- Account type banner: Minimal overhead (single component, reads from session)
- Field validation: Client-side only, no network latency
- Tooltips: Lazy-loaded on first hover, cached thereafter
- Admin segregation: Edge-level middleware, no additional latency
- Profile completion: Single query on dashboard mount, memoized results
- Account conversion: One-time operation, asynchronous data archival

---

## Database Migration Strategy

**Phase 1: Add AccountType Enum**
```sql
-- Create enum type
CREATE TYPE "AccountType" AS ENUM ('TEST', 'PRODUCTION', 'ADMIN', 'DEV');

-- Add column with default TEST
ALTER TABLE "User" ADD COLUMN "accountType" "AccountType" NOT NULL DEFAULT 'TEST';

-- Update existing admin users (if any)
UPDATE "User" SET "accountType" = 'ADMIN' WHERE "role" = 'ADMIN';
```

**Phase 2: Session Updates**
- No migration needed (session data is ephemeral)
- Update auth callbacks to populate `accountType` from database

**Phase 3: Archived Data Table** (for account conversion)
```prisma
model ArchivedData {
  id        String   @id @default(cuid())
  userId    String
  data      Json     // Serialized test clients/invoices/appointments
  archivedAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```
