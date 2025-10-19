# Bug Fixes Needed - CSV Accounting Exports

**Date:** 2025-10-18
**Reporter:** User testing on test@myoflow.com account
**Branch:** feature/csv-accounting-exports

---

## 🐛 Critical Bugs

### 1. Export History Shows "Loading..." Forever
**Location:** `ExportHistoryTable` component
**Issue:** Export history section shows "Loading export history…" indefinitely
**Expected:** Should either:
- Show "No exports yet" if empty
- Show list of previous exports
- Show error message if fetch failed

**To Fix:**
- Check API call to `/api/exports/accounting/history` is working
- Verify loading state is being updated after fetch
- Add error boundary for failed fetches
- Add "No exports yet" empty state

**Test:**
```bash
# Check if history endpoint works
curl -X GET http://localhost:3002/api/exports/accounting/history \
  -H "Cookie: <session-cookie>"
```

---

### 2. No Invoices Found (Even When Invoices Exist)
**Location:** Export generation/preview handlers
**Issue:** "No invoices found for the selected period" even with valid date range
**Expected:** Should find and export invoices

**Possible Causes:**
1. Date range filtering logic using wrong timezone (UTC vs Vienna)
2. Invoice query missing therapistId filter
3. Status filter not being applied correctly
4. Invoice.createdAt vs Invoice.date field mismatch

**To Fix:**
- Check invoice query in `/api/exports/accounting/generate` route
- Verify date comparison uses correct timezone
- Add debug logging to show:
  - Number of invoices in DB for therapist
  - Applied filters (date range, status)
  - Actual SQL query being run

**Debug Query:**
```sql
-- Run this to check what invoices exist
SELECT
  id, number, status, "createdAt", "totalGrossCents"
FROM "Invoice"
WHERE "therapistId" = '<therapist-id>'
ORDER BY "createdAt" DESC;
```

---

### 3. Date Input Clearing Bug (FIXED by Codex)
**Location:** `ExportConfigurationForm.tsx` lines 153-188
**Status:** ✅ FIXED - Now using Controller instead of register()
**Verify:** Date inputs should now allow manual typing without clearing

---

## ⚠️ Medium Priority Issues

### 4. Better Error Messages for No Invoices
**Location:** Export handlers
**Enhancement:** When no invoices found, show:
- Selected date range
- Invoice status filters applied
- Total invoices in system for this therapist
- Suggestion: "Try widening date range or checking different statuses"

**Example:**
```
No invoices found for September 1 - October 31, 2025 with status: SENT, PAID

You have 0 invoices in the system. Create some test invoices first:
→ Go to Invoices → New Invoice
```

---

### 5. Validation Error Message Too Technical
**Location:** Status filter validation
**Current:** "Array must contain at least 1 element(s)"
**Better:** "Please select at least one invoice status (SENT or PAID)"

**Fix:**
```typescript
// In formSchema validation
if (!data.statusFilter || data.statusFilter.length === 0) {
  ctx.addIssue({
    code: 'custom',
    path: ['statusFilter'],
    message: 'Please select at least one invoice status' // ✅ Better
  })
}
```

---

## 🔍 Testing Checklist for Codex

### Test Data Setup
```bash
# 1. Login as test@myoflow.com
# 2. Create test invoices via UI:
#    - Go to /dashboard/invoices/new
#    - Create 3 invoices with dates: 2025-09-15, 2025-09-25, 2025-10-05
#    - Set status to SENT or PAID (NOT DRAFT)
#    - Save each invoice

# 3. OR run seed script (if exists):
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/myoflow \
  pnpm --filter db prisma db seed
```

### Verify Fixes
- [ ] Export history loads and shows "No exports yet" or lists exports
- [ ] Date inputs allow manual typing without clearing
- [ ] Preview Export finds invoices with date range 2025-09-01 to 2025-10-31
- [ ] Generate Export creates CSV file
- [ ] Export history updates after successful export
- [ ] Re-download from history works
- [ ] Better error messages show when no invoices found
- [ ] Validation messages are user-friendly

---

## 🔧 Debugging Commands

### Check Database State
```bash
# Connect to database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/myoflow psql

# Check invoices for test user
SELECT u.email, t.id as therapist_id, COUNT(i.*) as invoice_count
FROM "User" u
JOIN "Therapist" t ON t."userId" = u.id
LEFT JOIN "Invoice" i ON i."therapistId" = t.id
WHERE u.email = 'test@myoflow.com'
GROUP BY u.email, t.id;

# Check invoice details
SELECT
  number, status, "createdAt", "totalGrossCents", kleinunternehmer
FROM "Invoice"
WHERE "therapistId" = (
  SELECT id FROM "Therapist" WHERE "userId" = (
    SELECT id FROM "User" WHERE email = 'test@myoflow.com'
  )
)
ORDER BY "createdAt" DESC;

# Check export logs
SELECT * FROM "ExportLog"
WHERE "therapistId" = (
  SELECT id FROM "Therapist" WHERE "userId" = (
    SELECT id FROM "User" WHERE email = 'test@myoflow.com'
  )
)
ORDER BY "exportedAt" DESC;
```

### Check API Endpoints
```bash
# Test history endpoint
curl http://localhost:3002/api/exports/accounting/history

# Test preview endpoint
curl -X POST http://localhost:3002/api/exports/accounting/preview \
  -H "Content-Type: application/json" \
  -d '{
    "targetSystem": "BMD",
    "dateRangeStart": "2025-09-01",
    "dateRangeEnd": "2025-10-31",
    "statusFilter": ["SENT", "PAID"]
  }'
```

---

## 📝 Root Cause Analysis

### Most Likely Issue: Invoice Query Logic

The "No invoices found" is probably caused by:

1. **Wrong date field:** Query might be using wrong field name
   - Check if it's `createdAt` vs `date` vs `invoiceDate`

2. **Timezone mismatch:** Date filtering using UTC but invoices stored in Vienna time
   - Fix: Convert dates to Vienna timezone before querying

3. **Missing therapistId:** Query not filtering by logged-in therapist
   - Fix: Ensure `requireTherapist()` returns therapist and query uses it

4. **Status filter wrong:** Comparing wrong enum values
   - Check if DB has `SENT`/`PAID` or different values

**Priority Fix Order:**
1. Fix export history loading bug (shows "Loading..." forever)
2. Fix invoice query to actually find invoices
3. Improve error messages
4. Verify date inputs work (already fixed by Controller change)

---

## 🎯 Success Criteria

Export feature is working when:
- [ ] Export history loads (shows empty state or lists exports)
- [ ] Can generate BMD export with 3+ invoices
- [ ] CSV downloads with correct formatting
- [ ] Export appears in history table immediately
- [ ] Re-download from history works
- [ ] Preview modal shows first 10 rows + warnings
- [ ] Date inputs don't clear when typing
- [ ] Error messages are helpful and actionable

---

**Next Steps for Codex:**
1. Focus on fixing the invoice query first (why no invoices found?)
2. Fix export history loading state
3. Improve validation messages
4. Test with real data on test@myoflow.com account
