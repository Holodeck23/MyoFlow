# Jules (Google AI Agent) - Workspace Reset Instructions

## Understanding Jules Environment

Jules runs in **temporary Google Cloud VMs** - each task gets a fresh environment. This is DIFFERENT from a local development environment.

---

## How to Get a Clean State in Jules

### Option 1: Start a New Task (Recommended)
Jules automatically provides a clean environment for each new task.

**Steps:**
1. Cancel/complete your current Jules task
2. Start a fresh task with clear instructions
3. Jules will spin up a new VM with a clean state

**Example Fresh Task:**
```
Task: Create API tests for MyoFlow settings endpoints

Requirements:
1. Create test file: apps/web/src/test/settings-profile.api.test.ts
2. Follow the pattern in apps/web/src/test/settings-branding.api.test.ts
3. Test GET returns profile data
4. Test PUT updates profile with valid data
5. Test PUT returns 400 for invalid Austrian VAT format
6. Run tests and verify they pass

Reference files:
- apps/web/app/api/settings/profile/route.ts (endpoint to test)
- apps/web/src/test/settings-branding.api.test.ts (working example)
- apps/web/src/lib/shared-helpers.ts (ensureTherapistAccount function)
```

### Option 2: Update Environment Snapshot
If your environment setup is wrong:

1. Go to Jules repository settings
2. Update your environment setup script
3. Click **"Run and Snapshot"**
4. This creates a fresh snapshot for future tasks
5. Start a new task - it will use the new snapshot

### Option 3: Clear Environment Configuration
If you have a corrupted environment setup:

1. Remove any custom setup scripts
2. Let Jules auto-detect environment from repository
3. Start a new task

---

## Common Jules Issues & Solutions

### Issue: "I created files but they're causing errors"

**Solution:** Jules works through Git - any files created should be in a PR

```
1. Check Jules's pull request
2. Review the files created
3. If they're wrong, close the PR
4. Start a new Jules task with corrected instructions
```

### Issue: "Tests are failing in my Jules task"

**Diagnosis Steps:**
1. Check the Jules task log - what's the actual error?
2. Is it a mock issue? Missing dependency? Import error?
3. Share the specific error message

**Quick Fix:**
```
Cancel current task and start new one with:

"Fix the test failures in my previous task. The error is:
[paste error message here]

The issue is likely:
- Missing mock for user.upsert in ensureTherapistAccount
- See apps/web/src/test/settings-branding.api.test.ts line 120-124 for correct pattern"
```

### Issue: "Jules keeps making the same mistake"

**Solution:** Be more specific in task description

**Before (Vague):**
```
Create tests for settings endpoints
```

**After (Specific):**
```
Create tests for apps/web/app/api/settings/profile/route.ts

Mock setup requirements:
1. Mock auth() from '@/lib/auth'
2. Mock prisma from '@myoflow/db' with these methods:
   - user.findUnique
   - user.upsert (critical for ensureTherapistAccount)
   - therapist.findFirst
   - therapist.findUnique (critical for ensureTherapistAccount)
   - therapist.update
   - therapist.create

3. Use vi.hoisted() for mocks (must be before imports)
4. Follow exact pattern from apps/web/src/test/settings-branding.api.test.ts

Test cases needed:
- GET returns 200 with profile data
- PUT returns 200 and updates businessName
- PUT returns 400 for invalid VAT number (not 500!)
- PUT increments settingsVersion

Run: pnpm --filter web test settings-profile.api.test.ts
```

---

## Jules Task Best Practices

### 1. One Endpoint at a Time
```
✅ GOOD: "Create tests for profile settings endpoint"
❌ BAD: "Create tests for all settings endpoints"
```

### 2. Provide Reference Files
```
"Follow the pattern in apps/web/src/test/settings-branding.api.test.ts
Test the endpoint in apps/web/app/api/settings/profile/route.ts"
```

### 3. Specify Success Criteria
```
"Tests should:
1. Pass when run with: pnpm --filter web test:run
2. Follow existing mock pattern from settings-branding.api.test.ts
3. Return 400 (not 500) for validation errors
4. Have >80% coverage"
```

