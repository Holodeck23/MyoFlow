# MyoFlow Development Handbook

_Last updated: 2025-09-18_

## Branching & Environments
- `main` always deployable; work from updated `main` in the appropriate Git worktree before branching.
- Preferred prefixes: `feature/`, `fix/`, `refactor/`, `chore/`, `hotfix/` (critical prod fixes only).
- Keep active branches focused and short-lived; tie large efforts to specs in `.agent-os/specs/` and note blockers in `DECISION_LOG.md`.
- After merge, switch back to `main`, pull, and delete the completed branch locally.

## Workflow Checklist
- Start day by reviewing `AGENT_ACTIVITY_LOG.md`, open tasks, and the relevant spec tasks list.
- Create a new branch: `git checkout main && git pull && git checkout -b <prefix>/<slug>`.
- Build in small commits; prefer surgical changes aligned to the spec or task acceptance criteria.
- End sessions by running `pnpm typecheck && pnpm lint && pnpm build`, committing, pushing, and logging the hand-off.
- Keep PR descriptions crisp: what changed, why, test notes, screenshots if UI.

## Verification Gates
- **Before commit:** `pnpm typecheck`, `pnpm lint`, `pnpm build`, plus targeted tests (`pnpm test`, `pnpm test:e2e`) when applicable.
- **Before PR:** ensure acceptance criteria met, no console errors, responsive checks, and migrations tested if touched.
- **Before merge:** confirm CI green, branch rebased/fast-forwarded, and documentation updated (`ROADMAP.md`, specs, or README as needed).

## Commit & PR Standards
- Use Conventional Commits (`feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`).
- Detailed body optional but encouraged for multi-step work; include bullet summaries and note breaking changes.
- Example: `feat: add client health flag encryption` followed by bullets + co-author when pairing.
- Every PR should link back to its spec/task and include manual testing notes.

## Daily Rhythm
- **Morning (15 min):** check CI status, review blockers, align with specs/tasks, set branch plan.
- **During work:** maintain ≤3 concurrent TODOs, capture decisions in `DECISION_LOG.md`.
- **Evening (15 min):** run verification commands, commit/push, update `AGENT_ACTIVITY_LOG.md`, outline next steps.

## Maintenance Cadence
- Weekly: prune merged branches, run `pnpm update`, review open PRs/issues, sanity-check Docker/test fixtures.
- Monthly: reassess dependency majors, validate `.gitignore`, refresh environment docs, audit `ROADMAP.md`.
- Per sprint: review outstanding specs, archive or revise stale ones, and reconcile learnings into `DECISION_LOG.md`.

## Useful Commands
```
pnpm dev            # Run Next.js app + turborepo dev tasks
pnpm build          # Monorepo build
pnpm typecheck      # TypeScript checks
pnpm lint           # ESLint checks
pnpm test           # Vitest (requires DATABASE_URL)
pnpm test:e2e       # Playwright smoke suite (enable once configured)
pnpm docker:up      # Start Postgres + Redis
pnpm docker:down    # Stop containers
```

See `README.md` for project overview, `QUICK_START.md` for first-time setup, and `ROADMAP.md` for product + technical priorities.
