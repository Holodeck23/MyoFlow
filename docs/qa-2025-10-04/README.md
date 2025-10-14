# Manual QA Session - October 4, 2025

**Tester:** ZOD
**Purpose:** Pre-launch validation
**Duration:** Est. 6 hours (Monday-Tuesday)

---

## Quick Start

### Run QA Script:
```bash
# Follow step-by-step instructions in:
../../MANUAL_QA_TEST_SCRIPT.md
```

### Save Results Here:
- `bug-log.md` - All bugs found, categorized by severity
- `test-results.md` - Pass/fail for each test suite
- `screenshots/` - Evidence of testing

---

## What Gets Tested

1. **Authentication & Onboarding** (30 min)
   - Signup/login flows
   - Session persistence
   - Missing: No onboarding tutorial identified

2. **Profile Setup** (45 min)
   - Therapist profile creation
   - Austrian business fields
   - Data persistence

3. **Client Management** (45 min)
   - Client CRUD
   - **CRITICAL:** Encryption verification

4. **Appointment Booking** (60 min)
   - Location & service creation
   - Calendar functionality
   - Conflict detection

5. **Invoice Generation** (60 min) 🔥 **MOST CRITICAL**
   - Invoice creation
   - **PDF placeholder check** (CRITICAL)
   - Austrian legal compliance

6. **Dashboard & Analytics** (30 min)
   - Revenue tracking
   - Kleinunternehmer threshold

7. **Settings & Configuration** (45 min)
   - Settings navigation
   - Persistence testing

8. **Translation & Localization** (30 min)
   - Language switching
   - Layout glitch check

9. **Edge Cases** (30 min)
   - Invalid data handling
   - Empty states

---

## Critical Checks

### 🚨 MUST PASS (Block Launch if Failed):

1. **No PDF Placeholders**
   - Business name/address/contact must be real data
   - Any "Placeholder" text = CRITICAL BUG

2. **Encryption Working**
   - Health notes encrypted in database
   - Decrypts correctly in UI

3. **Austrian Legal Text**
   - Kleinunternehmer disclaimer in German
   - Reference to §6 Abs 1 Z 27 UStG

4. **No Critical Crashes**
   - App doesn't break during normal flows
   - Data persists across sessions

### ⚠️ Should Pass (Fix Before Beta):

1. **Conflict Detection**
   - Prevents double-booking

2. **Settings Persistence**
   - Changes save correctly

3. **Translation Quality**
   - No raw keys showing

---

## After QA

### Wednesday Tasks:
1. Review `bug-log.md`
2. Fix CRITICAL bugs (3-4 hours)
3. Re-test fixes
4. Record demo video

### What to Document:
- Total bugs found: _____
- Critical: _____
- High: _____
- Medium: _____
- Low: _____

### Decision Input:
- If 0-2 critical bugs: ✅ Ready for grant/beta
- If 3-5 critical bugs: ⚠️ Fix then decide
- If 6+ critical bugs: 🔴 Not ready, need more work

---

**Start Time:** __________
**Completion Time:** __________
**Ready for Launch?** YES / NO / MAYBE
