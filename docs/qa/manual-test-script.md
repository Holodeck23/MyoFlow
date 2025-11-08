# MyoFlow Manual QA Test Script
**Created:** October 4, 2025
**Purpose:** End-to-end testing before launch
**Tester:** ZOD
**Environment:** Local development (http://localhost:3000)

---

## Pre-Test Setup

### Clean Start
```bash
# Kill any running dev servers
pkill -f "next dev"
pkill -f "pnpm dev"

# Fresh database
pnpm docker:down
pnpm docker:up
sleep 5

# Fresh migrations (NO SEED - test as new user would)
DATABASE_URL=postgresql://ZOD@localhost:5432/myoflow pnpm prisma:migrate:dev

# Start dev server
pnpm dev
```

### Create QA Log File
```bash
mkdir -p docs/qa-2025-10-04
touch docs/qa-2025-10-04/bug-log.md
touch docs/qa-2025-10-04/test-results.md
mkdir -p docs/qa-2025-10-04/screenshots
```

---

## Test Suite 1: Authentication & Onboarding (30 min)

### Test 1.1: New User Signup
**Goal:** Verify new user can create account

**Steps:**
1. [ ] Navigate to http://localhost:3000
2. [ ] Click "Sign In" or auth button
3. [ ] Try Google OAuth (if configured)
   - **Expected:** Google auth flow works OR shows error
   - **Actual:** _____________________
4. [ ] Try credentials signup:
   - Email: `qa-test@myoflow.local`
   - Password: `TestPassword123!`
   - **Expected:** Account created, redirected to dashboard
   - **Actual:** _____________________

**Bugs Found:**
- [ ] CRITICAL: _______________
- [ ] HIGH: _______________
- [ ] MEDIUM: _______________

**Screenshot:** Save to `docs/qa-2025-10-04/screenshots/1.1-signup.png`

---

### Test 1.2: First Login Experience
**Goal:** Verify new user can log in and sees appropriate onboarding

**Steps:**
1. [ ] Log out (if logged in)
2. [ ] Log back in with test credentials
   - **Expected:** Successful login, session persists
   - **Actual:** _____________________
3. [ ] Check what page loads:
   - **Expected:** Dashboard OR profile setup wizard
   - **Actual:** _____________________
4. [ ] Look for onboarding tutorial/tour
   - **Expected:** Either automated tour OR help hints
   - **Actual:** _____________________
   - **FINDING:** ⚠️ No onboarding tour exists currently

**Bugs Found:**
- [ ] MISSING FEATURE: No user onboarding/tutorial
- [ ] USABILITY: _______________

**Screenshot:** `1.2-first-login.png`

---

## Test Suite 2: Profile Setup (45 min)

### Test 2.1: Therapist Profile Creation
**Goal:** Complete therapist profile with Austrian business info

**Steps:**
1. [ ] Navigate to Settings > Profile
2. [ ] Fill in business information:
   - Business Name: `Test Praxis Wien`
   - Business Type: `Einzelunternehmen`
   - Business Address: `Mariahilfer Straße 1, 1060 Wien`
   - Business Phone: `+43 1 1234567`
   - Business Email: `praxis@test.at`
   - **Expected:** All fields save correctly
   - **Actual:** _____________________

3. [ ] Set Austrian tax status:
   - VAT Status: `KLEINUNTERNEHMER`
   - UID Number (optional): Leave blank OR test: `ATU12345678`
   - **Expected:** Kleinunternehmer selected, UID validates OR accepts blank
   - **Actual:** _____________________

4. [ ] Set therapist designation:
   - **Options:** HEILMASSEUR, MEDIZINISCHER_MASSEUR, GEWERBLICHER_MASSEUR
   - **Select:** HEILMASSEUR
   - **Expected:** Designation saves
   - **Actual:** _____________________

5. [ ] Save profile
   - **Expected:** Success message, data persists
   - **Actual:** _____________________

**Bugs Found:**
- [ ] _______________

**Screenshot:** `2.1-profile-complete.png`

---

### Test 2.2: Profile Persistence
**Goal:** Verify profile data survives logout/login

**Steps:**
1. [ ] Log out
2. [ ] Log back in
3. [ ] Navigate to Settings > Profile
4. [ ] Verify all data still present:
   - Business Name: `Test Praxis Wien`
   - Address: `Mariahilfer Straße 1, 1060 Wien`
   - VAT Status: `KLEINUNTERNEHMER`
   - **Expected:** All data intact
   - **Actual:** _____________________

**Bugs Found:**
- [ ] _______________

---

## Test Suite 3: Client Management (45 min)

### Test 3.1: Create New Client
**Goal:** Add client with Austrian address and encrypted health data

**Steps:**
1. [ ] Navigate to Clients > New Client
2. [ ] Fill in client details:
   - Name: `Max Mustermann`
   - Email: `max@example.at`
   - Phone: `+43 699 12345678`
   - Street: `Landstraßer Hauptstraße 10`
   - Postal Code: `1030`
   - City: `Wien`
   - **Expected:** Austrian address validation works
   - **Actual:** _____________________

3. [ ] Add encrypted health note:
   - Field: Health flags or notes
   - Content: `Allergies: Pollen, Asthma medication`
   - **Expected:** Field marked as encrypted/sensitive
   - **Actual:** _____________________

4. [ ] Save client
   - **Expected:** Client created successfully
   - **Actual:** _____________________

**Bugs Found:**
- [ ] _______________

**Screenshot:** `3.1-client-created.png`

---

### Test 3.2: Verify Encryption
**Goal:** Confirm health data is encrypted in database

**Steps:**
1. [ ] Open Prisma Studio:
   ```bash
   pnpm prisma:studio
   ```
2. [ ] Navigate to `Client` table
3. [ ] Find "Max Mustermann" record
4. [ ] Check `healthFlagsEnc` column:
   - **Expected:** Encrypted string (base64), NOT plain text
   - **Example:** `wQYBAG8kXC...` (not readable)
   - **Actual:** _____________________

5. [ ] Verify in app:
   - View Max Mustermann's profile in MyoFlow
   - **Expected:** Health notes display decrypted
   - **Actual:** _____________________

**Security Check:**
- [ ] ✅ Health data encrypted in DB
- [ ] ✅ Health data decrypts correctly in UI
- [ ] ❌ CRITICAL: Health data in plain text

**Screenshot:** `3.2-encryption-check.png` (Prisma Studio view)

---

## Test Suite 4: Appointment Booking (60 min)

### Test 4.1: Create Location and Service
**Goal:** Set up prerequisites for appointments

**Steps:**
1. [ ] Create Location:
   - Name: `Praxis Wien Zentrum`
   - Type: `CLINIC`
   - Address: `Mariahilfer Straße 1, 1060 Wien`
   - **Expected:** Location created
   - **Actual:** _____________________

2. [ ] Create Service:
   - Name: `Klassische Massage 60min`
   - Category: `MASSAGE`
   - Duration: `60` minutes
   - Price: `6000` cents (€60.00)
   - VAT Rate: `KLEINUNTERNEHMER` (0%)
   - **Expected:** Service created with €60 price
   - **Actual:** _____________________

**Bugs Found:**
- [ ] _______________

---

### Test 4.2: Book Appointment
**Goal:** Create appointment and verify calendar display

**Steps:**
1. [ ] Navigate to Calendar/Appointments
2. [ ] Click "New Appointment" (or similar)
3. [ ] Fill in:
   - Client: `Max Mustermann`
   - Service: `Klassische Massage 60min`
   - Location: `Praxis Wien Zentrum`
   - Date: Tomorrow
   - Time: `10:00 - 11:00`
   - **Expected:** Appointment created
   - **Actual:** _____________________

4. [ ] Check calendar view:
   - **Expected:** Appointment shows on calendar
   - **Actual:** _____________________

**Bugs Found:**
- [ ] _______________

**Screenshot:** `4.2-appointment-calendar.png`

---

### Test 4.3: Conflict Detection
**Goal:** Verify system prevents double-booking

**Steps:**
1. [ ] Try to book overlapping appointment:
   - Same location, same time: `10:00 - 11:00` tomorrow
   - **Expected:** Error: "Conflict detected" OR similar
   - **Actual:** _____________________

2. [ ] Try adjacent appointment (should work):
   - Same location: `11:00 - 12:00` tomorrow
   - **Expected:** Success - no conflict
   - **Actual:** _____________________

**Bugs Found:**
- [ ] CRITICAL: Double-booking allowed
- [ ] _______________

---

## Test Suite 5: Invoice Generation (60 min) 🔥 MOST CRITICAL

### Test 5.1: Create Invoice from Appointment
**Goal:** Generate Austrian-compliant invoice

**Steps:**
1. [ ] Navigate to Appointments
2. [ ] Find tomorrow's appointment
3. [ ] Mark as `COMPLETED` (if status exists)
4. [ ] Click "Generate Invoice" or similar
   - **Expected:** Invoice created
   - **Actual:** _____________________

5. [ ] Review invoice details:
   - Client: `Max Mustermann`
   - Service: `Klassische Massage 60min`
   - Amount: `€60.00`
   - VAT: Should show 0% (Kleinunternehmer)
   - **Expected:** Calculations correct
   - **Actual:** _____________________

**Bugs Found:**
- [ ] _______________

**Screenshot:** `5.1-invoice-detail.png`

---

### Test 5.2: Download Invoice PDF ⚠️ CRITICAL TEST
**Goal:** Verify PDF has NO placeholder data, correct German text

**Steps:**
1. [ ] Click "Download PDF" on invoice
2. [ ] Open PDF file
3. [ ] Check for PLACEHOLDERS (CRITICAL BUG if found):
   - [ ] ❌ "Placeholder Business Name"
   - [ ] ❌ "Your Business Address"
   - [ ] ❌ "phone@example.com"
   - [ ] ❌ Any "TODO" or "FIXME" text
   - [ ] ✅ All actual business data present

4. [ ] Verify required Austrian invoice fields:
   - [ ] Business name: `Test Praxis Wien`
   - [ ] Business address: `Mariahilfer Straße 1, 1060 Wien`
   - [ ] Business phone: `+43 1 1234567`
   - [ ] Business email: `praxis@test.at`
   - [ ] Invoice number: (should be auto-generated)
   - [ ] Date: (should be today's date)
   - [ ] Client name: `Max Mustermann`
   - [ ] Service description: `Klassische Massage 60min`
   - [ ] Amount: `€60.00`
   - [ ] VAT: `0%` or text "Kleinunternehmer §6 Abs 1 Z 27 UStG"
   - [ ] **German text:** Check for correct German (not English)

5. [ ] Austrian legal compliance text:
   - [ ] Kleinunternehmer disclaimer present
   - [ ] Text in German (not English)
   - [ ] Reference to "§6 Abs 1 Z 27 UStG" or similar

**Critical Checklist:**
- [ ] ✅ NO placeholder text anywhere
- [ ] ✅ All business info from profile appears
- [ ] ✅ Client info correct
- [ ] ✅ Pricing calculations correct
- [ ] ✅ VAT handling correct (0% for Kleinunternehmer)
- [ ] ✅ German language throughout
- [ ] ✅ Legal compliance text present

**If ANY placeholder found:** 🚨 **CRITICAL BUG - DO NOT LAUNCH**

**Bugs Found:**
- [ ] CRITICAL: Placeholder text found: _______________
- [ ] HIGH: Missing legal text: _______________
- [ ] MEDIUM: German translation issues: _______________

**Screenshot:** `5.2-invoice-pdf.png` (PDF screenshot)

---

## Test Suite 6: Dashboard & Analytics (30 min)

### Test 6.1: Revenue Tracking
**Goal:** Verify dashboard shows correct revenue

**Steps:**
1. [ ] Navigate to Dashboard
2. [ ] Check revenue display:
   - **Expected:** €60.00 from one invoice
   - **Actual:** _____________________

3. [ ] Check Kleinunternehmer threshold:
   - **Expected:** €60 / €55,000 = 0.11% progress
   - **Expected:** Visual progress bar or percentage
   - **Actual:** _____________________

**Bugs Found:**
- [ ] _______________

**Screenshot:** `6.1-dashboard-revenue.png`

---

## Test Suite 7: Settings & Configuration (45 min)

### Test 7.1: Settings Navigation
**Goal:** Verify all settings tabs accessible

**Steps:**
1. [ ] Navigate to Settings
2. [ ] Test each tab:
   - [ ] Overview/Profile
   - [ ] Pricing/Services
   - [ ] Travel (if exists)
   - [ ] Tax/Compliance
   - [ ] System preferences
   - **Expected:** All tabs load without errors
   - **Actual:** _____________________

3. [ ] Performance check:
   - **Note:** Previous issue mentioned 12.7s load time
   - **Expected:** <5s load time (after Sprint 2 optimization)
   - **Actual:** _____ seconds
   - **Status:** ✅ Fast enough / ⚠️ Still slow

**Bugs Found:**
- [ ] _______________

**Screenshot:** `7.1-settings-tabs.png`

---

### Test 7.2: Settings Persistence
**Goal:** Verify settings changes save correctly

**Steps:**
1. [ ] Change a setting:
   - Example: Default appointment reminder days: `2` days
   - **Expected:** Setting saves
   - **Actual:** _____________________

2. [ ] Refresh page (F5)
   - **Expected:** Setting still shows `2` days
   - **Actual:** _____________________

3. [ ] Log out and log back in
   - **Expected:** Setting still persists
   - **Actual:** _____________________

**Bugs Found:**
- [ ] CRITICAL: Settings don't persist
- [ ] _______________

---

## Test Suite 8: Translation & Localization (30 min)

### Test 8.1: Language Switching
**Goal:** Test German/English toggle (if exists)

**Steps:**
1. [ ] Find language toggle (likely in header or settings)
2. [ ] Switch to German (if currently English)
   - **Expected:** UI changes to German
   - **Actual:** _____________________

3. [ ] **LAYOUT BUG CHECK:**
   - [ ] Does header shift/break?
   - [ ] Do buttons resize awkwardly?
   - [ ] Does sidebar collapse?
   - [ ] Do cards/forms misalign?
   - **Expected:** Smooth transition, no layout breaks
   - **Actual:** _____________________

4. [ ] Check for raw translation keys:
   - Look for: `common.loading`, `dashboard.title`, etc.
   - **Expected:** German text, not keys
   - **Actual:** _____________________
   - **Known Issue:** Translation keys may appear (documented in KNOWN_ISSUES.md)

5. [ ] Navigate through: Dashboard → Clients → Appointments → Settings
   - **Expected:** All pages show German text
   - **Actual:** _____________________

6. [ ] Switch back to English
   - **Expected:** Everything reverts to English
   - **Actual:** _____________________

**Bugs Found:**
- [ ] CRITICAL: Layout breaks during language switch
- [ ] HIGH: Translation keys showing instead of text: _______________
- [ ] MEDIUM: Partial translations: _______________

**Screenshot:** `8.1-language-de.png` and `8.1-language-en.png`

---

## Test Suite 9: Edge Cases & Error Handling (30 min)

### Test 9.1: Invalid Data Handling
**Goal:** Verify system handles bad input gracefully

**Steps:**
1. [ ] Try invalid Austrian postal code:
   - Client creation: Postal code `99999`
   - **Expected:** Validation error
   - **Actual:** _____________________

2. [ ] Try invalid UID number:
   - Profile: `INVALID123`
   - **Expected:** Format validation error
   - **Actual:** _____________________

3. [ ] Try overlapping appointments (already tested):
   - **Expected:** Conflict detection
   - **Actual:** _____________________

**Bugs Found:**
- [ ] _______________

---

### Test 9.2: Empty State Handling
**Goal:** Verify UI handles no data gracefully

**Steps:**
1. [ ] Fresh user with no appointments:
   - Dashboard calendar view
   - **Expected:** "No appointments scheduled" or similar
   - **Actual:** _____________________

2. [ ] No invoices yet:
   - Invoices list
   - **Expected:** "Create your first invoice" message
   - **Actual:** _____________________

**Bugs Found:**
- [ ] UI breaks with empty data
- [ ] _______________

---

## Summary & Bug Categorization

### CRITICAL BUGS (Block Launch)
Document in `docs/qa-2025-10-04/bug-log.md`:
1. [ ] _______________
2. [ ] _______________

### HIGH PRIORITY (Fix Before Beta)
1. [ ] _______________
2. [ ] _______________

### MEDIUM (Fix or Document)
1. [ ] _______________
2. [ ] _______________

### LOW (Defer to Post-Launch)
1. [ ] _______________
2. [ ] _______________

---

## Missing Features Identified

### Feature Gaps vs. Specs:
- [ ] **No onboarding tutorial/tour** - Planned in user-settings spec but not implemented
- [ ] **No email authentication** - Signup works but no email verification
- [ ] **No mini-websites** - Public booking pages not implemented
- [ ] **No white-labeling** - Can't customize beyond basic profile
- [ ] _______________

---

## Test Completion Checklist

- [ ] All test suites executed
- [ ] Screenshots saved to `docs/qa-2025-10-04/screenshots/`
- [ ] Bugs documented in `bug-log.md`
- [ ] Results summarized in `test-results.md`
- [ ] Critical bugs identified and prioritized
- [ ] Ready for Wednesday bug fix session

**Total Time:** ~6 hours for complete manual QA
**Start Time:** __________
**End Time:** __________
**Tester Signature:** ZOD

---

## Next Steps After QA

1. **Review bug-log.md** - Categorize by severity
2. **Fix CRITICAL bugs** - Wednesday morning (3-4 hours)
3. **Record demo video** - Wednesday afternoon (2 hours)
4. **Update LAUNCH_BLOCKERS.md** - Document findings
5. **Make Friday decision** - Grant / Pay / Co-Founder / Pivot
