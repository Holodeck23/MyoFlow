# Git Workflow

## Branch Strategy

- **`main`** - Production-ready code
- **`performance-optimization-sprint`** - Current active branch
- **Feature branches** - `feature/feature-name` or `fix/issue-name`

## Development Workflow

### 1. Create Feature Branch
```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

### 2. Development Cycle
```bash
# Make changes
# Run quality gates
pnpm typecheck && pnpm lint && pnpm build

# Commit changes
git add .
git commit -m "feat: your feature description

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 3. Push and PR
```bash
git push -u origin feature/your-feature-name
# Create PR via GitHub UI or CLI
```

## Commit Message Format

```
type: brief description

Optional longer description

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Code style/formatting
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance

## Quality Gates

Before every commit:
- ✅ TypeScript checks pass
- ✅ ESLint has no warnings
- ✅ Build succeeds
- ✅ Tests pass (when available)

## Current Branch Status

**Active:** `performance-optimization-sprint`
- MVP complete with Austrian compliance
- All quality gates passing
- Ready for production deployment

## Emergency Fixes

For critical production issues:
```bash
git checkout main
git checkout -b hotfix/issue-description
# Fix, test, commit
# PR directly to main
```