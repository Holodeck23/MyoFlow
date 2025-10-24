# FEATURE: Invoice Travel & Holiday Enhancements

**Priority:** P2 - Enhancement (Post-Wave 2)
**Status:** BACKLOG
**Created:** 2025-10-24
**Estimated Time:** 4-6 hours

---

## Overview

Enhance invoice creation with manual travel calculation and optional holiday surcharges. Both features require override capabilities to give therapists full control.

---

## Feature 1: Manual Travel Calculation

### Current State
✅ Travel automatically included from appointments (origin → client address)
✅ Checkbox to enable/disable travel charges
✅ Auto-populated line item with distance and cost

### Enhancement Needed
Add manual origin/destination selection for edge cases where therapist is NOT starting from default business location.

**Use Case:**
- Therapist working from home that day
- Multiple appointments - second appointment uses first client as origin
- Temporary office/co-working space

**Requirements:**
1. **Origin Selector:**
   - Default: Business address from settings
   - Options: All saved locations + "Custom address" input

2. **Destination Selector:**
   - Pre-filled if appointment selected (client address)
   - Manual entry for non-appointment invoices

3. **Real-time Calculation:**
   - Google Maps API call on origin/destination change
   - Show: distance (km), estimated time, calculated cost
   - Display in blue info banner

4. **Manual Override:**
   - Input field to override calculated cost
   - Shows both calculated and override amounts
   - Clear "Reset to calculated" button

**UI Mockup:**
```
┌─────────────────────────────────────────────┐
│ 🚗 Travel Calculation                       │
├─────────────────────────────────────────────┤
│ Origin:      [Business Address ▼]          │
│              ○ Praxis Linz (default)        │
│              ○ Home Office                  │
│              ○ Custom Address...            │
│                                             │
│ Destination: Kärntner Straße 26, 1010 Wien │
│              (from client: Anna Müller)     │
│                                             │
│ Distance: 185.2 km | Time: ~2h 15min       │
│ Calculated: €45.50                          │
│                                             │
│ Manual Override: [€________] (optional)    │
│                                             │
│ [✓] Include in invoice                     │
└─────────────────────────────────────────────┘
```

---

## Feature 2: Public Holiday Surcharge

### Current State
✅ All Austrian holidays calculated and displayed on calendar
✅ Holidays visually marked (red background, red dot)
✅ State-aware (OÖ includes St. Florian, Vienna has St. Leopold, etc.)
❌ No booking restrictions on holidays
❌ No surcharge system

### Enhancement Needed
**Option to charge surcharge** on public holidays with per-appointment override.

**Requirements:**

### A. Database Schema
Add to `Therapist` model:
```prisma
holidaySurchargePercent Int?     @default(0)  // 0 = no surcharge, 50 = 50% extra
allowHolidayBookings    Boolean  @default(true)
```

Add to `Appointment` model:
```prisma
isPublicHoliday         Boolean  @default(false)
holidaySurchargeApplied Boolean  @default(false)
holidaySurchargeCents   Int?     // Cached surcharge amount
```

### B. Settings UI
Location: `/dashboard/settings?tab=pricing`

```
┌─────────────────────────────────────────────┐
│ Public Holiday Rates                        │
├─────────────────────────────────────────────┤
│ [✓] Accept appointments on public holidays │
│                                             │
│ Surcharge Percentage: [50___]%             │
│ (Leave 0 for no surcharge)                 │
│                                             │
│ Example: €60 service → €90 on holidays     │
└─────────────────────────────────────────────┘
```

### C. Appointment Creation Logic
When creating appointment:
1. Detect if date is Austrian public holiday (use existing `isAustrianHoliday()`)
2. If holiday && therapist has surcharge configured:
   - Show warning banner: "⚠️ Public Holiday (Weihnachten) - 50% surcharge will apply"
   - Checkbox: "[ ] Apply holiday surcharge" (checked by default)
   - Allow override - therapist can uncheck for friends/special cases

3. Calculate surcharge:
   ```typescript
   const basePriceCents = service.priceCents
   const surchargePercent = therapist.holidaySurchargePercent || 0
   const surchargeCents = applySurcharge ?
     Math.round(basePriceCents * surchargePercent / 100) : 0
   ```

### D. Invoice Line Items
If appointment has surcharge applied:
```
Klassische Massage (60 Min)           €60.00
  Public Holiday Surcharge (50%)      €30.00
────────────────────────────────────────────
Total                                 €90.00
```

**OR** combine into single line:
```
Klassische Massage - Weihnachten      €90.00
  (includes 50% holiday surcharge)
```

### E. Override Capability
- Per-appointment override in appointment modal
- Per-invoice override when creating invoice from appointment
- Clear indication when surcharge removed: "Holiday surcharge waived"

---

## Feature 3: Public Holidays Always Bookable

**Status:** Already implemented - holidays are visually marked but NOT blocked.

**Action:** Just document this behavior clearly in user docs.

---

## Implementation Plan

### Phase 1: Database Schema (30 min)
- [ ] Add holiday fields to Therapist model
- [ ] Add holiday tracking to Appointment model
- [ ] Generate migration
- [ ] Run migration

### Phase 2: Manual Travel Calculation (3-4h)
- [ ] Origin/destination selector UI components
- [ ] Google Maps API integration in invoice page
- [ ] Real-time calculation display
- [ ] Manual override input
- [ ] Update line item generation logic

### Phase 3: Holiday Surcharge (2-3h)
- [ ] Settings UI for surcharge percentage
- [ ] Appointment modal holiday detection
- [ ] Surcharge calculation logic
- [ ] Override checkbox
- [ ] Invoice line item formatting
- [ ] Update appointment creation API

### Phase 4: Testing
- [ ] Test travel calculation with various origins
- [ ] Test holiday surcharge on different holidays
- [ ] Test override scenarios
- [ ] Verify Austrian state-specific holidays work correctly

---

## Testing Scenarios

### Travel Calculation
1. Invoice from appointment → auto-fills client address
2. Change origin to different location → recalculates
3. Manual override cost → shows both amounts
4. Custom address origin → geocodes correctly

### Holiday Surcharge
1. Create appointment on Weihnachten (Dec 25) → shows 50% surcharge
2. Uncheck surcharge checkbox → appointment at base price
3. Create invoice from holiday appointment → includes surcharge line
4. Settings: set surcharge to 0% → no surcharge applied
5. Upper Austria: May 4 (St. Florian) → surcharge applies
6. Vienna: May 4 → no surcharge (not a holiday there)

---

## Open Questions

1. **Travel Override Persistence:** If user overrides travel cost, should we save it to appointment record?
2. **Holiday Surcharge Tax:** Is 50% surcharge subject to VAT or Kleinunternehmer rules?
3. **Multiple Holidays:** If region has overlapping holidays, apply surcharge once or multiple times?
4. **Custom Origin Geocoding:** Should we cache frequently-used custom addresses?

---

## Dependencies

- Google Maps API (already integrated)
- Austrian holiday library (already exists)
- Settings API (needs holiday fields added)
- Invoice line item generation (needs surcharge logic)

---

**Next Steps:**
1. Complete BUG-003 (PDF error messaging)
2. Get Wave 2 QA sign-off
3. Return to this spec and implement in dedicated feature branch
