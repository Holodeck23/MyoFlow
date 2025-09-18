# 🤖 Multi-Agent Coordination Strategy

## Git Worktree Setup - September 18, 2025

### **Problem Solved:**
Parallel Claude/Codex sessions were creating schema conflicts, merge issues, and repository chaos. The Calendar Implementation Rescue Session demonstrated the need for proper agent coordination.

### **Solution: Git Worktrees**

**Workspace Structure:**
```
/Users/ZOD/Documents/GitHub/
├── MyoFlow/          # Original workspace (currently: chore/localize-translations)
├── MyoFlow-claude/   # Claude's dedicated workspace (main branch)
└── MyoFlow-codex/    # Codex's dedicated workspace (detached HEAD)
```

**Current Status:**
- ✅ **MyoFlow** - Codex doing translation sweep on `chore/localize-translations`
- ✅ **MyoFlow-claude** - Claude workspace ready on `main` branch
- ✅ **MyoFlow-codex** - Codex workspace ready (detached from current commit)

### **Coordination Rules:**

#### **Branch Management:**
- **Claude**: Creates feature branches from `main` in MyoFlow-claude workspace
- **Codex**: Works on assigned branches/tasks in MyoFlow-codex workspace
- **Conflicts**: Impossible during development (separate working directories)
- **Integration**: PR-based merging ensures clean integration

#### **Task Division:**
- **Claude**: Complex implementation, debugging, architecture decisions
- **Codex**: Systematic tasks, testing, code generation, analysis
- **Coordination**: Communicate through CLAUDE.md updates and GitHub issues

#### **Database Sharing:**
- Same `.env` file shared across worktrees
- Database migrations tested in one workspace before applying to others
- Schema changes coordinated through migrations only

### **Workflow Examples:**

**Claude Workflow:**
```bash
cd /Users/ZOD/Documents/GitHub/MyoFlow-claude
git checkout -b feat/new-feature
# Work on implementation
git commit && git push
# Create PR from MyoFlow-claude workspace
```

**Codex Workflow:**
```bash
cd /Users/ZOD/Documents/GitHub/MyoFlow-codex
git checkout main && git pull
git checkout -b codex/systematic-task
# Work on assigned task
git commit && git push
# Create PR from MyoFlow-codex workspace
```

### **Benefits Achieved:**
- ✅ **No merge conflicts** during active development
- ✅ **Clean separation** of agent responsibilities
- ✅ **Shared Git history** with isolated working files
- ✅ **Parallel development** without stepping on each other
- ✅ **Database consistency** with coordinated migrations

### **Lessons from Calendar Rescue Session:**
1. **Schema synchronization** must be coordinated (use `prisma db pull`)
2. **Single environment coordination** >> Parallel session chaos
3. **Git worktrees** prevent the branch conflicts we experienced
4. **Systematic debugging** can rescue any repository disaster
5. **PR-based integration** maintains code quality and coordination

---

**Last Updated:** September 18, 2025 - Post Calendar Implementation Rescue
**Status:** Active coordination with Codex translation sweep in progress