# MyoFlow Agent Coordination Guide

_Last updated: 2025-09-18 (Codex)_

## Core Roles
- **Claude (Implementation)** – Owns UX, client features, copy, and rapid UI iteration. Works primarily on `feature/myoflow-professional-branding` and downstream feature branches.
- **Codex (Infrastructure)** – Owns configuration, build+CI, data plumbing, and branch hygiene. Current focus: calendar view integration (`feat/calendar-view-implementation`), Next.js build stability, and database/Vitest reliability.

## Collaboration Workflow
1. **Specifications first** – Major features start with `/create-spec` in `.agent-os/specs/`, followed by `/create-tasks` before coding.
2. **Daily sync points** – Update `DECISION_LOG.md` for cross-agent architectural changes; use `SPRINT_*.md` for milestone status.
3. **Escalation** – Claude files infrastructure blockers with stack traces, environment details, attempted fixes, and repro steps. Codex reciprocates with implementation follow-ups when config work unblocks new UI/feature work.
4. **Handoffs** – Codex supplies implementation requirements (APIs, config flags) back to Claude via spec/task comments or inline notes inside PR descriptions.
5. **Activity Log** – Start each session by scanning the top entry in `AGENT_ACTIVITY_LOG.md`, and end each session by appending a new top-row that covers work done plus the next clear hand-off.

## Active Shared Context
- **Webpack runtime error** (`Cannot find module './24.js'`) remains unresolved after tsconfig/nx adjustments. Investigate lingering Next.js 14.0.4 artifacts, Prisma transpilation, and dev-server caching.
- **Calendar view branch** (`feat/calendar-view-implementation`) merges the new dashboard calendar and should replace the appointments list route with a redirect once conflicts are resolved.
- **Locale coordination** – `LocaleProvider` owns `myoflow-locale`; all UI toggles should use the shared context (`useLocale` / `useTranslation`).
- **Database tests** – Vitest suites depend on `DATABASE_URL`; ensure CI runners set this env var and call `prisma.$disconnect()` on teardown.

## Quick Reference
- **Primary packages**: `apps/web` (Next.js app), `packages/db` (Prisma schema + Vitest), `packages/lib` (shared Austrian compliance + i18n helpers).
- **Testing**: `pnpm test` delegates to Turbo. Database suites require seeded Postgres or test containers. Frontend relies on Playwright (TBD) and storybook (TBD).
- **CI Expectations**: Lint + typecheck + test; make sure changes do not expand build matrix without updating Turbo cache config (`turbo.json`).
- **When in doubt**: Update this file and `DECISION_LOG.md` to keep both agents aligned.
