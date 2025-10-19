# Manual QA Checklist - CSV Accounting Exports

**Branch:** `feature/csv-accounting-exports`
**PR:** https://github.com/Holodeck23/MyoFlow/pull/new/feature/csv-accounting-exports
**Status:** ✅ All automated tests passing, awaiting manual QA

---

## Pre-Requisites

### 1. Start Dev Server
```bash
pnpm dev
```

### 2. Ensure Test Data Exists
Navigate to `http://localhost:3000/dashboard/invoices` and verify you have:
- [ ] At least 5 invoices with SENT or PAID status (NOT DRAFT)
- [ ] Mix of Kleinunternehmer and VAT-registered invoices
- [ ] Mix of VAT rates: 10%, 13%, 20%
- [ ] At least one client with special characters (ä, ö, ü, ß) in name

**If no test data:**
```bash
# Option 1: Use seed data
DATABASE_URL=postgresql://ZOD@localhost:5432/myoflow pnpm --filter db prisma db seed

# Option 2: Create manually via UI
# Go to /dashboard/clients/new and /dashboard/invoices/new

# Option 3: Use helper script to add sample invoices
DATABASE_URL=postgresql://ZOD@localhost:5432/myoflow \
  pnpm ts-node scripts/add-test-invoices.ts

#   → This creates five invoices spanning 2025-09-01 to 2025-10-31
#     with SENT/PAID statuses and mixed VAT rates.
```

---

## Test Suite

### 🧪 Test 1: BMD Export Format

**Steps:**
1. Navigate to `http://localhost:3000/dashboard/settings?tab=accounting-exports`
2. In the Export Configuration Form:
   - Target System: **BMD**
   - Date Range Start: First day of previous month
   - Date Range End: Last day of previous month
   - Invoice Status: Check **SENT** and **PAID**
3. Click **Preview Export**

**Verify Preview Modal:**
- [ ] Shows first 10 CSV rows
- [ ] No validation errors (or only warnings for missing addresses)
- [ ] Headers show: `Satzart;GKonto;Steuercode;Buchcode;Rechnungsnummer;...`

4. Click **Generate & Download**

**Verify Downloaded CSV:**
- [ ] Filename format: `MyoFlow-BMD-Export-YYYY-MM-DD-YYYY-MM-DD-timestamp.csv`
- [ ] **Open in Excel (Windows recommended):**
  - [ ] All special characters display correctly (Müller, Größe, Österreich)
  - [ ] No encoding errors or weird symbols
- [ ] **Check Format:**
  - [ ] Exactly **11 columns**
  - [ ] Column headers: Satzart, GKonto, Steuercode, Buchcode, Rechnungsnummer, Rechnungsdatum, Kunde, Kundenadresse, Bruttobetrag, Status, Kleinunternehmer
  - [ ] **Date format:** `dd.MM.yyyy` (e.g., `15.09.2025`)
  - [ ] **Decimal format:** Comma separator (e.g., `120,00` not `120.00`)
  - [ ] **Semicolon separator:** `;` between columns
  - [ ] **Kleinunternehmer:** Shows `Ja` or `Nein` (not 1/0)
  - [ ] **Satzart:** Shows `RG` for all rows
  - [ ] **GKonto:** Shows `8400` for Kleinunternehmer, `8300` or custom for VAT invoices
  - [ ] **Steuercode:** Shows `AT` for VAT invoices, empty for Kleinunternehmer
  - [ ] **Buchcode:** Shows `UST` for VAT invoices, `KU` for Kleinunternehmer

**Expected Result:** ✅ CSV opens in Excel without encoding errors, all 11 columns present with correct Austrian formatting

---

### 🧪 Test 2: DATEV Export Format

**Steps:**
1. Same as Test 1, but select **DATEV** as target system
2. Generate export with invoices containing **mixed VAT rates** (10%, 13%, 20%)

