# Sprint 2: Performance Baseline Metrics

**Date:** October 4, 2025
**Branch:** `runtime-performance-sprint`

## Build Performance

### Current Metrics (Baseline)
- **Total Build Time:** 10.25s (with Turbo cache)
- **Full Build Time:** ~3-4 minutes (without cache, from Sprint 1)
- **Cached Tasks:** 4/4 cached
- **Build System:** Turborepo + pnpm

### Page Bundle Sizes

| Page | First Load JS | Notes |
|------|---------------|-------|
| `/dashboard/settings` | **537 kB** | 🚨 CRITICAL - Target for optimization |
| `/dashboard/clients` | 143 kB | ✅ Acceptable |
| `/dashboard/invoices` | 166 kB | ✅ Acceptable |
| `/dashboard/invoices/new` | 101 kB | ✅ Good |
| Shared chunks | 87.4 kB | Baseline |

### Critical Issues Identified

1. **Settings Page Bundle (537 kB)**
   - 10x larger than other pages
   - Likely causes:
     - Heavy client-side components
     - All tabs loaded upfront despite lazy loading
     - Possible duplicate dependencies
   - **Target:** Reduce to < 200 kB (63% reduction)

2. **Client-Side Rendering**
   - Entire settings page is `'use client'`
   - Could benefit from Server Components
   - Data fetched client-side on mount

## Runtime Performance (To Be Measured)

### Metrics to Track
- [ ] Lighthouse Performance Score
- [ ] First Contentful Paint (FCP)
- [ ] Largest Contentful Paint (LCP)
- [ ] Time to Interactive (TTI)
- [ ] Cumulative Layout Shift (CLS)
- [ ] Total Blocking Time (TBT)

### Settings Page Specific
- [ ] Initial load time
- [ ] Tab switch time
- [ ] Data fetch time
- [ ] Hydration time

## Optimization Targets

### Primary Goals (Must Achieve)
1. **Settings Bundle:** 537 kB → <200 kB (63% reduction)
2. **Initial Load:** Measure & improve by 50%
3. **Lighthouse Score:** Target 90+
4. **Build Time:** Maintain <15s with cache

### Secondary Goals (Nice to Have)
1. **Server Components:** Convert static sections
2. **Streaming:** Implement for heavy components
3. **Code Splitting:** Further optimize lazy loading
4. **Tree Shaking:** Remove unused code

## Action Items

### Immediate (High Impact)
1. ✅ Benchmark current state
2. ⏳ Analyze settings bundle composition
3. ⏳ Identify heavy dependencies
4. ⏳ Convert static sections to Server Components
5. ⏳ Optimize lazy loading strategy

### Next Steps
1. Run bundle analyzer
2. Profile component render times
3. Measure Core Web Vitals
4. Document improvements

## Notes

- Current build performance is good (Turbo cache working well)
- Main bottleneck is settings page bundle size
- Focus on incremental improvements
- Don't sacrifice functionality for performance
