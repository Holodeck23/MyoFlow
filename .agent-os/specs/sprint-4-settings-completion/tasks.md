# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/sprint-4-settings-completion/spec.md

> Created: 2025-11-09
> Status: Ready for Implementation

## Tasks

### Phase 3: UI Wiring (16 hours total)

This phase wires all settings tabs to real API endpoints with form validation, optimistic updates, and error handling. Each tab should be fully editable with react-hook-form integration and Austrian-specific validation.

---

## 1. ProfileTab UI Implementation (4h)

Convert ProfileTab from read-only placeholders to fully functional editable form with business info, Austrian address fields, and credentials management.

- [ ] 1.1 Write unit tests for ProfileTab component
  - Test form initialization with existing profile data
  - Test validation of Austrian postal codes (4xxx format)
  - Test VAT number format validation (ATUxxxxxxxx)
  - Test IBAN validation for Austrian accounts
  - Mock API responses for profile GET/PUT endpoints

- [ ] 1.2 Create ProfileTab form with react-hook-form
  - Import useForm hook and setup form state management
  - Add form fields for business name, email, phone
  - Add Austrian address fields (street, city, postal, country)
  - Add business legal form selector (Einzelunternehmen/OG/KG/GmbH)
  - Implement field-level validation with error messages

- [ ] 1.3 Implement VAT/IBAN input fields with Austrian validation
  - Create VAT number input with ATUxxxxxxxx format validation
  - Create IBAN input with Austrian IBAN format validation (AT##)
  - Implement real-time format suggestions and feedback
  - Add help text explaining Austrian compliance requirements

- [ ] 1.4 Add credentials management UI (table with add/edit/archive)
  - Create credentials table showing professional licenses
  - Add modal for adding new credentials (license type, number, issue date, expiry)
  - Implement edit functionality for existing credentials
  - Add archive button with confirmation dialog
  - Wire credentials to `/api/settings/credentials` endpoint

- [ ] 1.5 Wire form submission to PUT /api/settings/profile
  - Implement handleSubmit with optimistic update
  - Show loading spinner during API call
  - Update local state immediately for UX feedback
  - Handle validation errors (400) with field-level error display
  - Handle auth errors (401) with redirect to sign-in

- [ ] 1.6 Implement optimistic updates and error recovery
  - Update ProfileCompletionWidget % immediately on save
  - Revert optimistic update if API call fails
  - Show toast notification on success/error
  - Implement retry mechanism for failed submissions

- [ ] 1.7 Add loading states and prevent double-submits
  - Disable form inputs while submitting
  - Show loading spinner on save button
  - Prevent multiple concurrent submissions
  - Show "Saving..." text during submission

- [ ] 1.8 Verify all ProfileTab tests pass
  - Run: `pnpm test ProfileTab`
  - Verify form submission flow end-to-end
  - Test error handling for invalid postal codes
  - Test credentials CRUD operations

---

## 2. ComplianceTab UI Implementation (3h)

Implement tax compliance settings with VAT/Kleinunternehmer toggle, revenue threshold tracking, and tax advisor contact form.

- [ ] 2.1 Write unit tests for ComplianceTab component
  - Test VAT/Kleinunternehmer mutual exclusivity (radio buttons)
  - Test threshold progress calculation from API data
  - Test warning state at 80% threshold
  - Test tax advisor contact form validation
  - Mock `/api/settings/overview` and `/api/settings/tax-compliance`

- [ ] 2.2 Create ComplianceTab form structure with react-hook-form
  - Add VAT/Kleinunternehmer radio button group (mutually exclusive)
  - Display current VAT rate (20% / exempt based on selection)
  - Add threshold progress bar showing €X / €15,000
  - Add warning alert if revenue > 80% of €15k threshold
  - Implement form submission handler

- [ ] 2.3 Wire VAT/Kleinunternehmer toggle to API
  - Implement PUT /api/settings/tax-compliance endpoint call
  - Ensure mutual exclusivity (selecting VAT disables Kleinunternehmer)
  - Update VAT rate display immediately
  - Validate against threshold violations
  - Handle response with updated tax status

- [ ] 2.4 Add revenue threshold progress tracking
  - Fetch current revenue from `/api/settings/overview`
  - Calculate percentage toward €15,000 threshold
  - Display progress bar with color coding (green/yellow/red)
  - Show warning at 80% (€12,000)
  - Update automatically when settings saved

- [ ] 2.5 Implement tax advisor contact form
  - Add fields for tax advisor name, email, phone
  - Wire to `/api/settings/tax-compliance` PUT endpoint
  - Include validation for email format and phone format
  - Show success message on save

- [ ] 2.6 Add optimistic updates for tax compliance changes
  - Update VAT rate display immediately on toggle
  - Show optimistic threshold progress (if applicable)
  - Revert on API error with user-friendly message
  - Show toast notification on save success

- [ ] 2.7 Implement loading/error states and prevent double-submits
  - Disable form while submitting
  - Show loading spinner on save button
  - Display form-level error message if submission fails
  - Prevent multiple concurrent submissions

- [ ] 2.8 Verify all ComplianceTab tests pass
  - Run: `pnpm test ComplianceTab`
  - Test VAT/Kleinunternehmer mutual exclusivity
  - Test threshold warning at 80%
  - Test tax advisor form submission

---

## 3. TravelTab UI Implementation (3h)

Implement travel settings form with base location, transport method, rates, and distance limits, wired to PUT /api/settings/travel.

- [ ] 3.1 Write unit tests for TravelTab component
  - Test form initialization with existing travel settings
  - Test postal code validation (4xxx format)
  - Test currency formatting (€X.XX/km)
  - Test distance and buffer time number inputs
  - Mock `/api/settings/travel` endpoint

- [ ] 3.2 Create TravelTab form with react-hook-form
  - Add base location address fields (street, city, postal, country)
  - Add transport method dropdown (CAR/BIKE/PUBLIC/WALK/MOTORCYCLE)
  - Add rate per km input with € currency prefix
  - Add minimum charge and maximum distance inputs
  - Add travel buffer time input (in minutes)

- [ ] 3.3 Implement Austrian address validation for base location
  - Validate postal code format (4xxx)
  - Validate city field (not empty)
  - Validate street address format
  - Show inline error messages for invalid fields
  - Auto-capitalize city names

- [ ] 3.4 Add currency formatting for rate per km
  - Format input as €X.XX per km
  - Allow decimal input (€0.80 = 80 cents)
  - Handle paste with non-numeric characters
  - Display formatted value in preview
  - Store as cents in database for precision

- [ ] 3.5 Wire form submission to PUT /api/settings/travel
  - Call PUT endpoint with form data
  - Convert currency to cents before sending
  - Handle response validation
  - Show success message on save
  - Handle validation errors (invalid postal, missing fields)

- [ ] 3.6 Implement optimistic updates for travel settings
  - Update local form state immediately
  - Revert if API call fails
  - Show loading indicator during submit
  - Toast notification on success/error

- [ ] 3.7 Add map preview for service radius (optional enhancement)
  - Display Google Map with base location marker
  - Show service radius circle (based on max distance)
  - Update map in real-time as user changes base location
  - Load map only when tab is opened (lazy load)

- [ ] 3.8 Verify all TravelTab tests pass
  - Run: `pnpm test TravelTab`
  - Test postal code validation
  - Test currency formatting (€0.80/km)
  - Test form submission to API
  - Test error handling

---

## 4. PricingTab UI Implementation (4h)

Implement pricing management with service rate cards, inline edit/delete, modal for create/edit, and default rate toggles.

- [ ] 4.1 Write unit tests for PricingTab component
  - Test rendering service rate cards
  - Test edit modal state management
  - Test delete confirmation dialog
  - Test default rate toggle (one per category)
  - Mock `/api/settings/pricing` and `/api/settings/pricing/[id]` endpoints

- [ ] 4.2 Create PricingTab layout with service rate cards
  - Display existing service rates as cards (category, duration, price)
  - Show "Add Service Rate" button
  - Add edit and delete action buttons on each card
  - Show default badge on primary rate for each category
  - Group cards by category (Massage, Physiotherapy, etc.)

- [ ] 4.3 Implement create/edit modal with react-hook-form
  - Create modal component with form for adding/editing rates
  - Add fields: category (dropdown), duration (minutes), price (€), VAT rate (%)
  - Implement form validation (positive price, valid duration)
  - Add "Set as default for category" checkbox
  - Implement cancel/submit buttons

- [ ] 4.4 Wire create/edit modal to POST/PUT endpoints
  - POST /api/settings/pricing for new rates
  - PUT /api/settings/pricing/[id] for updates
  - Handle response with updated rate data
  - Close modal on success
  - Show error message on failure
  - Update card list immediately

- [ ] 4.5 Implement delete confirmation and DELETE endpoint
  - Show delete confirmation dialog with warning
  - Call DELETE /api/settings/pricing/[id]
  - Remove card from list on success
  - Handle deletion errors gracefully
  - Disable delete if it's the only rate in category

- [ ] 4.6 Add default rate toggle functionality
  - Allow setting one rate as default per category
  - Update UI immediately when toggled
  - Call PUT endpoint to persist change
  - Show radio button indicator for default rate
  - Prevent removing default status (must have default per category)

- [ ] 4.7 Implement optimistic updates and error handling
  - Update card list immediately on add/edit/delete
  - Revert changes if API fails
  - Show loading spinner in modal during submission
  - Toast notifications for success/error
  - Retry mechanism for failed operations

- [ ] 4.8 Verify all PricingTab tests pass
  - Run: `pnpm test PricingTab`
  - Test service rate card rendering
  - Test create/edit/delete modal flows
  - Test default rate toggle
  - Test error handling for invalid data

---

## 5. SystemTab UI Implementation (2h)

Implement system preferences with language toggle, notification settings, and timezone configuration.

- [ ] 5.1 Write unit tests for SystemTab component
  - Test language toggle (DE/EN) persistence
  - Test notification preference checkboxes
  - Test timezone selector default to Europe/Vienna
  - Mock `/api/settings/system` endpoint

- [ ] 5.2 Create SystemTab form with react-hook-form
  - Add language toggle (DE/EN) with radio buttons
  - Add notification preferences (appointments, compliance, invoices)
  - Add timezone selector dropdown (defaults to Europe/Vienna)
  - Add currency selector (defaults to EUR)
  - Add Save button

- [ ] 5.3 Wire language toggle to PUT /api/settings/system
  - Call API to persist language preference
  - Update application language immediately
  - Show loading state during submit
  - Reload page or update i18n context
  - Handle language persistence across sessions

- [ ] 5.4 Implement notification preferences
  - Create checkboxes for email notifications (appointments, compliance)
  - Create checkboxes for SMS notifications (if available)
  - Wire to PUT /api/settings/system
  - Show success message on save
  - Persist preferences to database

- [ ] 5.5 Add timezone and currency configuration
  - Create timezone dropdown with common options (Europe/Vienna as default)
  - Create currency selector (EUR, GBP, USD as options)
  - Wire to PUT /api/settings/system
  - Display current selection
  - Save preferences to database

- [ ] 5.6 Implement optimistic updates for system preferences
  - Update form UI immediately on toggle/save
  - Revert if API fails
  - Show toast notification on success/error
  - Handle language change (may require app reload)

- [ ] 5.7 Add loading states and prevent double-submits
  - Disable form inputs while submitting
  - Show loading spinner on save button
  - Prevent multiple concurrent submissions
  - Clear disabled state on success or error

- [ ] 5.8 Verify all SystemTab tests pass
  - Run: `pnpm test SystemTab`
  - Test language toggle persistence
  - Test notification preference updates
  - Test timezone/currency selection
  - Verify all form submission flows

---

## Acceptance Criteria for Phase 3

- [ ] All 5 tabs have working save functionality
- [ ] Form validation prevents invalid Austrian data (postal codes, VAT, IBAN)
- [ ] Optimistic UI updates provide instant feedback to users
- [ ] Error states display user-friendly messages (not technical errors)
- [ ] Loading states prevent double-submits with disabled buttons/spinners
- [ ] All tabs persist data across page reloads
- [ ] Mobile responsive on all tabs (Tailwind responsive utilities)
- [ ] No console errors in browser DevTools
- [ ] TypeScript strict mode passes without errors
- [ ] ESLint passes without warnings
- [ ] All unit tests passing locally before PR
