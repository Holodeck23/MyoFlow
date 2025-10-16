# Jules - Workspace Reset Instructions

## Clean Slate Reset (Start Fresh)

If you've created test files that are causing issues, here's how to get back to a clean state:

### Step 1: Stop All Running Processes
```bash
# Kill any dev servers
pkill -f "next dev"

# Kill any test watchers
pkill -f "vitest"

# Or just Ctrl+C any running terminals
```

### Step 2: Remove Test Files You Created
```bash
# Go to your MyoFlow directory
cd /path/to/MyoFlow

# Remove any test files you created (BE CAREFUL - only delete YOUR files)
# Example - adjust paths based on what YOU created:
rm apps/web/src/test/settings-profile.api.test.ts
rm apps/web/src/test/settings-travel.api.test.ts
rm apps/web/src/test/settings-tax-compliance.api.test.ts
# etc...

# OR if you created a whole directory:
rm -rf apps/web/src/test/api/

# Remove any E2E tests you created:
rm -rf apps/web/e2e/settings.spec.ts

# Remove any validation tests:
rm -rf packages/lib/src/validation/validation.test.ts
```

### Step 3: Git Status Check
```bash
git status

# This will show you what's changed
# You should see your deleted test files listed
```

### Step 4: Discard All Changes (Nuclear Option)
**WARNING: This deletes ALL your work!**
```bash
# This removes ALL uncommitted changes
git reset --hard HEAD

# This removes ALL untracked files (new files you created)
git clean -fd

# Verify you're clean
git status
# Should say: "nothing to commit, working tree clean"
```

### Step 5: Clean Node Modules & Cache
```bash
# Remove all node_modules
rm -rf node_modules apps/*/node_modules packages/*/node_modules

# Remove all build artifacts
rm -rf apps/web/.next
rm -rf apps/web/node_modules/.vitest
rm -rf packages/*/dist

# Reinstall from scratch
pnpm install
```

### Step 6: Verify Clean State
```bash
# TypeScript should pass
pnpm typecheck

# Linting should pass
pnpm lint

# Build should pass
pnpm build

# Existing tests should pass
pnpm --filter web test:run
pnpm --filter db test
```

---

## Selective Reset (Keep Some Work)

If you want to keep SOME of your work but reset specific files:

### Reset Individual Files
```bash
# Reset a specific file to main branch version
git checkout main -- apps/web/src/test/settings-branding.api.test.ts

# Verify
git diff apps/web/src/test/settings-branding.api.test.ts
```

### Stash Your Work (Save for Later)
```bash
# Save all your changes without committing
git stash save "my test files - work in progress"

# Verify clean state
git status

# Later, retrieve your work:
git stash pop
```

---

## What Files Should Exist (Clean State)

After reset, you should have these test files (and ONLY these):

### Web Package Tests
```
apps/web/src/test/
├── setup.ts                           ✅ Keep
├── smoke.test.ts                      ✅ Keep
├── appointments.api.test.ts           ✅ Keep
├── compliance-checklist.api.test.ts   ✅ Keep
├── compliance-revenue.api.test.ts     ✅ Keep
└── settings-branding.api.test.ts      ✅ Keep
```

### DB Package Tests
```
packages/db/src/test/
├── setup.ts                           ✅ Keep
├── smoke.test.ts                      ✅ Keep
├── appointment-reminders.test.ts      ✅ Keep
├── invoice-branding.test.ts           ✅ Keep
├── tax-compliance-settings.test.ts    ✅ Keep
└── travel-models.test.ts              ✅ Keep
```

### Files That Should NOT Exist Yet
```
❌ apps/web/src/test/settings-profile.api.test.ts       (you need to create)
❌ apps/web/src/test/settings-travel.api.test.ts        (you need to create)
❌ apps/web/src/test/settings-tax-compliance.api.test.ts (you need to create)
❌ apps/web/e2e/settings.spec.ts                        (you need to create)
❌ packages/lib/src/validation/validation.test.ts       (you need to create)
```

---

## Starting Fresh - Your TODO List

Once you have a clean workspace, create files IN THIS ORDER:

### Phase 1: Validation Unit Tests (Easiest)
```bash
# Create the test file
touch packages/lib/src/validation/validation.test.ts

# Copy the example from JULES_TEST_TROUBLESHOOTING.md
# Test it works:
pnpm --filter @myoflow/lib test
```

### Phase 2: One API Test at a Time
```bash
# Start with profile (simplest)
touch apps/web/src/test/settings-profile.api.test.ts

# Copy the template from JULES_TEST_TROUBLESHOOTING.md
# Modify for profile endpoint
# Test it works:
pnpm --filter web test settings-profile.api.test.ts
```

### Phase 3: Add More API Tests
Only after profile test is working:
- `settings-travel.api.test.ts`
- `settings-tax-compliance.api.test.ts`
- `settings-system.api.test.ts`

### Phase 4: E2E Tests (Last)
```bash
mkdir -p apps/web/e2e
touch apps/web/e2e/settings.spec.ts

# Test with:
pnpm --filter web test:e2e
```

---

## Common Reset Scenarios

### "I have merge conflicts"
```bash
# Abort any merge
git merge --abort

# Reset to clean state
git reset --hard main
```

### "My tests are interfering with each other"
```bash
# Clear Vitest cache
rm -rf apps/web/node_modules/.vitest
rm -rf packages/db/node_modules/.vitest

# Re-run tests
pnpm --filter web test:run
```

### "I get 'module not found' errors"
```bash
# Reinstall dependencies
rm -rf node_modules
pnpm install

# Rebuild packages
pnpm build
```

### "Git says I have changes but I don't see them"
```bash
# Show what's actually changed
git diff

# Show untracked files
git status --short

# Remove everything untracked
git clean -fd
```

---

## Safe Reset Checklist

Before running `git reset --hard`:

- [ ] I've saved any code I want to keep elsewhere
- [ ] I've checked `git status` to see what will be deleted
- [ ] I understand this CANNOT be undone
- [ ] I'm okay losing ALL uncommitted work

After reset:

- [ ] `git status` shows clean working tree
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm build` passes
- [ ] `pnpm --filter web test:run` passes (47 tests)
- [ ] `pnpm --filter db test` passes (54 tests)

---

## If You're REALLY Stuck

**Nuclear Option - Complete Reinstall:**
```bash
# 1. Delete your entire local repo
cd ~/
rm -rf MyoFlow

# 2. Clone fresh from GitHub
git clone <repo-url> MyoFlow
cd MyoFlow

# 3. Install dependencies
pnpm install

# 4. Verify everything works
pnpm typecheck && pnpm lint && pnpm build
```

---

## What "reset_all" Tool Actually Does

If you have a `reset_all` tool in your environment, it probably:
- Runs `git reset --hard`
- Runs `git clean -fd`
- Clears node_modules
- Reinstalls dependencies

If it's giving errors, try the manual steps above instead.

---

## Need Help?

**Tell me exactly what you see:**

```bash
# Run this and share the output:
git status
ls -la apps/web/src/test/
pnpm --filter web test:run 2>&1 | head -50
```

Then I can give you exact commands to fix your specific situation.

---

## Remember: Coffee → Muffins is Fine!

The goal is working tests, not perfect tests. Start with ONE test file, get it passing, then add more. Don't try to create all test files at once.

**One file at a time. One test at a time. Get it green, then move on.**
