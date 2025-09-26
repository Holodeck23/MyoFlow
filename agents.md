# 🤖 Multi-Agent Coordination Strategy

## Current Status - September 23, 2025

### **Project Status:**
- ✅ **MVP Complete** - Austrian therapy practice management system production-ready
- ✅ **Quality Gates** - Zero ESLint warnings, all TypeScript passing
- ✅ **NextAuth v5** - Authentication system fully working
- ✅ **Performance Optimized** - All critical issues resolved

### **Active Workspace:**
```
/Users/ZOD/Documents/GitHub/MyoFlow/
└── Current Branch: performance-optimization-sprint
```

**Current Session:** Claude Code on single workspace (multi-workspace no longer needed)

---

## Git Worktree Setup - September 18, 2025

### **Problem Solved:**
Parallel Claude/Codex sessions were creating schema conflicts, merge issues, and repository chaos. The Calendar Implementation Rescue Session demonstrated the need for proper agent coordination.

### **Solution: Git Worktrees**

**Workspace Structure:**
```
/Users/ZOD/Documents/GitHub/
├── MyoFlow/          # Primary workspace (performance-optimization-sprint)
├── MyoFlow-claude/   # Claude's dedicated workspace (main branch)
└── MyoFlow-codex/    # Codex's dedicated workspace (available if needed)
```

### **Coordination Rules:**

#### **Branch Management:**
- **Primary Development**: Single workspace model working effectively
- **Multi-Agent Sessions**: Use worktrees to prevent conflicts
- **Integration**: PR-based merging ensures clean integration

#### **Task Division:**
- **Claude**: Complex implementation, debugging, architecture decisions, MVP completion
- **Codex**: Systematic tasks, testing, code generation, analysis
- **Coordination**: Through CLAUDE.md updates and this file

#### **Database Sharing:**
- Same `.env` file shared across worktrees
- Database migrations tested in one workspace before applying to others
- Schema changes coordinated through migrations only

### **Workflow Examples:**

**Claude Workflow:**
```bash
cd /Users/ZOD/Documents/GitHub/MyoFlow
git checkout -b feat/new-feature
# Work on implementation
pnpm typecheck && pnpm lint && pnpm build
git commit && git push
```

**Multi-Agent Workflow (when needed):**
```bash
cd /Users/ZOD/Documents/GitHub/MyoFlow-claude
git checkout -b feat/claude-feature
# Claude work

cd /Users/ZOD/Documents/GitHub/MyoFlow-codex
git checkout -b feat/codex-feature
# Codex work
```

### **Benefits Achieved:**
- ✅ **No merge conflicts** during active development
- ✅ **Clean separation** of agent responsibilities
- ✅ **Shared Git history** with isolated working files
- ✅ **Parallel development** without conflicts
- ✅ **Database consistency** with coordinated migrations

### **Lessons from Calendar Rescue Session:**
1. **Schema synchronization** must be coordinated (use `prisma db pull`)
2. **Single environment coordination** >> Parallel session chaos
3. **Git worktrees** prevent branch conflicts
4. **Systematic debugging** can rescue any repository disaster
5. **Quality gates** prevent regressions (`pnpm typecheck && pnpm lint && pnpm build`)

---

**Last Updated:** September 23, 2025 - MVP Complete
**Status:** Single workspace development, worktrees available for multi-agent sessions

---

## Update - September 26, 2025

- Auth consolidation: single NextAuth config at apps/web/src/lib/auth.ts; removed duplication via re-export from apps/web/lib/auth.ts
- Prisma policy: enforce shared prisma singleton import from @myoflow/db (no new PrismaClient in routes)
- Demo gating: AUTH_ENABLE_DEMO added; guarded any dev backdoors under non-production + flag
- Admin routes/pages: marked as dynamic due to cookies() usage; silences build dynamic server warnings
- E2E: Playwright config now sets AUTH_ENABLE_DEMO=true and includes smoke tests for auth and admin flows
- TS Paths: tightened to prefer src-only resolution and explicit '@/app/*' alias
