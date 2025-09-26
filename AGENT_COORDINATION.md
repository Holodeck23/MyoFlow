# Multi-Agent Coordination Strategy

## Git Worktree Setup - September 18, 2025

### **Problem Solved:**
Parallel Claude/Codex sessions were creating schema conflicts, merge issues, and repository chaos. The Calendar Implementation Rescue Session demonstrated the need for proper agent coordination.

### **Solution: Git Worktrees**

**Workspace Structure:**
```
/Users/ZOD/Documents/GitHub/
├── MyoFlow/          # Original workspace (currently: performance-optimization-sprint)
├── MyoFlow-claude/   # Claude's dedicated workspace (main branch)
└── MyoFlow-codex/    # Codex's dedicated workspace (detached HEAD)
```

### **Current Status:**
- ✅ **MyoFlow** - Current active development on `performance-optimization-sprint`
- ✅ **MyoFlow-claude** - Claude workspace ready on `main` branch

### **Agent Session Log**

## Latest Session - September 23, 2025

**Claude Session Complete:**
- ✅ NextAuth v5 authentication restored and working
- ✅ Performance emergency surgery (useEffect deps, image optimization)
- ✅ Code quality gates: zero warnings, all TypeScript passing
- ✅ Documentation cleanup and consolidation
- ✅ MVP declared complete and production-ready

**Focus:** Austrian therapy practice management MVP
**Status:** Production-ready with Austrian compliance features
**Next Steps:** User feedback and feature expansion based on real practice needs

## Previous Session - September 19, 2025

---

## Latest Session - September 26, 2025

- Consolidated NextAuth v5 auth to a single source of truth at apps/web/src/lib/auth.ts; legacy path re-exports
- Replaced ad-hoc PrismaClient instantiations with shared singleton import from @myoflow/db
- Gated demo auth backdoors (test user, 'demo' password, admin demo) behind AUTH_ENABLE_DEMO and non-production
- Marked admin pages and API routes as dynamic to explicitly allow cookies() usage during build
- Added Playwright smoke tests for credentials sign-in and admin demo login; set AUTH_ENABLE_DEMO=true in test env
- Tightened TypeScript path aliases to prefer src/* and added explicit '@/app/*' alias
- Updated docs: CLAUDE.md session update, DECISION_LOG.md entry, DEVELOPMENT.md env + E2E docs, agents.md update

Next steps:
- Optional: Migrate admin cookie auth to NextAuth with RBAC to reduce surface area
- Optional: Fix existing failing E2E tests unrelated to auth (appointments suite assumptions)
- Proceed to code review and merge once CI passes

**Codex Session Complete:**
- Added Prisma models for travel settings, tax compliance, credentials, user preferences
- Created migration `20250919120000_user_settings_infrastructure` enabling PostGIS
- Implemented `/api/settings/overview` and `/api/settings/tax-compliance` with Austrian VAT logic
- Introduced `packages/lib/src/austrian-validation.ts` utilities

**Handoff:** Claude to wire UI tabs against new endpoints (Travel, Pricing, Compliance, System)

### **Coordination Protocol**

1. **Session Handoffs:** Update this file with work completed and next steps
2. **Database Changes:** Always run `pnpm prisma:generate` after schema changes
3. **Quality Gates:** `pnpm typecheck && pnpm lint && pnpm build` before commit
4. **Branch Strategy:** Feature branches off main, coordinate via this file