**Verify Downloaded CSV:**
- [ ] **Open in Excel:**
  - [ ] Exactly **14 columns** (not more, not less)
  - [ ] Column headers match DATEV spec
- [ ] **Check Date Format:**
  - [ ] **NO separators:** `15092025` (ddMMyyyy)
  - [ ] NOT `15.09.2025` or `2025-09-15`
- [ ] **Check BU-Schlüssel Codes:**
  - [ ] VAT 20% → BU-Schlüssel = `19`
  - [ ] VAT 13% → BU-Schlüssel = `07`
  - [ ] VAT 10% → BU-Schlüssel = `10`
  - [ ] Kleinunternehmer → BU-Schlüssel = empty
- [ ] **Check Account Codes:**
  - [ ] Konto (column 7): `8300` for VAT invoices, `8400` for Kleinunternehmer
  - [ ] Gegenkonto (column 8): `1776` for VAT invoices, empty for Kleinunternehmer
- [ ] **Decimal format:** Comma separator (e.g., `120,00`)

**Expected Result:** ✅ Exactly 14 columns, correct BU-Schlüssel codes, date format ddMMyyyy

---

### 🧪 Test 3: RZL Export Format

**Steps:**
1. Same as Test 1, but select **RZL** as target system

**Verify Downloaded CSV:**
- [ ] **Check Headers:**
  - [ ] Abbreviated: `RE_NR;RE_DATUM;KUNDE;ADRESSE;BRUTTO_EUR;STATUS;KU_STATUS`
  - [ ] NOT full German names
- [ ] **Check Kleinunternehmer Status:**
  - [ ] Shows `1` for Kleinunternehmer (not `Ja`)
  - [ ] Shows `0` for VAT-registered (not `Nein`)
- [ ] **Date format:** `dd.MM.yyyy` with dots
- [ ] **Decimal format:** Comma separator

**Expected Result:** ✅ Abbreviated headers, 1/0 for Kleinunternehmer status

---

### 🧪 Test 4: Generic CSV Export

**Steps:**
1. Same as Test 1, but select **CSV_GENERIC** as target system

**Verify Downloaded CSV:**
- [ ] **Open in Excel:**
  - [ ] Headers in English: Invoice Number, Invoice Date, Client Name, etc.
  - [ ] Has **12 columns** (includes Net Amount, VAT Amount, VAT Rate, Payment Status, Payment Date)
- [ ] **Check Decimal Format:**
  - [ ] **Dot separator** (e.g., `120.00` not `120,00`)
  - [ ] This is DIFFERENT from BMD/RZL/DATEV!
- [ ] **Date format:** `dd.MM.yyyy` (or `yyyy-MM-dd` if user configured ISO format)

**Expected Result:** ✅ English headers, dot decimal separator, extra columns for detailed breakdown

---

### 🧪 Test 5: Special Characters Handling

**Steps:**
1. Create test invoice for client with name: `Größe & Schönheit GmbH`
2. Address: `Äußere Straße 99, Österreich`
3. Generate BMD export including this invoice

**Verify:**
- [ ] Open CSV in Excel
- [ ] Characters display correctly: `ö`, `ß`, `Ä`, `ü`
- [ ] No encoding errors: `Ã¶`, `Ã¤`, `Ã¼`, etc.
- [ ] **&** symbol displays (not replaced with `&amp;`)

**Expected Result:** ✅ All Austrian special characters display perfectly in Excel

---

### 🧪 Test 6: Edge Cases

#### Test 6.1: Empty Date Range
- [ ] Select date range with no invoices
- [ ] Click Preview
- [ ] **Expected:** Error message "No invoices found in date range"

#### Test 6.2: DRAFT Invoices Only
- [ ] Select date range with only DRAFT invoices
- [ ] Click Preview
- [ ] **Expected:** Error message "DRAFT invoices cannot be exported"

#### Test 6.3: Large Amount
- [ ] Create invoice with €10,000+ amount
- [ ] Generate export
- [ ] **Expected:** Warning in preview, but export succeeds
- [ ] Verify amount formats correctly: `10.000,00` (German format with thousand separator)

