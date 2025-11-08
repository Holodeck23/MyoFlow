# MyoFlow QA Testing Instructions for Perplexity Browser Agent

**Application URL:** http://localhost:3003
**Test Account:** test3@myoflow.com (**YOU MUST CREATE THIS - DO NOT USE EXISTING ACCOUNTS**)
**Context:** Austrian therapy practice management software - MVP validation phase

**CRITICAL:** Old test accounts (test@myoflow.com, test2@, etc.) are BROKEN - they were created before the therapist profile auto-setup was implemented. You MUST create a fresh test3@myoflow.com account to test the complete flow.

---

## 🎯 YOUR ROLE AS QA AGENT

You are testing a **production-ready MVP** to find bugs and usability issues. Your job is to:

✅ **DO THIS:**
- Execute test workflows step-by-step
- Document what broke, what's confusing, or what doesn't work
- Note visual bugs (alignment, spacing, overflow, missing elements)
- Report error messages and console errors
- Test in both English and German (language switcher in top right)
- Check Austrian-specific features (postal codes, VAT, IBAN validation)

❌ **DO NOT DO THIS:**
- Suggest new features or redesigns
- Recommend architecture changes
- Propose different tech stacks
- Critique design aesthetics (unless it's a functional bug)
- Make out-of-scope improvement suggestions

---

## 🧪 TEST WORKFLOWS (Execute in Order)

### **Workflow 1: Authentication & Profile Setup**

**CRITICAL:** You MUST create a NEW test3@myoflow.com account. DO NOT use existing test accounts - they are broken.

**Steps:**
1. Navigate to http://localhost:3003
2. Click "Sign Up" (NOT "Sign In")
3. Fill registration form:
   - Email: test3@myoflow.com
   - Password: TestPassword123!
   - First Name: Test
   - Last Name: Three
   - Practice Name: Test Therapy Practice
4. Submit registration
5. Sign in with test3@myoflow.com credentials
6. You should land on dashboard
7. Go to Dashboard → Settings → verify all tabs load

**What Happens Automatically:**
The registration creates:
- User account (test3@myoflow.com)
- Therapist profile (slug: test-three)
- Default settings (tax, travel, preferences, exports)
- 30-day trial subscription
- Default Austrian location (Linz)

**Success Criteria:**
- ✅ Registration completes without errors
- ✅ Can sign in immediately after registration
- ✅ Dashboard loads successfully
- ✅ All settings tabs load without "User account not found" errors
- ✅ Profile tab shows default values (Linz 4020, KLEINUNTERNEHMER)

**What to Document:**
- Registration form validation issues
- Any errors during account creation
- If settings tabs still show "User account not found" (CRITICAL BUG)
- Missing default data in settings tabs
- Any step that fails or is confusing

**Why Not Use Existing Accounts:**
Old test accounts (test@myoflow.com, test2@) were created before automatic therapist profile creation existed. They have User records but no Therapist records, causing "User account not found" errors. Fresh accounts work correctly.

---

### **Workflow 2: Client Management**

**Steps:**
1. Go to Dashboard → Clients
2. Click "New Client"
3. Fill in Austrian client details:
   - Name: "Julia Beispiel"
   - Street: "Hauptstraße 15"
   - Postal Code: "4020"
   - City: "Linz"
4. Save client
5. Edit the client
6. Try to delete the client (if option exists)

**Success Criteria:**
- Client form saves without errors
- Austrian postal codes validate (4xxx)
- Client appears in list after saving
- Edit functionality works
- Navigation back to list works

**What to Document:**
- Forms that fail to save
- Validation errors on valid Austrian addresses
- Missing fields or required field indicators
- Broken navigation after save/cancel
- Client list not updating after changes

---

### **Workflow 3: Appointment Scheduling**

**Steps:**
1. Go to Dashboard → Calendar/Appointments
2. Click "New Appointment" or similar
3. Select the client created in Workflow 2
4. Choose a date/time in the future
5. Add appointment details
6. Save appointment
7. Try editing the appointment
8. Check if appointment shows on calendar view

**Success Criteria:**
- Appointment creation form works
- Date/time picker accepts input
- Appointment saves and appears in calendar
- Edit functionality works
- No scheduling conflicts created

**What to Document:**
- Date picker bugs (can't select dates, wrong format)
- Time picker issues
- Appointment not appearing after save
- Calendar view showing wrong dates/times
- Broken time zones (should be Europe/Vienna)

---

### **Workflow 4: Invoice Generation**

**Steps:**
1. Go to Dashboard → Invoices
2. Click "New Invoice" or similar
3. Select client from Workflow 2
4. Add line items for therapy services
5. Set VAT status (Kleinunternehmer or regular VAT)
6. Generate invoice
7. Download/view PDF
8. Check invoice status (DRAFT → SENT → PAID flow)

**Success Criteria:**
- Invoice form calculates totals correctly
- Austrian VAT rates apply (20% standard, 10/13% reduced, or 0% for Kleinunternehmer)
- PDF generates without errors
- Invoice number assigned correctly
- Status transitions work

**What to Document:**
- Calculation errors (wrong totals, VAT, or net/gross)
- PDF generation failures or missing data in PDF
- Invoice numbers not incrementing
- Status changes not saving
- Austrian VAT compliance issues

---

### **Workflow 5: Settings Management**

**Steps:**
1. Go to Dashboard → Settings
2. Test each settings tab:
   - **Profile Tab**: Business information, VAT number, IBAN
   - **Travel Tab**: Base location, travel rates
   - **Pricing Tab**: Service rate templates
   - **Compliance Tab**: VAT/Kleinunternehmer settings
   - **System Tab**: Language (EN/DE), timezone, currency
3. Make changes in each tab and save
4. Refresh page to verify changes persisted
5. Test form validation (try invalid IBAN, postal codes, etc.)

**Success Criteria:**
- All tabs load without errors
- Forms accept valid inputs and reject invalid ones
- Changes save and persist after page refresh
- Austrian validation works (postal codes, VAT numbers, IBAN)
- Language switching works correctly

**What to Document:**
- Tabs that don't load or show errors
- Forms that won't save or show false validation errors
- Fields accepting invalid data (wrong IBAN format, non-Austrian postal codes)
- Settings not persisting after refresh
- Language switcher causing layout issues

---

### **Workflow 6: Accounting Exports** ⚠️ KNOWN ISSUES

**Steps:**
1. Go to Settings → Accounting Exports tab
2. Select target system: BMD, DATEV, RZL, or Generic CSV
3. Choose date range (use October 1-31, 2025 if invoices exist)
4. Click "Preview Export"
5. Review preview data
6. Click "Generate Export" or "Generate and Download"
7. Check if CSV file downloads
8. Open CSV and verify format

**Success Criteria:**
- Date range picker accepts dates correctly
- Preview shows invoice data
- Export generates CSV file
- CSV format matches target system (BMD, DATEV, RZL)
- No duplicate downloads or auto-generation bugs

**Known Issues to Verify:**
- Date picker refusing manual input (forcing calendar selection)
- Button text inconsistent ("Generate" vs "Generate and Download")
- Export auto-generating when switching target systems
- "No invoices found" message when invoices exist for period

**What to Document:**
- Date range issues (can't select dates, wrong format, validation errors)
- Preview not loading or showing wrong data
- Export file not downloading
- CSV format incorrect or missing columns
- Button behavior inconsistencies
- Any auto-generation bugs when changing settings

---

## 🐛 BUG REPORTING FORMAT

For each bug found, document:

```
BUG: [Short description]
WORKFLOW: [Which test workflow]
STEPS TO REPRODUCE:
1. [Step 1]
2. [Step 2]
3. [Step 3]

EXPECTED BEHAVIOR: [What should happen]
ACTUAL BEHAVIOR: [What actually happened]

SEVERITY: [Critical / High / Medium / Low]
- Critical: Blocks core workflow, data loss risk
- High: Major functionality broken
- Medium: Workaround exists
- Low: Cosmetic or minor UX issue

CONSOLE ERRORS: [Any browser console errors - press F12]
SCREENSHOT: [If visual bug]
```

---

## 🎯 SPECIFIC THINGS TO CHECK

### Austrian Compliance
- Postal codes must be 4 digits (4xxx format)
- VAT numbers should have ATU prefix
- IBAN should start with AT followed by 2 digits
- Currency should be EUR (€)
- Date format should be DD.MM.YYYY in German
- Timezone should be Europe/Vienna

### Data Persistence
- Save a setting, refresh page → does it persist?
- Create a client, navigate away, come back → still there?
- Edit an invoice, reload page → changes saved?

### Form Validation
- Try invalid inputs (wrong formats, empty required fields)
- Check error messages are clear and helpful
- Ensure valid inputs are always accepted

### Navigation
- Does "Cancel" take you back correctly?
- Do breadcrumbs work?
- Can you navigate between sections without losing data?

### Language Switching
- Toggle between English and German (top right)
- Check if content translates properly
- Look for layout shifts or broken UI when switching
- Verify no "common.loading" or translation keys showing

### Performance
- Pages should load in under 3 seconds
- No excessive re-renders or flickering
- Forms should save within 2 seconds

---

## 📊 TEST COMPLETION CHECKLIST

After completing all workflows, provide a summary:

```
✅ WORKFLOWS COMPLETED: [X/6]

BUGS FOUND:
- Critical: [count]
- High: [count]
- Medium: [count]
- Low: [count]

TOP 3 ISSUES:
1. [Most critical issue]
2. [Second most critical]
3. [Third most critical]

WORKFLOWS THAT WORK WELL:
- [List any that worked perfectly]

WORKFLOWS THAT ARE BROKEN:
- [List any that completely failed]

GERMAN TRANSLATION STATUS:
- [Working / Partial / Broken]

AUSTRIAN COMPLIANCE STATUS:
- [All validations working / Some issues found]
```

---

## ⚠️ SCOPE BOUNDARIES - READ CAREFULLY

**YOU ARE HERE TO TEST, NOT TO DESIGN**

This is an MVP validation phase. The goal is to find what's **broken** or **confusing**, not to improve what's working.

**Examples of GOOD feedback:**
- "The date picker won't let me type dates manually - I have to use the calendar"
- "Invoice total calculation is wrong: 100€ + 20% VAT = 120€, but it shows 122€"
- "Settings tab shows 0% progress but the circle is 80% filled"
- "German translation shows 'common.loading' instead of 'Laden...'"

**Examples of OUT-OF-SCOPE feedback:**
- "The UI would look better with rounded corners"
- "You should use a different color scheme"
- "This feature should work differently"
- "You should add a feature for X"

**When in doubt:** Describe the problem, don't prescribe the solution.

---

## 🚀 GETTING STARTED

1. Open http://localhost:3003 in your browser
2. Open browser console (F12) to monitor errors
3. Start with Workflow 1 and proceed in order
4. Document bugs using the format above
5. Complete all 6 workflows
6. Provide the completion checklist summary

**Test Duration:** Expect 30-45 minutes for thorough testing

**Remember:** You're looking for broken functionality, not opportunities to redesign. Focus on what doesn't work, what's confusing, or what violates Austrian compliance requirements.

---

## 🔧 TROUBLESHOOTING COMMON ISSUES

### "User account not found" or API 404/500 Errors
**Problem:** Settings API endpoints returning errors
**Root Cause:** You used an OLD test account (test@myoflow.com, test2@) instead of creating test3@

**Solution:**
1. Sign out completely
2. Go to Sign Up page (NOT Sign In)
3. Create NEW account test3@myoflow.com
4. Registration automatically creates therapist profile
5. Sign in and verify settings work

**Why This Happens:**
- Old accounts: Created before auto-setup existed → no therapist record
- New accounts: Automatically get complete therapist profile during registration
- All APIs require therapist record to function

### "No invoices found" in Exports
**Problem:** Export says no invoices for date range
**Solution:** This test account may not have invoices
**Workaround:**
1. Create a client first (Workflow 2)
2. Create an invoice (Workflow 4)
3. Then test exports (Workflow 6)

### Translation Keys Showing (e.g., "common.loading")
**Problem:** German translations incomplete
**Expected:** This is a known issue, document which keys appear

### Date Picker Won't Accept Manual Input
**Problem:** Can only select dates via calendar UI
**Expected:** Known issue from previous testing, verify it still exists

### Multiple Dev Servers on Different Ports
**Problem:** Dev server on port 3003 instead of 3000
**Not a bug:** Other dev instances are running, this is normal

---

Good luck! Report everything you find. 🔍
