# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-10-16-ux-polish-launch-blockers/spec.md

> Created: 2025-10-16
> Status: Ready for Implementation

## Tasks

- [ ] 1. Database Foundation - Account Type System
  - [x] 1.1 Write migration tests for AccountType enum and ArchivedData model
  - [x] 1.2 Add AccountType enum to Prisma schema (TEST, PRODUCTION, ADMIN, DEV)
  - [x] 1.3 Add accountType field to User model with TEST default
  - [x] 1.4 Create ArchivedData model for test data storage (userId, data JSON, note, archivedAt)
  - [x] 1.5 Generate migration: npx prisma migrate dev --name add-account-type-system
  - [x] 1.6 Update existing admin users to ADMIN account type (manual SQL if needed)
  - [x] 1.7 Add database indexes for performance (accountType, userId, archivedAt)
  - [x] 1.8 Verify migration applied successfully and all tests pass

- [ ] 2. Authentication & Session Extension
  - [x] 2.1 Write tests for session callbacks with accountType, isTestAccount, isAdmin
  - [x] 2.2 Extend MyoFlowSession interface in auth.ts to include accountType and isTestAccount
  - [x] 2.3 Update NextAuth session callback to populate accountType from database User model
  - [x] 2.4 Update middleware.ts for admin segregation (ADMIN → /admin, others → /dashboard)
  - [x] 2.5 Add route protection logic to prevent cross-account-type access
  - [x] 2.6 Verify session includes accountType and routing works correctly
  - [x] 2.7 Test admin access restrictions and redirects with different account types
  - [x] 2.8 Verify all authentication and routing tests pass

- [ ] 3. Visual Account Type Indicators
  - [x] 3.1 Write component tests for AccountTypeBanner with all account types
  - [x] 3.2 Create AccountTypeBanner component with color-coded styling (yellow/blue/red/none)
  - [x] 3.3 Implement banner for TEST (yellow), DEV (blue), ADMIN (red), PRODUCTION (none)
  - [x] 3.4 Add dismiss functionality with sessionStorage persistence per account type
  - [x] 3.5 Add tooltip explaining test account with "Upgrade when ready" message and icon
  - [x] 3.6 Integrate banner into root layout (apps/web/app/layout.tsx) above all pages
  - [x] 3.7 Add account type badge to user menu dropdown with visual indicator
  - [x] 3.8 Verify banner displays correctly for all account types and tests pass

- [ ] 4. Field Validation Framework & Tooltips
  - [x] 4.1 Write validator tests for Chamber ID and Logo URL validators
  - [x] 4.2 Create Chamber ID validator in packages/lib/src/validation/chamber.ts
  - [x] 4.3 Create Logo URL validator in packages/lib/src/validation/logo.ts (format/size checks)
  - [x] 4.4 Export new validators in packages/lib/src/validation/index.ts
  - [x] 4.5 Create InfoTooltip component using Radix UI with Austrian compliance content
  - [x] 4.6 Create reusable FormField component with inline validation and success indicators
  - [x] 4.7 Integrate existing IBAN/VAT/Postal validators into settings forms (Profile, Tax, Branding)
  - [x] 4.8 Add info icons and tooltips to all complex compliance fields (VAT, Chamber ID, Kleinunternehmer, RKSV, IBAN)
  - [x] 4.9 Verify validation fires on blur, shows errors, and displays format hints/examples
  - [x] 4.10 Verify all validation and tooltip tests pass

- [ ] 5. Profile Completion Widget & Account Conversion
  - [x] 5.1 Write tests for ProfileCompletionWidget calculation logic and percentage thresholds
  - [x] 5.2 Create ProfileCompletionWidget component for dashboard with progress bar
  - [x] 5.3 Implement completion percentage calculation from TherapistProfile and Settings (required/important/compliance fields)
  - [x] 5.4 Add progress bar with color coding (red 0-50%, yellow 51-79%, green 80-100%)
  - [x] 5.5 Display prioritized list of missing fields with quick-link navigation to settings tabs
  - [x] 5.6 Create /settings/account-upgrade page with confirmation modal and checklist
  - [x] 5.7 Write tests for account upgrade API endpoint validation and data archival
  - [x] 5.8 Create POST /api/settings/account/upgrade endpoint with checklist validation
  - [x] 5.9 Implement upgrade logic: validate checklist, archive test data to ArchivedData, update accountType TEST → PRODUCTION
  - [x] 5.10 Add "Upgrade to Production" button in Settings (TEST accounts only, visible in sidebar/banner)
  - [x] 5.11 Add email confirmation for successful production activation
  - [x] 5.12 Verify widget displays correctly, upgrade flow completes successfully, and all tests pass
