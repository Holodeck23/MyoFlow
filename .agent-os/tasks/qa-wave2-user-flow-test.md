# 🧪 QA Testing Brief - Wave 2 User Flow Validation

**Assigned to:** QA Agent (to be determined)
**Priority:** HIGH - Blocks Wave 3 progression
**When to Execute:** After Wave 2 Task 6 complete (Client Notes, ConfirmDialog, Navigation)
**Deadline:** End of Day 4 (October 26, 2025)
**Environment:** Development server on localhost:3000
**Database:** Clean slate (all test data cleared)

---

## ⚠️ **KNOWN WAVE 2 SCOPE**

**What's Implemented (Test These):**
- ✅ Client address fields (street, postal, city, country)
- ✅ Invoice date picker (professional calendar, blocks future dates)
- ✅ Invoice validation errors (inline field-level feedback)
- ✅ Client notes feedback (inline success/error banners)
- ✅ Client delete ConfirmDialog (professional modal)
- ✅ Navigation audit (no dead links, "Coming Soon" badges)

**What's NOT Yet Implemented (Skip or Expect Legacy Behavior):**
- ⚠️ Appointment delete ConfirmDialog (may still use browser confirm)
- ⚠️ Dashboard metrics (may show placeholders)
- ⚠️ Some translation keys (may see English fallbacks in DE mode)

---

## 🎯 MISSION OBJECTIVE

Perform comprehensive end-to-end testing of the **grant interview demo workflow** as a real Austrian massage therapist would use it. Identify bugs, UX issues, and compliance problems that could derail the demo.

**Critical Path to Test:**
```
New User → Sign Up → Onboarding Wizard → Create Client (with address)
→ Schedule Appointment → Create Invoice → Download PDF → Success ✅
```

**Success Criteria:**
- ✅ Complete flow works without errors
- ✅ All Wave 1 + Wave 2 improvements validated
- ✅ Bilingual (EN/DE) functionality confirmed
- ✅ Austrian compliance elements present
- ✅ No console errors during critical operations
- ✅ Professional UX suitable for grant interview

---

## 📋 TEST SCENARIOS

### **Scenario 1: First-Time User - Complete Onboarding**

**User Profile:**
- Name: Maria Huber
- Email: maria.huber@example.at
- Business: Heilmassage Praxis Wien
- Location: Vienna (1010)
- Designation: HEILMASSEUR
- Tax Status: Kleinunternehmer

**Steps:**

#### 1. Sign Up & Authentication (5 min)
- [ ] Navigate to http://localhost:3000
- [ ] Click "Register" or "Sign Up"
- [ ] Fill email: maria.huber@example.at
- [ ] Create password: Test1234!
- [ ] Submit registration form
- [ ] Verify email verification flow (if implemented)
- [ ] Sign in with credentials

**Expected Results:**
✅ Sign-up succeeds without errors
✅ Password validation shows requirements clearly
✅ Login redirects to onboarding wizard

**Bug Report if Failed:**
```markdown
**BUG-001: [Title]**
- **Severity:** Critical/High/Medium/Low
- **Page:** [URL or page name]
- **Steps to Reproduce:** [Exact steps]
- **Expected:** [What should happen]
- **Actual:** [What actually happened]
- **Console Errors:** [Any errors in browser console]
- **Screenshot:** [Describe what you see]
```

---

#### 2. Onboarding Wizard - Step 1: Business Info (5 min)
- [ ] Verify wizard shows "Step 1 of 3" or similar progress indicator
- [ ] Fill business name: "Heilmassage Praxis Wien"
- [ ] Fill street: "Kärntner Straße 26"
- [ ] Fill postal code: "1010" (Vienna)
- [ ] Fill city: "Wien"
- [ ] Fill country: "Austria"
- [ ] Fill phone: "+43 1 5123456"
- [ ] Fill email: maria.huber@heilmassage-wien.at
- [ ] Click "Next" or "Continue"

