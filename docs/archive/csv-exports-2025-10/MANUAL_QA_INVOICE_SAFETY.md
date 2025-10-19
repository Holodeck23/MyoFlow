# Manual QA Test Script: Invoice Safety & Customization

**Feature Branch:** `invoice-safety-customization`
**Test Date:** _________________
**Tester:** _________________

---

## Prerequisites

- [ ] Development server running (`pnpm dev`)
- [ ] Database seeded with test therapist account
- [ ] Logged in as therapist user
- [ ] Chrome DevTools open (Network + Console tabs)

---

## Test 1: Revenue Tracking Widget

**Location:** Settings → Compliance Tab

### Test Steps:
1. [ ] Navigate to `/dashboard/settings` → Compliance tab
2. [ ] Verify "Revenue Tracking" widget appears
3. [ ] Check current revenue displays correctly (format: €X,XXX.XX)
4. [ ] Verify threshold percentage shows (0-100%+)
5. [ ] Confirm visual progress bar matches percentage
6. [ ] Check status color:
   - [ ] Green for SAFE (< 80%)
   - [ ] Orange for WARNING (80-100%)
   - [ ] Red for EXCEEDED (100-110%)
   - [ ] Pulsing red for CRITICAL (> 110%)

### Test Data Scenarios:
- [ ] €20,000 revenue → SAFE (36.4%)
- [ ] €50,000 revenue → WARNING (90.9%)
- [ ] €56,000 revenue → EXCEEDED (101.8%)
- [ ] €61,000 revenue → CRITICAL (110.9%)

**Expected:** Status matches revenue level, German messages display correctly

---

## Test 2: Invoice Branding Settings

**Location:** Settings → Profile Tab

### Test Steps:
1. [ ] Navigate to `/dashboard/settings` → Profile tab
2. [ ] Scroll to "Invoice Branding" section
3. [ ] Enter logo URL: `https://via.placeholder.com/200x80`
4. [ ] Verify logo preview appears immediately
5. [ ] Test display preferences:
   - [ ] Select "NAME" → Preview shows name only
   - [ ] Select "LOGO" → Preview shows logo only
   - [ ] Select "BOTH" → Preview shows both logo and name
6. [ ] Enter thank you message: "Vielen Dank für Ihr Vertrauen!"
7. [ ] Verify character counter shows X/500
8. [ ] Click "Save Branding Settings"
9. [ ] Verify green success message appears
10. [ ] Refresh page
11. [ ] Confirm settings persist

### Negative Tests:
- [ ] Enter invalid URL (`not-a-url`) → Error message displays
- [ ] Enter 501-character message → Save fails with error
- [ ] Select "LOGO" without URL → Warning banner appears
- [ ] Click "Reset" → Form reverts to saved values

**Expected:** All validations work, settings save correctly, preview accurate

---

## Test 3: PDF Generation with Branding

**Location:** Invoices → View Invoice → Download PDF

### Test Steps:
1. [ ] Create test invoice for client
2. [ ] Navigate to invoice detail page
3. [ ] Click "Download PDF" button
4. [ ] Open downloaded PDF
5. [ ] Verify invoice header:
   - [ ] Logo displays if configured (check size/positioning)
   - [ ] Business name shows according to display preference
   - [ ] Logo doesn't break layout
6. [ ] Scroll to bottom of PDF
7. [ ] Verify thank you message appears in blue bordered box
8. [ ] Confirm message text matches settings

### Test Display Preferences:
- [ ] NAME: Only business name, no logo
- [ ] LOGO: Only logo (or name if no logo)
- [ ] BOTH: Logo above name

**Expected:** PDF reflects branding settings, Austrian compliance maintained

---

## Test 4: Tax Validation Tracking

**Location:** Settings → Compliance Tab

### Test Steps:
1. [ ] Navigate to `/dashboard/settings` → Compliance tab
2. [ ] Find "Professional Tax Validation" widget
3. [ ] Initial state: Orange "Validation Pending" banner
4. [ ] Click "Mark as Validated" button
5. [ ] Verify status changes to green "Validation Completed"
6. [ ] Check validation date displays (German format: DD. MMMM YYYY)
7. [ ] Click "Clear Validation" button
8. [ ] Confirm returns to "Validation Pending" state

### Disclaimer Checks:
- [ ] VAT-Exempt notice displays with §6 Abs. 1 Z 19 UStG reference
- [ ] Lists 4 therapy types (Physiotherapie, Heilmassage, etc.)
- [ ] "When to consult Steuerberater" section present
- [ ] MyoFlow disclaimer visible ("we are not tax advisors")

**Expected:** Interactive validation tracking works, disclaimers comprehensive

---

## Test 5: Compliance Dashboard API

**Location:** API Testing (Browser DevTools or Postman)