#### Test 6.4: Missing Client Address
- [ ] Create invoice for client with no address
- [ ] Generate export
- [ ] **Expected:** Warning in preview ("Client address is missing"), but export succeeds
- [ ] CSV shows empty address field

---

### 🧪 Test 7: Export History

**Steps:**
1. Generate 3 different exports (BMD, DATEV, Generic CSV)
2. Check Export History table below the form

**Verify:**
- [ ] Shows all 3 exports in chronological order (newest first)
- [ ] Each row shows:
  - [ ] Export date/time
  - [ ] Target system (BMD/DATEV/RZL/CSV_GENERIC)
  - [ ] Date range
  - [ ] Invoice count
  - [ ] Total revenue
  - [ ] Download icon
- [ ] Click download icon for second export
- [ ] **Expected:** CSV re-downloads immediately
- [ ] Verify download count incremented (check database or UI if displayed)

**Expected Result:** ✅ History table shows all exports, re-download works

---

### 🧪 Test 8: Preview Modal Validation Warnings

**Steps:**
1. Create invoice with:
   - Gross amount: €12,000 (triggers "unusually high" warning)
   - No client address
   - VAT breakdown mismatch (manually edit if possible)
2. Generate preview

**Verify Preview Modal:**
- [ ] Shows validation warnings section
- [ ] Displays warnings:
  - [ ] "Unusually high invoice amount - please verify"
  - [ ] "Client address is missing"
  - [ ] Any VAT calculation mismatches
- [ ] First 10 CSV rows still display
- [ ] "Generate & Download" button enabled (warnings don't block)

**Expected Result:** ✅ Preview shows warnings, but allows download

---

## 📊 Final Verification

### Quality Checks
- [ ] All CSV files open in Excel without "File may be corrupted" warning
- [ ] UTF-8 BOM present (no encoding dialog in Excel)
- [ ] All special characters (ä, ö, ü, ß, &) display correctly
- [ ] Date formats match Austrian standards (dd.MM.yyyy for display, ddMMyyyy for DATEV)
- [ ] Decimal separators correct (comma for Austrian, dot for generic)

### Database Checks
```sql
-- Verify ExportLog entries created
SELECT * FROM "ExportLog" ORDER BY exported_at DESC LIMIT 10;

-- Should show:
-- - therapistId matching current user
-- - targetSystem (BMD/RZL/DATEV/CSV_GENERIC)
-- - dateRangeStart/dateRangeEnd
-- - invoiceCount
-- - totalRevenueCents
-- - downloadCount (increments on re-download)
```

---

## 🚀 Ready to Merge?

**When ALL checkboxes above are ✅:**

1. Update this document with any issues found
2. If issues found:
   - Create GitHub issue
   - Link to PR
   - Document reproduction steps
3. If no issues:
   - **Approve PR**
   - **Merge to main**
   - **Delete feature branch**

---

## 🆘 Common Issues & Fixes

### Issue: Encoding errors in Excel (Ã¶ instead of ö)
**Fix:** UTF-8 BOM not added. Check `addUTF8BOM()` is called in API route.

### Issue: Decimal shows dot instead of comma
**Fix:** Wrong format function used. BMD/RZL/DATEV should use `formatToDecimalComma()`.

### Issue: DATEV has wrong number of columns
**Fix:** Check DATEV export function returns exactly 14 columns.

### Issue: BU-Schlüssel code wrong
**Fix:** Check `getVATRate()` correctly parses vatBreakdown. Should return 07/10/19.

### Issue: Kleinunternehmer shows 1 instead of "Ja"
**Fix:** BMD should use `Ja`/`Nein`, RZL should use `1`/`0`.

---

**Last Updated:** 2025-10-18
**Tester:** _Your Name Here_
**Test Environment:** macOS/Windows + Excel version
**Result:** ⬜ PENDING / ✅ PASSED / ❌ FAILED