**Expected Results:**
✅ All fields accept Austrian formatting
✅ Postal code validation accepts 1010 (Vienna)
✅ Phone accepts +43 prefix
✅ Progress to Step 2 without errors

**Test Edge Cases:**
- [ ] Try invalid postal code (e.g., "99999") - should show error
- [ ] Try empty required fields - should block submission
- [ ] Try special characters in business name (ö, ä, ü, ß)

---

#### 3. Onboarding Wizard - Step 2: Professional Details (5 min)
- [ ] Select designation: "HEILMASSEUR"
- [ ] Select VAT status: "Kleinunternehmer"
- [ ] Fill UID number: "ATU12345678" (if field present)
- [ ] Fill IBAN: "AT611904300234573201" (if field present)
- [ ] Click "Next" or "Continue"

**Expected Results:**
✅ Dropdown shows all three designations (HEILMASSEUR, MEDIZINISCHER_MASSEUR, GEWERBLICHER_MASSEUR)
✅ Kleinunternehmer option available
✅ Form accepts Austrian IBAN format
✅ Progress to Step 3 without errors

**Test Edge Cases:**
- [ ] Verify German translations if language set to DE
- [ ] Check that UID validates Austrian format (ATU + 8 digits)

---

#### 4. Onboarding Wizard - Step 3: Completion (3 min)
- [ ] Verify completion summary shows entered data
- [ ] Check profile completion percentage (should be > 50%)
- [ ] Click "Go to Dashboard" or "Finish"
- [ ] Verify redirect to dashboard

**Expected Results:**
✅ Completion screen shows congratulations message
✅ Profile score displays correctly
✅ Dashboard loads with welcome message
✅ Profile completion widget visible

---

### **Scenario 2: Client Management - Wave 1 Improvements**

**Goal:** Test client CRUD with new address fields and note feedback

#### 5. Create Client with Full Address (5 min)
- [ ] Navigate to Clients page
- [ ] Click "New Client" button
- [ ] Fill name: "Johann Schmidt"
- [ ] Fill email: "johann.schmidt@example.at"
- [ ] Fill phone: "+43 664 1234567"
- [ ] **NEW: Fill street: "Landstraße 42"**
- [ ] **NEW: Fill postal code: "4020"** (Linz)
- [ ] **NEW: Fill city: "Linz"**
- [ ] **NEW: Fill country: "Austria"**
- [ ] Click "Save" or "Create Client"

**Expected Results:**
✅ All address fields present and required
✅ Postal code accepts Upper Austria code (4020)
✅ Client created successfully
✅ Redirect to client profile view

**Test Edge Cases:**
- [ ] Try to save without address - should show validation errors
- [ ] Test different Austrian regions (Vienna 1010, Salzburg 5020, Graz 8010)
- [ ] Verify address displays on client profile page

---

#### 6. Add Client Note with Inline Feedback (3 min)
- [ ] From client profile, find notes section
- [ ] Click "Add Note" or similar button
- [ ] Type note: "Bevorzugt Termine am Vormittag. Rückenschmerzen seit 3 Monaten."
- [ ] Click "Save Note"
- [ ] **NEW: Verify inline success banner appears (green)**
- [ ] Verify note appears in notes list with timestamp

**Expected Results:**
✅ Green success banner shows "Note saved successfully" or similar
✅ Note appears immediately without page refresh
✅ Timestamp shows current date/time
✅ No browser alert() popup

**Test Edge Cases:**
- [ ] Try to save empty note - should show error
- [ ] **NEW: Verify inline error banner (red) if save fails**
- [ ] Refresh page and verify note persists

---

#### 7. Edit Client Address (3 min)
- [ ] Click "Edit Client" button
- [ ] Change postal code from "4020" to "1010"
- [ ] Change city from "Linz" to "Wien"
- [ ] Click "Save"
- [ ] Verify changes persist on profile view

