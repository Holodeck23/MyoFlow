# Documentation Index

**Last Updated:** November 8, 2025

## 📖 Start Here

- **[README.md](README.md)** - Project overview, setup, tech stack
- **[CLAUDE.md](CLAUDE.md)** - AI agent session notes (primary context)
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Development workflow and guidelines
- **[COORDINATION.md](COORDINATION.md)** - Multi-agent task coordination and mission status

## 📋 For Developers

### Guides
- **[Git Workflow](docs/guides/git-workflow.md)** - Branching strategy, commits, PRs

### Decisions
- **[Decision Log](docs/decisions/decision-log.md)** - Architectural decisions history

### QA & Testing
- **[Manual Test Script](docs/qa/manual-test-script.md)** - Step-by-step QA procedures
- **[Testing Instructions](docs/qa/testing-instructions.md)** - How to run tests

## 🤖 For AI Agents

**Primary Context Files:**
1. **CLAUDE.md** - Session history, achievements, known issues
2. **COORDINATION.md** - Active mission, task progress, agent status
3. **DEVELOPMENT.md** - Workflow, coordination, quality gates
4. **.agent-os/tasks/** - Active task tracking
5. **.agent-os/specs/** - Feature specifications

**Task Coordination:**
- Current tasks: `.agent-os/tasks/CODEX-TASK-LIST.md`
- Completed specs: `.agent-os/specs/[date]/`

## 📦 Archive

Historical documentation moved to preserve context:
- **[archive/2025-10/](archive/2025-10/)** - October sprint docs, audits, planning
- **[archive/2025-09/](archive/2025-09/)** - September development docs (if needed)

## 🔗 Quick Links

- **CI/CD:** GitHub Actions
- **Database:** Prisma schema in `packages/db/schema.prisma`
- **Environment:** `.env.example` for required variables
- **Build Commands:** `pnpm typecheck && pnpm lint && pnpm build`
