# MyoFlow Development Decision Log

## 2025-09-26: Auth consolidation, demo gating, and admin dynamic routing

### Context
- Duplicate NextAuth configuration caused ambiguity in handler exports and environment resolution
- Multiple PrismaClient instances risked dev/HMR connection noise
- Admin cookie-based flows accessed cookies() in routes/pages, causing dynamic server warnings at build time

### Decision
- Consolidate NextAuth to apps/web/src/lib/auth.ts and re-export from apps/web/lib/auth.ts
- Enforce Prisma singleton usage by importing `prisma` from `@myoflow/db` in server code
- Gate demo auth paths (test user, fallback password, admin demo) behind `AUTH_ENABLE_DEMO` and never allow in production
- Mark admin pages and routes `dynamic = 'force-dynamic'` to make cookie usage explicit

### Impact
- Stable auth handlers and consistent server runtime behavior
- Fewer database client instances during development
- Clear security posture for demo features; production safe by default
- Clean Next.js build without dynamic server warnings for admin features

---

## 2025-09-23: MVP Complete - Architecture Decisions Finalized

### Context
- MVP reached completion with all core features working
- Performance optimization sprint completed
- Code quality gates all passing

### Decisions Made
- **Authentication:** NextAuth v5 finalized as primary auth system
- **Performance:** Modular component architecture (settings split into 7 components)
- **Code Quality:** Zero-warning policy enforced (TypeScript + ESLint)
- **Documentation:** Consolidated structure with essential development files only

### Impact
- Production-ready codebase with Austrian compliance
- Clean development workflow established
- Ready for user feedback and feature expansion

---

## 2025-09-19: Stabilisation & MVP Sprint Plan Recorded

### Context
- Ongoing coordination between Claude and Codex required a clear roadmap to close outstanding issues and avoid feature creep while finishing the remaining MVP scope.

### Decision
- Document a seven-sprint sequence (four stabilisation sprints + three MVP completion sprints) in `CLAUDE.md` under "📆 Stabilisation & MVP Plan (Sept 2025)".
- Treat the plan as the canonical guide for branch planning and handoffs; all sprint outcomes must update session coordination.

### Impact
- Establishes a shared reference so both agents prioritise security/performance fixes before resuming feature work.
- Enables stakeholders to track progress against a finite series of sprints without expanding scope.

---

## 2025-09-15: Strategic Pivot to Figma-Based UI

### Context
- Current UI implementation assessed as "15% complete, broken imports, looks like student project"
- User generated professional Figma design showing Austrian medical software standards
- Development server had Heroicons import conflicts preventing dashboard access

### Key Decisions Made

#### 1. Strategic UI Direction
**Decision:** Complete UI rebuild using Figma design as foundation
**Rationale:** Current incremental UI fixes insufficient for Austrian medical software market positioning
**Impact:** Preserves all Austrian business logic while achieving professional appearance

#### 2. Component Architecture
**Decision:** Implement modular, lazy-loaded components
**Rationale:** Performance issues with monolithic components
**Impact:** Faster load times, better code organization

#### 3. Austrian Compliance Priority
**Decision:** Maintain Austrian medical software compliance as core differentiator
**Rationale:** Unique market positioning for Austrian therapy practices
**Impact:** RKSV compliance, Austrian tax calculations, proper medical workflow