**Expected Results:**
✅ Address fields pre-filled with existing data
✅ Can update address successfully
✅ Updated address displays correctly

---

#### 8. Delete Client with ConfirmDialog (3 min)
- [ ] Click "Delete Client" button
- [ ] **NEW: Verify professional modal dialog appears (not window.confirm)**
- [ ] Dialog should show: Client name, warning text, Cancel/Confirm buttons
- [ ] Click "Cancel" - dialog should close without deleting
- [ ] Click "Delete" again, then click "Confirm"
- [ ] Verify client deleted and redirected to clients list

**Expected Results:**
✅ Professional modal instead of browser confirm()
✅ Dialog shows client name for confirmation
✅ Cancel button works
✅ Confirm button deletes client
✅ Audit log recorded (check if visible in admin)

---

### **Scenario 3: Appointment Scheduling**

#### 9. Create Appointment (5 min)
- [ ] Navigate to Calendar or Appointments page
- [ ] Click "New Appointment" button
- [ ] Select client: "Johann Schmidt"
- [ ] Select service: "Klassische Massage 60min" (or create if needed)
- [ ] Select date: Today's date
- [ ] Select time: 14:00
- [ ] Select location: Default location (or create if needed)
- [ ] Click "Save" or "Create Appointment"

**Expected Results:**
✅ Client dropdown shows all clients
✅ Date picker opens with calendar view
✅ Time selection works (dropdown or input)
✅ Appointment created successfully
✅ Appears on calendar view

**Test Edge Cases:**
- [ ] Try to schedule appointment in the past
- [ ] Try to schedule overlapping appointments (conflict detection)
- [ ] Verify Austrian holidays highlighted on calendar

---

#### 10. Delete Appointment (3 min)
**NOTE:** ConfirmDialog for appointments not yet implemented in Wave 2 (only clients). Skip this test or expect browser confirm() dialog.

- [ ] Find created appointment in calendar
- [ ] Click appointment to view details
- [ ] Click "Delete Appointment" button (if available)
- [ ] Confirm deletion (may be browser confirm() for now)
- [ ] Verify appointment removed from calendar

**Expected Results:**
✅ Appointment can be deleted
✅ Calendar updates after deletion
⚠️ May still use browser confirm() (not a blocker - appointments less critical than clients)

---

### **Scenario 4: Invoice Creation - Wave 1 Improvements**

**Goal:** Test invoice workflow with date picker and validation errors

#### 11. Create Invoice with Date Picker (7 min)
- [ ] Navigate to Invoices page
- [ ] Click "New Invoice" button
- [ ] Select client: "Johann Schmidt"
- [ ] **NEW: Click service date field - verify DatePickerField opens**
- [ ] **NEW: Verify calendar shows current month**
- [ ] **NEW: Try to select tomorrow's date - should be disabled**
- [ ] Select today's date from calendar
- [ ] **NEW: Verify date appears in field with locale formatting**
  - EN: MM/DD/YYYY (e.g., 10/23/2025)
  - DE: DD.MM.YYYY (e.g., 23.10.2025)
- [ ] Add invoice line:
  - Description: "Klassische Massage 60min"
  - Quantity: 1
  - Unit price: 80.00
  - VAT rate: "Kleinunternehmer"
- [ ] Click "Create Invoice" button

**Expected Results:**
✅ DatePickerField opens with professional calendar UI
✅ Future dates are disabled (greyed out)
✅ Today's date is selectable
✅ Date format matches selected language (EN/DE)
✅ Invoice created successfully with correct date

**Test Edge Cases:**
- [ ] Try to submit without selecting date - should show error
- [ ] Try to manually type future date - should show validation error
- [ ] **NEW: Verify inline error message appears (red text below field)**
- [ ] Switch language (EN ↔ DE) and verify date format changes

---