### 4. Include Context Files
```
"Read these files first:
- apps/web/src/test/settings-branding.api.test.ts (working example)
- apps/web/src/lib/shared-helpers.ts (ensureTherapistAccount implementation)
- apps/web/vitest.config.ts (test configuration)
- .agent-os/handoffs/JULES_TEST_TROUBLESHOOTING.md (guidelines)"
```

---

## Jules Environment Setup Script

If you need custom environment setup, create `.jules/setup.sh`:

```bash
#!/bin/bash
set -e

# Install dependencies
pnpm install

# Setup test database
export DATABASE_URL="postgresql://user:pass@localhost:5432/test_db"

# Run migrations
pnpm --filter db prisma migrate deploy

# Build packages
pnpm build

# Verify setup
pnpm typecheck
pnpm lint

echo "✅ Environment ready"
```

Then in Jules repository settings:
1. Add this setup script
2. Click "Run and Snapshot"
3. Future tasks will use this environment

---

## Debugging Jules Tasks

### Check Task Progress
1. Open Jules dashboard
2. View task logs
3. Check PR if task completed
4. Review test output

### Read Error Messages
Jules shows you the actual errors. Common ones:

**Error:** `Cannot read properties of undefined (reading 'upsert')`
**Cause:** Missing mock for `user.upsert`
**Fix:** Add to task: "Ensure mockPrisma.user.upsert is defined in hoisted mock"

**Error:** `Module not found: @myoflow/db`
**Cause:** Import path wrong
**Fix:** Add to task: "Import prisma from '@myoflow/db' not from relative path"

**Error:** `Expected 200, received 401`
**Cause:** Missing auth mock
**Fix:** Add to task: "Mock auth() to return { user: { email: 'test@example.com' }}"

---

## Reset Checklist for Jules

Since Jules runs in VMs, you don't "reset" like a local environment. Instead:

- [ ] Cancel any stuck/failed tasks
- [ ] Review PR from completed tasks (close if wrong)
- [ ] Start a NEW task with clearer instructions
- [ ] Reference working examples in task description
- [ ] Specify exact files to create/modify
- [ ] Include success criteria (which tests to run)
- [ ] Mention any errors from previous attempt

---

## Example: Starting Fresh After Failed Test Task

**Scenario:** Jules created tests but they're failing with mock errors

**New Task Instructions:**
```
Previous task created apps/web/src/test/settings-profile.api.test.ts but tests fail with:
"TypeError: Cannot read properties of undefined (reading 'upsert')"

Please fix by:

1. Open apps/web/src/test/settings-profile.api.test.ts
2. Compare mock setup to working example: apps/web/src/test/settings-branding.api.test.ts
3. The working example has this pattern at line 6-16:
   - vi.hoisted() for mockPrisma
   - Includes user.upsert in the mock object
4. Add missing user.upsert mock
5. Add missing therapist.findUnique mock
6. Update beforeEach to set these mocks (see line 120-135 in settings-branding test)
7. Run: pnpm --filter web test settings-profile.api.test.ts
8. Verify all tests pass

Files to modify:
- apps/web/src/test/settings-profile.api.test.ts

Reference:
- apps/web/src/test/settings-branding.api.test.ts (working example)
- .agent-os/handoffs/JULES_TEST_TROUBLESHOOTING.md (mock pattern guide)
```

---

## Still Stuck?

**For Jules tasks, provide:**
1. The exact task description you gave Jules
2. The error message from Jules task log
3. Which file Jules created/modified
4. What you expected vs what happened

**Format:**
```
Jules Task: "Create profile settings tests"

Error from Jules log:
[paste exact error here]

File created: apps/web/src/test/settings-profile.api.test.ts

Expected: Tests pass
Actual: TypeError about upsert
```

Then I can give you exact task instructions to fix it.

---

## Key Difference: Jules vs Local Development

**Local Dev (You):**
- Work on your machine
- Reset by deleting files, running git reset
- State persists between sessions

**Jules (Google AI Agent):**
- Works in temporary Google Cloud VMs
- Each task gets fresh environment automatically
- No manual "reset" needed - just start new task
- State is captured in PRs, not local files

**Implication:**
When you say "reset workspace", you mean **"start a new Jules task with a clean slate"** - just cancel the old task and create a new one with better instructions.