### Test Steps:
1. [ ] Open DevTools → Network tab
2. [ ] Navigate to Compliance tab
3. [ ] Find API call to `/api/compliance/checklist`
4. [ ] Verify response includes:
   - [ ] `overallScore` (0-100)
   - [ ] `profileComplete` (boolean)
   - [ ] `taxValidation` object
   - [ ] `revenueStatus` (SAFE/WARNING/EXCEEDED/CRITICAL)
   - [ ] `checklist` array with items
   - [ ] `categoryScores` (PROFILE/TAX/REVENUE)
   - [ ] `alerts` array
   - [ ] `actionItems` array

### Data Validation:
- [ ] Profile items marked COMPLETE if filled
- [ ] Tax validation reflects database state
- [ ] Revenue status matches current revenue
- [ ] Action items only show required incomplete fields

**Expected:** API returns comprehensive compliance data, no errors

---

## Test 6: Revenue Status API Caching

**Location:** API Testing

### Test Steps:
1. [ ] Call `/api/compliance/revenue-status` (first time)
2. [ ] Note `isCached: false` in response
3. [ ] Wait 1 second
4. [ ] Call API again
5. [ ] Verify `isCached: true` in response
6. [ ] Check `cachedAt` timestamp is recent
7. [ ] Verify cached data matches first call
8. [ ] Wait 24+ hours (or manually expire cache)
9. [ ] Call API again
10. [ ] Confirm fresh calculation (`isCached: false`)

**Expected:** 24-hour caching works correctly, stale data never served

---

## Test 7: End-to-End Invoice Flow

**Location:** Full user journey

### Test Steps:
1. [ ] Log in as therapist
2. [ ] Navigate to Settings → Profile
3. [ ] Configure complete profile (all required fields)
4. [ ] Set invoice branding (logo + thank you message)
5. [ ] Mark tax validation as complete
6. [ ] Create new client
7. [ ] Schedule appointment for client
8. [ ] Create invoice from appointment
9. [ ] Download PDF
10. [ ] Verify PDF contains:
    - [ ] Therapist logo in header
    - [ ] Complete business information
    - [ ] Client details
    - [ ] Service line items
    - [ ] Correct VAT calculations (or Kleinunternehmer notice)
    - [ ] Thank you message at bottom
    - [ ] SEPA QR code (if IBAN configured)
    - [ ] Legal footer with disclaimers

**Expected:** Complete professional invoice with all branding and compliance elements

---

## Test 8: Error Handling

### Test Steps:
1. [ ] Disconnect from internet
2. [ ] Try to save branding settings → Network error shown
3. [ ] Reconnect
4. [ ] Invalid API responses handled gracefully
5. [ ] Missing therapist data shows appropriate errors
6. [ ] Unauthorized requests return 401

**Expected:** User-friendly error messages, no crashes, helpful guidance

---

## Test 9: Responsive Design

**Location:** All widgets

### Test Steps:
1. [ ] Test on mobile viewport (375px)
2. [ ] Test on tablet (768px)
3. [ ] Test on desktop (1920px)
4. [ ] Verify layouts adapt:
   - [ ] Revenue widget stacks correctly
   - [ ] Branding preview adjusts
   - [ ] Two-column compliance layout → single column on mobile
   - [ ] PDF download works on all devices

**Expected:** Professional appearance across all screen sizes

---

## Test 10: Data Persistence

### Test Steps:
1. [ ] Configure all branding settings
2. [ ] Mark tax validation complete
3. [ ] Log out
4. [ ] Log back in
5. [ ] Navigate to settings
6. [ ] Verify all settings persist
7. [ ] Download invoice PDF
8. [ ] Confirm branding still applied

**Expected:** Zero data loss, consistent experience

---

## Regression Tests

### Critical Paths:
- [ ] Existing invoice generation still works
- [ ] Client management unaffected
- [ ] Appointment scheduling unchanged
- [ ] Authentication flows intact
- [ ] Admin panel accessible

**Expected:** No breaking changes to existing functionality

---

## Performance Checks

- [ ] Settings page loads < 2 seconds
- [ ] Revenue widget API responds < 500ms
- [ ] PDF generation completes < 5 seconds
- [ ] No console errors
- [ ] No memory leaks (check DevTools Memory profiler)

---

## Security Validation

- [ ] Cannot access other therapists' branding settings
- [ ] API endpoints require authentication
- [ ] SQL injection attempts blocked
- [ ] XSS attempts sanitized
- [ ] CSRF tokens validated

---

## Sign-Off

### Test Summary:
- **Total Tests:** 71
- **Passed:** _____
- **Failed:** _____
- **Blocked:** _____

### Critical Issues Found:
1. _________________________________
2. _________________________________
3. _________________________________

### Recommendation:
- [ ] **PASS** - Ready for production
- [ ] **CONDITIONAL PASS** - Minor issues, can deploy with notes
- [ ] **FAIL** - Critical issues, do not deploy

**Tester Signature:** ___________________
**Date:** ___________________