#### 12. Test Invoice Validation Errors (5 min)
- [ ] Click "New Invoice" again
- [ ] **Leave client unselected** - try to submit
- [ ] **NEW: Verify inline error appears on client field (red border)**
- [ ] Select client: "Johann Schmidt"
- [ ] **Leave service date empty** - try to submit
- [ ] **NEW: Verify inline error appears on date field**
- [ ] Select date: Today
- [ ] **Remove invoice line description** - try to submit
- [ ] **NEW: Verify inline error appears on line item field**
- [ ] **NEW: Check if error alert box shows all errors at once**

**Expected Results:**
✅ Each invalid field shows red border
✅ Inline error text appears below field (red color)
✅ Error alert box at top shows list of all errors
✅ Submit button disabled when errors present
✅ No confusing toast notifications
✅ Error messages are clear and actionable

**Example Expected Error Messages:**
- "Please select a client"
- "Service date is required"
- "Service date cannot be in the future"
- "Description is required"
- "Price must be greater than 0"

---

#### 13. Download Invoice PDF (3 min)
- [ ] After invoice created, verify redirect to invoice detail page
- [ ] Click "Download PDF" button
- [ ] Verify PDF downloads to browser
- [ ] Open PDF and check:
  - [ ] Client name and address (including new fields)
  - [ ] Invoice number (YYYY-NNN format, e.g., 2025-001)
  - [ ] Service date matches selected date
  - [ ] Line items correct
  - [ ] Kleinunternehmer text: "Umsatzsteuerfrei gemäß §6 Abs. 1 Z 27 UStG"
  - [ ] Professional Austrian layout

**Expected Results:**
✅ PDF downloads without errors
✅ All invoice data correct
✅ Austrian compliance text present
✅ Client address includes street/postal/city
✅ Professional formatting

---

### **Scenario 5: Settings & Configuration**

#### 14. Settings Navigation Audit (3 min)
- [ ] Navigate to Settings page
- [ ] **NEW: Verify all tab buttons are visible**
- [ ] Click each tab and verify:
  - [ ] Profile tab loads
  - [ ] Tax Compliance tab loads
  - [ ] Invoice Branding tab loads
  - [ ] System Preferences tab loads
  - [ ] Travel Settings tab loads
  - [ ] Pricing Templates tab loads
- [ ] **NEW: Verify no `href="#"` placeholder links**
- [ ] **NEW: Verify active tab has highlighted background**

**Expected Results:**
✅ All tabs visible with proper contrast
✅ Clicking tabs switches content immediately
✅ Active tab clearly indicated (blue background)
✅ Inactive tabs have visible text (not white on white)
✅ No broken navigation links

---

#### 15. Profile Settings Update (3 min)
- [ ] Go to Settings → Profile tab
- [ ] Update business name: "Heilmassage Praxis Wien - Maria Huber"
- [ ] Update business phone: "+43 1 5123457"
- [ ] Click "Save" button
- [ ] Verify success message appears
- [ ] Refresh page and verify changes persist

**Expected Results:**
✅ Form pre-filled with existing data
✅ Can update all fields
✅ Success message shows after save
✅ Changes persist after refresh

---

### **Scenario 6: Bilingual Testing (EN ↔ DE)**

#### 16. Language Switching (5 min)
- [ ] Find language toggle in top-right corner
- [ ] Current language should be indicated (flag or text)
- [ ] Click to switch from EN → DE (or DE → EN)
- [ ] Verify page content updates immediately
- [ ] Check these elements translate:
  - [ ] Navigation menu items
  - [ ] Dashboard welcome message
  - [ ] Button labels ("Save", "Cancel", "Delete")
  - [ ] Form field labels
  - [ ] Error messages
  - [ ] Date formats change (MM/DD/YYYY ↔ DD.MM.YYYY)
- [ ] Switch back to original language
- [ ] Verify no broken translation keys (e.g., "common.loading" showing as text)

