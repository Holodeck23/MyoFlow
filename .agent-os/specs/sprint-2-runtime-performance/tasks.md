# Sprint 2: Runtime Performance - Task Breakdown

**Created:** October 4, 2025
**Duration:** 6 days
**Branch:** `runtime-performance-sprint`

## Objectives

1. **Settings Decomposition** - Optimize settings page with hybrid rendering
2. **Seed Relocation** - Move test data to explicit setup flows
3. **Performance Benchmarking** - Measure and optimize build/hydration times
4. **Repository Cleanup** - Remove unnecessary build artifacts

## Task List

### Task 1: Settings Page Optimization (2 days)

#### 1.1 Convert Overview Tab to Server Component
- [ ] Create server-side data fetching for overview stats
- [ ] Move API calls to server actions
- [ ] Keep interactivity client-side only where needed
- [ ] Test hydration performance

#### 1.2 Implement Progressive Loading Strategy
- [ ] Add streaming SSR for initial content
- [ ] Lazy load heavy components (charts, maps)
- [ ] Optimize bundle size per tab
- [ ] Measure improvement

#### 1.3 Reduce Client-Side State
- [ ] Move static data to server components
- [ ] Use React Server Components for read-only sections
- [ ] Keep client state minimal (UI interactions only)

### Task 2: Seed Data Relocation (1 day)

#### 2.1 Create Setup Flow
- [ ] Build `/setup` page for first-time configuration
- [ ] Move seed data creation to setup wizard
- [ ] Add skip option for advanced users
- [ ] Update documentation

#### 2.2 Modify Seed Script
- [ ] Make seed.ts opt-in via CLI flag
- [ ] Remove automatic test data creation
- [ ] Add seed data templates for different use cases
- [ ] Update package.json scripts

### Task 3: Performance Benchmarking (1 day)

#### 3.1 Build Performance
- [ ] Measure current build times
- [ ] Analyze bundle sizes
- [ ] Identify optimization opportunities
- [ ] Document baseline metrics

#### 3.2 Runtime Performance
- [ ] Measure page load times (Lighthouse)
- [ ] Track hydration timing
- [ ] Monitor Core Web Vitals
- [ ] Create performance dashboard

### Task 4: Repository Cleanup (1 day)

#### 4.1 Build Artifacts
- [ ] Verify .gitignore coverage
- [ ] Remove any committed build files
- [ ] Add pre-commit hooks for artifact prevention

#### 4.2 Dependencies Audit
- [ ] Review package.json for unused deps
- [ ] Update outdated packages (non-breaking)
- [ ] Optimize bundle with tree-shaking

#### 4.3 Code Cleanup
- [ ] Remove unused imports
- [ ] Clean up console.logs
- [ ] Update component documentation

### Task 5: Quality Gates & Documentation (1 day)

#### 5.1 Testing
- [ ] Run full test suite
- [ ] Verify E2E tests pass
- [ ] Add performance regression tests

#### 5.2 Documentation
- [ ] Update CLAUDE.md with Sprint 2 completion
- [ ] Document performance improvements
- [ ] Add performance best practices guide

## Success Criteria

- [ ] Settings page loads 50%+ faster
- [ ] Build time reduced by 20%+
- [ ] No test data created by default
- [ ] All quality gates passing
- [ ] Lighthouse score > 90
- [ ] Core Web Vitals in "good" range

## Metrics to Track

### Before Sprint 2
- Settings page load time: TBD
- Build time: TBD
- Bundle size: TBD
- Lighthouse score: TBD

### After Sprint 2
- Settings page load time: (target: 50% improvement)
- Build time: (target: 20% reduction)
- Bundle size: (target: 15% reduction)
- Lighthouse score: (target: 90+)

## Notes

- Focus on incremental improvements
- Don't break existing functionality
- Keep user experience smooth
- Document all changes
