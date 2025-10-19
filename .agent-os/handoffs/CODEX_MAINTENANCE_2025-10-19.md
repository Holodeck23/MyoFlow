# Repository Maintenance Tasks - Codex Handoff

**Created:** 2025-10-19
**Priority:** Medium
**Estimated Time:** 2-3 hours
**Branch Strategy:** Create `chore/dependency-updates` from `main`

---

## Context

Following the successful merge of CSV accounting exports, the repository needs routine maintenance. Claude has completed git cleanup (branch deletion, doc archiving). Codex should handle dependency updates and file organization to avoid conflicts.

**Claude Completed:**
- ✅ Synced `main` branch with remote
- ✅ Deleted 9 merged local branches
- ✅ Archived CSV export documentation to `docs/archive/csv-exports-2025-10/`

---

## Tasks for Codex

### Task 1: Safe Dependency Updates (Priority 1)

**Start:** Create branch `chore/dependency-updates` from `main`

#### 1.1 Update TypeScript (Low Risk)
```bash
pnpm update typescript@5.9.3
```
- **Risk:** LOW - Patch version update
- **Test:** Run `pnpm typecheck && pnpm build`
- **Rollback:** If issues, revert to 5.9.2

#### 1.2 Investigate bcryptjs Deprecation (Research Only)
```bash
# Check where it's used
grep -r "bcryptjs" --include="*.ts" --include="*.tsx" --include="*.json"
```
- **Action:** Document findings in commit message
- **Decision:** If not actively used, remove from package.json
- **Alternative:** If used, research migration to `bcrypt` or `@node-rs/bcrypt`
- **DO NOT:** Make breaking changes without approval

#### 1.3 Archive Completed Agent OS Specs (Cleanup)
Move these completed specs to `.agent-os/specs/archive/`:
- `2025-09-07-invoice-pdf-austrian-compliance` (completed)
- `2025-09-07-therapist-profile-settings` (completed)
- `2025-09-07-user-settings-dashboard` (completed)
- `2025-09-08-test-infrastructure-setup` (completed)
- `2025-09-11-travel-aware-scheduling` (completed)
- `2025-09-14-austrian-medical-design-system` (completed)
- `2025-09-15-figma-ui-transition` (completed)
- `2025-09-16-repository-cleanup` (completed)
- `2025-09-17-calendar-view-implementation` (completed)
- `2025-09-17-ui-polish-professional-transformation` (completed)
- `2025-09-18-user-settings-design` (completed)
- `2025-09-22-platform-admin-layer` (completed)
- `2025-09-27-appointment-reminders` (completed)
- `sprint-2-runtime-performance` (completed)

**Commands:**
```bash
mkdir -p .agent-os/specs/archive
mv .agent-os/specs/2025-09-07-invoice-pdf-austrian-compliance .agent-os/specs/archive/
# ... repeat for each completed spec
```

**Keep Active:**
- `2025-10-05-invoice-safety-customization` (in progress)
- `2025-10-06-tier-based-expansion-strategy` (in progress)
- `2025-10-16-csv-accounting-exports` (just merged, keep for reference)
- `2025-10-16-ux-polish-launch-blockers` (active)
- `sprint-4-settings-completion` (active)

---

### Task 2: DEFER Major Dependency Updates (Do NOT Implement)

**These require separate feature branches and thorough testing:**

#### 2.1 ESLint v9 Migration (DEFER)
- Current: v6/v8 ecosystem
- Target: v9.38.0
- **Risk:** HIGH - Breaking changes to config format
- **Effort:** 1-2 hours
- **Note:** Create separate spec when ready

#### 2.2 Next.js 15 Migration (DEFER)
- Current: 14.2.13
- Target: 15.5.6
- **Risk:** VERY HIGH - Major version with breaking changes
- **Effort:** 4-8 hours
- **Note:** Requires dedicated sprint

#### 2.3 Turbo v2 Migration (DEFER)
- Current: 1.13.4
- Target: 2.5.8
- **Risk:** MEDIUM - Build pipeline changes
- **Effort:** 2-3 hours
- **Note:** Test in isolation first

#### 2.4 @types/node v24 (DEFER)
- Current: 20.19.13
- Target: 24.8.1
- **Risk:** MEDIUM - May require Node.js 22+
- **Note:** Check Node.js compatibility first

---

## Quality Gates

Before committing:
1. ✅ `pnpm typecheck` - No errors
2. ✅ `pnpm lint` - No warnings
3. ✅ `pnpm build` - Successful build
4. ✅ `pnpm test:run` - All tests pass

---

## Commit Strategy

### For TypeScript Update:
```
chore: update TypeScript to 5.9.3

Patch version update with no breaking changes.

Quality gates:
- typecheck: passing
- lint: passing
- build: successful
- tests: 243 passing
```

### For bcryptjs Investigation:
```
chore: investigate bcryptjs deprecation

Findings:
- [Document usage locations]
- [Recommendation: remove/migrate/keep]

No functional changes in this commit.
```

### For Spec Archiving:
```
chore: archive completed Agent OS specs

Moved 14 completed specs to .agent-os/specs/archive/ to reduce
workspace clutter. Active specs remain in place.

No code changes.
```

---

## Conflict Avoidance

**DO NOT touch these areas (Claude may work on them):**
- Git branch operations
- Documentation in root `*.md` files
- Active feature branches
- Database migrations
- API routes or UI components

**Safe zones for Codex:**
- `package.json` dependency versions (Task 1.1 only)
- `.agent-os/specs/` directory organization
- Investigation and documentation tasks

---

## Success Criteria

✅ TypeScript updated to 5.9.3
✅ bcryptjs usage documented
✅ Completed specs archived
✅ All quality gates passing
✅ Clean commit history
✅ No conflicts with active work

---

## Notes

- Work incrementally: one task per commit
- Run quality gates after each change
- Document decisions in commit messages
- Ask before making ANY changes not listed here
- DEFER all major updates - these need dedicated planning

**Estimated Completion:** 2-3 hours over 1-2 sessions