**Expected Results:**
✅ Language toggle visible and clickable
✅ All UI text translates (no raw keys visible)
✅ Date formats change appropriately
✅ German uses formal "Sie" form
✅ English is natural and professional
✅ No layout glitches during switch

**Bug Check:**
- [ ] Look for any untranslated text (shows English in DE mode or vice versa)
- [ ] Check for translation keys showing (e.g., "onboarding.step1.title")
- [ ] Verify forms work correctly in both languages

---

### **Scenario 7: Dashboard & Navigation**

#### 17. Dashboard Overview (3 min)
- [ ] Return to Dashboard (click logo or "Dashboard" link)
- [ ] Verify these elements present:
  - [ ] Welcome message with user name
  - [ ] Profile completion widget (shows %)
  - [ ] Quick navigation tiles (Clients, Appointments, Invoices)
  - [ ] Revenue metrics (can be placeholders for MVP)
- [ ] Click each navigation tile and verify:
  - [ ] Clients tile → Clients list page
  - [ ] Appointments tile → Calendar page
  - [ ] Invoices tile → Invoices list page

**Expected Results:**
✅ Dashboard loads quickly
✅ Profile completion shows realistic percentage
✅ Navigation tiles all work
✅ No broken images or missing assets

---

#### 18. Sidebar Navigation (3 min)
- [ ] Verify sidebar shows all main sections:
  - [ ] Dashboard
  - [ ] Clients
  - [ ] Calendar / Appointments
  - [ ] Invoices
  - [ ] Settings
- [ ] **NEW: Verify no `href="#"` placeholder links**
- [ ] Click each navigation item and verify page loads
- [ ] Verify active page is highlighted in sidebar
- [ ] Check for any "Coming Soon" features (should be clearly marked)

**Expected Results:**
✅ All navigation links work
✅ Active page clearly indicated
✅ No dead links or placeholder pages
✅ Future features clearly marked as "Coming Soon" if visible

---

## 🐛 BUG REPORTING FORMAT

For each bug found, report using this structure:

```markdown
### BUG-[NUMBER]: [Short Title]

**Severity:** Critical | High | Medium | Low

**Category:** Authentication | Clients | Appointments | Invoices | Settings | Navigation | i18n | Other

**Page/Component:** [Exact page URL or component name]

**User Flow Step:** [Which scenario step this occurred in]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior:**
[What should happen according to requirements]

**Actual Behavior:**
[What actually happened]

**Console Errors:**
```
[Paste any browser console errors]
```

**Screenshot Description:**
[Describe what you see - placeholder for actual screenshot]

**Impact:**
[How does this affect the grant interview demo?]

**Suggested Priority:**
[Must fix before demo | Should fix | Nice to fix]
```

---

## ✅ SUCCESS CRITERIA CHECKLIST

### Critical (Must Pass for Grant Demo)
- [ ] Full signup → onboarding → dashboard flow works
- [ ] Can create client with complete address (Vienna 1010, Linz 4020)
- [ ] Can create appointment without errors
- [ ] Can create invoice with date picker (blocks future dates)
- [ ] Invoice PDF downloads with Austrian compliance text
- [ ] No console errors during critical operations
- [ ] Language toggle works (EN ↔ DE)
- [ ] All settings tabs accessible and visible

### High (Should Pass)
- [ ] Client notes show inline success/error feedback
- [ ] Confirm dialogs use professional modals (not window.confirm)
- [ ] Navigation links all work (no href="#")
- [ ] Invoice validation shows clear inline errors
- [ ] Date picker shows locale-appropriate format
- [ ] Profile completion widget shows realistic percentage

### Medium (Nice to Pass)
- [ ] No untranslated text in either language
- [ ] Error messages are helpful and specific
- [ ] Forms retain data on validation failures
- [ ] UI is responsive on different screen sizes
- [ ] Loading states show for async operations

---

## 📊 REPORTING DELIVERABLE

Provide a structured report with these sections:

### 1. Executive Summary (2-3 paragraphs)
- Overall assessment: Ready for demo? (Yes/No/With fixes)
- Critical issues count and impact on grant interview
- Strengths observed
- Key weaknesses

### 2. Test Results by Scenario
For each of the 7 scenarios:
- ✅ Passed | ⚠️ Passed with issues | ❌ Failed
- Summary of what worked
- Summary of issues found
- Bugs logged (reference BUG-XXX numbers)

### 3. Bug Log
- Complete list of all bugs in priority order
- Use BUG reporting format above
- Group by severity: Critical → High → Medium → Low

### 4. User Experience Assessment
- Is the flow intuitive for a non-technical Austrian therapist?
- Are error messages clear and actionable?
- Does the app feel professional and polished?
- Any confusing UI elements or workflows?

### 5. Austrian Compliance Check
- Kleinunternehmer threshold tracking visible?
- VAT rates correct (10%, 13%, 20%)?
- Invoice text includes "§6 Abs. 1 Z 27 UStG"?
- Postal codes accept all Austrian regions (1xxx-9xxx)?
- Professional designations correct (HEILMASSEUR, etc.)?

### 6. Bilingual Quality
- EN translation quality (natural, professional)
- DE translation quality (formal Sie, correct terminology)
- Date format switching works correctly?
- Any raw translation keys visible?

### 7. Recommendations
- Must-fix items before grant interview (Priority 1)
- Should-fix items for polish (Priority 2)
- Nice-to-have improvements (Priority 3)

---

## 🔧 TESTING ENVIRONMENT

**Setup Required:**
```bash
# Ensure dev server running on port 3000
cd ~/MyoFlow
pnpm dev

# Open browser to http://localhost:3000
# Use Chrome or Firefox (latest version)
# Open DevTools Console to monitor errors
```

**Browser Requirements:**
- Test in Chrome (primary)
- Spot-check in Firefox (secondary)
- Note any browser-specific issues

**Database State:**
- Start with clean database (no existing users)
- All test data created during test scenarios
- This simulates real first-time user experience

---

## ⏱️ TIME ESTIMATE

Total estimated time: **90-120 minutes**

Breakdown:
- Scenario 1 (Onboarding): 18 min
- Scenario 2 (Clients): 20 min
- Scenario 3 (Appointments): 8 min
- Scenario 4 (Invoices): 12 min
- Scenario 5 (Settings): 6 min
- Scenario 6 (Bilingual): 5 min
- Scenario 7 (Dashboard): 6 min
- Bug documentation: 20 min
- Report writing: 25 min

---

## 📋 PRE-TEST CHECKLIST

Before starting QA:
- [x] Wave 2 Task 6 marked complete in COORDINATION.md ✅
- [x] All code committed to beta-readiness-core-workflow branch ✅
- [x] Dev server running on localhost:3000 ✅
- [x] Database in clean state (all test data cleared) ✅
- [ ] Browser DevTools Console open (press F12)
- [ ] Test in Chrome or Firefox (latest version)
- [ ] `.agent-os/specs/2025-10-beta-readiness.md` reviewed for context (optional)

**Quick Start:**
1. Open http://localhost:3000 in Chrome
2. Open DevTools Console (F12 → Console tab)
3. Start with Scenario 1 (Sign Up)
4. Keep this document open in a second window for reference

---

## 🎯 GOAL

Deliver a **confident "Yes"** to the question:
> "Can we demo this app to grant committee on October 30, 2025 without embarrassing bugs?"

If answer is "No" or "Only with critical fixes," provide clear list of blockers to resolve before Wave 3 starts.

---

**QA Agent: You are CLEARED to begin comprehensive user flow testing after Wave 2 Task 6 completes.** 🧪

**Report back with:** Executive summary first, then detailed findings. Format optimized for Claude to quickly identify and prioritize fixes.

Good luck! 🚀
