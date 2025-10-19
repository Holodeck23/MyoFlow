# CRITICAL: Date Input Bug Blocks CSV Exports

**Status:** 🔴 BLOCKING - Feature unusable
**Severity:** P0 - Prevents all custom date range exports
**Branch:** `feature/csv-accounting-exports`
**Tested:** October 18, 2025 (hard refresh confirmed)

---

## Problem Summary

The Export Configuration Form date inputs are completely non-functional:

1. **Manual typing is blocked** - Any attempt to type in day/month/year fields immediately clears that field
2. **Date picker doesn't open** - Clicking the calendar icon produces no widget
3. **Default range is too narrow** - System defaults to Sept 1 - Oct 1 (previous month) but finds 0 invoices
4. **Cannot test full feature** - 3 test invoices exist but cannot set date range to include them

## User Testing Report (4th Confirmation)

After hard refresh (Cmd+Shift+R) on port 3002:

```
✗ Manual date entry: Typing clears field immediately
✗ Date picker button: No calendar widget opens
✗ Default range (09/01/2025 – 10/01/2025): Finds 0 invoices
✗ Export history: Stuck on "Loading export history..."
✗ Form validation: Shows technical error "Array must contain at least 1 element(s)"
```

**Conclusion:** Both manual entry and picker workaround are broken. Interface only allows searching default previous month range.

---

## Technical Details

### Component Location
`apps/web/app/dashboard/settings/components/ExportConfigurationForm.tsx:151-188`

### Current Implementation (Lines 151-188)
```tsx
<div className="grid gap-4 sm:grid-cols-2">
  <div className="flex flex-col gap-2">
    <Label htmlFor="dateRangeStart">Start Date</Label>
    <Controller
      control={control}
      name="dateRangeStart"
      render={({ field }) => (
        <Input
          id="dateRangeStart"
          type="date"
          value={field.value ?? ''}
          onChange={(e) => field.onChange(e.target.value)}
          onBlur={field.onBlur}
        />
      )}
    />
    {errors.dateRangeStart && (
      <p className="text-xs text-red-600">{errors.dateRangeStart.message}</p>
    )}
  </div>
  <div className="flex flex-col gap-2">
    <Label htmlFor="dateRangeEnd">End Date</Label>
    <Controller
      control={control}
      name="dateRangeEnd"
      render={({ field }) => (
        <Input
          id="dateRangeEnd"
          type="date"
          value={field.value ?? ''}
          onChange={(e) => field.onChange(e.target.value)}
          onBlur={field.onBlur}
        />
      )}
    />
    {errors.dateRangeEnd && (
      <p className="text-xs text-red-600">{errors.dateRangeEnd.message}</p>
    )}
  </div>
</div>
```

### Default Values (Lines 76-80)
```tsx
const defaultRange = useMemo(() => getPreviousMonthRange(), [])

defaultValues: {
  targetSystem: 'BMD',
  dateRangeStart: defaultRange.start,  // e.g., "2025-09-01"
  dateRangeEnd: defaultRange.end,      // e.g., "2025-10-01"
  statusFilter: STATUS_OPTIONS.slice() as StatusOption[],
  options: { /* ... */ }
}
```

### Input Component
`apps/web/src/components/ui/input.tsx` - Standard shadcn/ui Input component

---

## Root Cause Hypotheses

### Hypothesis 1: Input Component Type Mismatch
The `Input` component may not properly support `type="date"`. Native HTML5 date inputs require specific event handling.

**Evidence:**
- Manual typing clears field (suggests onChange firing incorrectly)
- Date picker doesn't open (suggests browser date widget suppressed)

**Fix Strategy:**
Replace custom `Input` component with native `<input type="date" />`:
```tsx
<input
  id="dateRangeStart"
  type="date"
  value={field.value ?? ''}
  onChange={(e) => field.onChange(e.target.value)}
  onBlur={field.onBlur}
  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
/>
```

### Hypothesis 2: React Hook Form State Sync Issue
Controller may be re-rendering on every keystroke, causing field clearing.

**Evidence:**
- Field clears immediately on typing (suggests rapid state updates)
- Works in other forms using same pattern (suggests form-specific issue)

