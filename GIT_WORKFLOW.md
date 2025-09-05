# Git Workflow Guide for MyoFlow

## 🌳 Branch Strategy

### Branch Types
- `main` - Production-ready code, always deployable
- `feature/[name]` - New features (e.g., `feature/client-management`)
- `fix/[issue]` - Bug fixes (e.g., `fix/invoice-pdf-generation`)
- `hotfix/[critical]` - Critical production fixes

### Branch Protection Rules (Recommended)
Go to: **Settings → Branches → Add rule** for `main`:
- ✅ Require a pull request before merging
- ✅ Require status checks to pass before merging
- ✅ Require up-to-date branches before merging
- ✅ Include administrators (force yourself to use PRs too!)

## 🔄 Daily Workflow

### Starting New Work
```bash
# Always start from updated main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name

# Work, commit, repeat
git add .
git commit -m "feat: add something awesome"
```

### Before Every Commit
```bash
# Always test before committing
pnpm typecheck    # Type safety
pnpm lint         # Code quality
pnpm build        # Build verification

# Only commit if all pass
git commit -m "feat: your changes"
```

### Creating Pull Requests
1. Push your branch: `git push origin feature/your-feature`
2. Go to GitHub → Create Pull Request
3. Fill in the template:
   - What changed?
   - Why did it change?
   - How to test it?
   - Suggest screenshots if appropriate
4. Wait for CI to pass ✅
5. Merge when ready

### After Merge
```bash
# Clean up your local branches
git checkout main
git pull origin main
git branch -d feature/your-old-feature
```

## 📝 Commit Message Format

### Use Conventional Commits
```
<type>: <description>

<optional body>

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Types
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code formatting (no logic changes)
- `refactor:` Code restructuring (no new features)
- `test:` Adding tests
- `chore:` Build process, dependencies

### Examples
```bash
# Good
git commit -m "feat: add client health flags encryption with libsodium"

# Also good
git commit -m "fix: resolve PDF generation memory leak in invoice system

- Update Puppeteer page cleanup logic
- Add proper browser instance disposal  
- Reduce memory usage by 40%

Fixes issue with high memory usage during bulk invoice generation.

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Bad
git commit -m "fix stuff"
git commit -m "wip"
git commit -m "asdf"
```

## 🔍 Reviewing Your Own PRs

Even when working solo, create PRs because:
- CI runs and catches issues
- Forces you to document changes
- Creates a history of what you built when
- Good practice for when you collaborate

## 🧹 Repository Maintenance

### Weekly Cleanup
```bash
# Remove merged branches
git branch --merged main | grep -v main | xargs git branch -d

# Update dependencies
pnpm update

# Check for security vulnerabilities
pnpm audit
```

### Monthly Tasks
- Review open issues and close stale ones
- Update documentation if features changed
- Check if dependencies need major version bumps
- Review and update .gitignore if needed

### Before Major Features
```bash
# Create a backup tag
git tag -a v0.1.0 -m "Backup before major feature work"
git push origin v0.1.0
```

## 🚨 Emergency Procedures

### "Oh No, I Committed to Main by Accident"
```bash
# If you haven't pushed yet
git reset --soft HEAD~1  # Undo last commit but keep changes
git checkout -b fix/accidental-commit
git commit -m "fix: move accidental commit to proper branch"

# Create PR as normal
```

### "I Need to Undo My Last Commit"
```bash
# Undo last commit, keep changes
git reset --soft HEAD~1

# Undo last commit, lose changes (BE CAREFUL!)
git reset --hard HEAD~1
```

### "My Branch is Behind Main"
```bash
# Update your feature branch with latest main
git checkout main
git pull origin main
git checkout feature/your-branch
git merge main  # or git rebase main for cleaner history
```

## 🎯 Solo Development Best Practices

1. **Always Use Branches** - Even for small changes
2. **Write Detailed PRs** - Your future self will thank you
3. **Let CI Run** - Don't merge failing builds
4. **Keep PRs Small** - Easier to review and debug
5. **Tag Important Versions** - Mark milestones
6. **Document Breaking Changes** - In commit messages and PRs

## 🤝 Preparing for Collaboration

When you're ready to work with others:
- Set up branch protection rules
- Create issue templates
- Add a CONTRIBUTING.md file  
- Set up code review requirements
- Document your architecture decisions

## 📊 Useful Git Commands for Maintenance

```bash
# See all branches
git branch -a

# See commit history with graph
git log --oneline --graph --all

# See what changed in last 10 commits
git log --oneline -10

# Find when a bug was introduced
git bisect start

# See repository statistics
git shortlog -sn --all

# Clean up everything
git clean -fd
git reset --hard HEAD
```

Remember: Git is just a tool to help you track and share your work. Don't stress about being perfect - you're already doing great! 🚀