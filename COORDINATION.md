# Multi-Agent Coordination Strategy

**Last Updated:** October 4, 2025

## Current Workflow

### Single-Agent Development (Primary)
- **Active Workspace:** `/Users/ZOD/Documents/GitHub/MyoFlow/`
- **Current Branch:** `main`
- **Agent:** Claude Code
- **Status:** Systematic sprint-based development

### Sprint-Based Approach
Each sprint runs on a focused branch:
1. Create sprint branch (e.g., `runtime-performance-sprint`)
2. Implement sprint objectives
3. Pass quality gates (typecheck/lint/build)
4. Merge to main via PR
5. Update CLAUDE.md with progress

## Quality Gates

### Before Every Commit
```bash
pnpm typecheck && pnpm lint && pnpm build
```

### Sprint Completion Checklist
- [ ] All sprint objectives complete
- [ ] Quality gates passing
- [ ] Documentation updated (CLAUDE.md)
- [ ] PR created and merged to main
- [ ] Sprint progress tracker updated

## Multi-Agent Sessions (When Needed)

### Git Worktree Setup
```bash
# Create separate workspaces to prevent conflicts
git worktree add ../MyoFlow-claude main
git worktree add ../MyoFlow-codex main
```

### Workspace Structure
```
/Users/ZOD/Documents/GitHub/
├── MyoFlow/          # Primary workspace
├── MyoFlow-claude/   # Claude's dedicated workspace (if parallel)
└── MyoFlow-codex/    # Codex's dedicated workspace (if parallel)
```

### Database Coordination
- Same `.env` file shared across worktrees
- Migrations coordinated before context switching
- Use `prisma db pull` to synchronize schema

## Session Handoff Protocol

### Ending a Session
1. Complete current sprint items or mark as blocked
2. Commit and push changes
3. Update `CLAUDE.md` with work completed
4. Document decisions in `DECISION_LOG.md`

### Starting a Session
1. Review `CLAUDE.md` for current status
2. Check sprint progress in 7-Sprint Plan
3. Verify quality gates before new work
4. Continue from last in-progress sprint

## Sprint Plan Progress (7 Sprints)

1. ✅ **Hardening (5d)** - Complete (Oct 4, 2025)
2. **Runtime Performance (6d)** - NEXT
3. **UX + i18n Cleanup (5d)** - Pending
4. **Settings Completion (7d)** - Pending
5. **Compliance & Reporting (6d)** - Pending
6. **E2E Reliability (5d)** - Pending
7. **Polish & Launch Prep (4d)** - Pending

## Lessons Learned

### Calendar Rescue Session (Sept 18, 2025)
- Schema synchronization must be coordinated
- Single environment >> Parallel session chaos
- Git worktrees prevent branch conflicts
- Systematic debugging rescues disasters

### Performance Optimization (Sept 23, 2025)
- Modular architecture prevents bloat
- Lazy loading critical for large components
- Quality gates catch regressions early

### Security Hardening (Oct 4, 2025)
- Systematic remediation > ad-hoc fixes
- Production hardening requires dedicated sprint
- All 11 items completed in structured approach

---

**Next Session:** Begin Sprint 2 (Runtime Performance)