**Fix Strategy:**
Add `shouldUnregister: false` and verify defaultValues format:
```tsx
const { control, ... } = useForm<ExportConfigurationFormData>({
  mode: 'onBlur',  // Change from default 'onChange'
  shouldUnregister: false,
  defaultValues: {
    dateRangeStart: defaultRange.start,  // Must be 'YYYY-MM-DD' string
    dateRangeEnd: defaultRange.end
  }
})
```

### Hypothesis 3: Date Format Validation Conflict
Zod validation may reject intermediate date states during typing.

**Evidence:**
- Technical validation error appears ("Array must contain at least 1 element(s)")
- Date validation happens before user finishes typing

**Fix Strategy:**
Disable validation until onBlur:
```tsx
const { control, ... } = useForm<ExportConfigurationFormData>({
  mode: 'onBlur',  // Only validate on blur, not on change
  reValidateMode: 'onBlur'
})
```

### Hypothesis 4: Browser/CSS Date Input Conflicts
Custom styling may interfere with native date input functionality.

**Evidence:**
- Date picker button doesn't open (suggests CSS z-index or display issues)
- Works in dev tools when inspecting (suggests hover/focus state issues)

**Fix Strategy:**
Strip all custom styles and use native date input appearance:
```tsx
<input
  type="date"
  {...field}
  className="w-full" // Minimal styling
  style={{ WebkitAppearance: 'auto' }} // Force native appearance
/>
```

---

## Immediate Workarounds

### For Testing (Quick Fix)
Temporarily hardcode a wide date range in the form component:

```tsx
// In ExportConfigurationForm.tsx, line 76-80
defaultValues: {
  targetSystem: 'BMD',
  dateRangeStart: '2025-01-01',  // ← Hardcode full year
  dateRangeEnd: '2025-12-31',    // ← Hardcode full year
  statusFilter: STATUS_OPTIONS.slice() as StatusOption[],
  // ...
}
```

This allows testing with the 3 existing invoices until proper fix is implemented.

### For Production (User Instructions)
**Not deployable** - Feature cannot be used by real users until date inputs are fixed.

---

## Related Issues

1. **Export History Loading** - Still stuck on "Loading..." (may be separate auth/fetch issue)
2. **Validation Error Message** - Shows "Array must contain at least 1 element(s)" instead of friendly message
3. **Invoice Date Range** - Unknown if 3 test invoices are actually in Sept-Oct range (needs SQL check)

---

## Testing Checklist Post-Fix

Once date inputs are fixed, verify:

- [ ] Can manually type dates in YYYY-MM-DD format
- [ ] Date picker icon opens calendar widget
- [ ] Can select dates from calendar widget
- [ ] Selected dates persist after clicking outside field
- [ ] Form validation shows friendly error messages
- [ ] Can set date range 2025-01-01 to 2025-12-31
- [ ] Export preview shows all 3 test invoices
- [ ] Export history loads successfully
- [ ] Generated CSV downloads with correct date range

---

## SQL Diagnostic Query

Check actual invoice dates to determine if date range is the real issue:

```sql
SELECT
  number,
  "createdAt",
  status,
  "totalGrossCents" / 100.0 AS total_euros,
  kleinunternehmer
FROM "Invoice"
WHERE "therapistId" = (
  SELECT id FROM "Therapist" WHERE email = 'test@myoflow.com'
)
ORDER BY "createdAt" DESC;
```

**Expected Output:**
```
number     | createdAt           | status | total_euros | kleinunternehmer
-----------+---------------------+--------+-------------+-----------------
2025-003   | 2025-10-15 10:00:00 | PAID   | 120.00      | false
2025-002   | 2025-09-20 14:30:00 | SENT   | 85.00       | false
2025-001   | 2025-09-05 09:00:00 | PAID   | 150.00      | true
```

If invoices are NOT in Sept 1 - Oct 1 range, then default range is wrong AND date inputs are broken.

---

## Fix Priority

**Priority:** P0 - Must fix before merge OR document as known blocker

**Recommendation:**
1. Try Hypothesis 1 fix first (replace Input with native input)
2. If that fails, try Hypothesis 3 (disable validation on change)
3. If still broken, consider using a proper date picker library (react-day-picker, date-fns)

**Alternative:** Ship with hardcoded wide date range (2025-01-01 to 2025-12-31) as temporary MVP workaround, add GitHub issue for proper date picker.

---

**Last Updated:** October 18, 2025
**Tested By:** ZOD
**Browser:** Chrome (assumed - please confirm)
**Port:** 3002 (dev server)
