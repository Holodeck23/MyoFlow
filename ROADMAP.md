# MyoFlow Roadmap

_Last updated: 2025-09-18_

## Snapshot
- MVP core (auth, clients, appointments, invoices) shipped; calendar modularization and webpack cleanup still pending.
- Next.js 14.2.13 is live, but a legacy 14.0.4 eslint config and Prisma transpilation keep the dev server fragile.
- CI scaffolds Postgres/Redis yet skips tests; Vitest needs an automated DATABASE_URL handshake.
- Calendar UI sits in a single page with TODOs—refactors are planned across focused branches.
- Documentation remains spec-first via Agent OS; redundant summaries are being consolidated into this file and `DECISION_LOG.md`.

## Product Track
- Detailed clinic/AI roadmap now lives in [docs/clinic-ai-roadmap.md](docs/clinic-ai-roadmap.md) for phased planning.
- Sprint 1.1–1.4 delivered auth, client management, scheduling, and Austrian invoice PDFs.
- **Calendar Experience (In Flight):** modularize dashboard calendar, add travel timeline, unblock API integration.
- **Travel-Aware Scheduling:** enhance routing, block conflicts across locations, surface surcharges.
- **User Settings Dashboard:** expand therapist profile defaults, localization, and legal text management.
- **After MVP:** marketing mini-sites, retention campaigns, and Austrian regulatory polish follow once infrastructure stabilizes.

## Technical Track
- **Foundation (Complete):** Turborepo, pnpm workspaces, Prisma schema, libsodium security, seed data.
- **Current Status:** Calendar implementation rescued, CI stabilized, Google Maps integration complete
- **Next Priorities:**
  - Frontend hygiene: Modularize 500+ line calendar page into components/hooks
  - Remove dead code: CSVExportManager, ServiceRateManager, DashboardNav (unused)
  - Implement thin data layer: Replace manual fetch with API abstraction
  - Add test infrastructure: Docker Postgres, environment validation, Vitest integration
- **Technical Debt:**
  - 10 files with hardcoded button CSS need component conversion
  - Minor ESLint warnings for useEffect dependencies (non-blocking)
  - Next.js config warnings for transpilePackages (cosmetic)
  - Client API response format needs harmonization (phone/email display issues)

## Execution Rhythm
- Specs live in `.agent-os/specs/`; prune or refresh before implementation and capture decisions in `DECISION_LOG.md`.
- All work starts from updated `main` in dedicated worktrees; keep active branches limited (Next.js cleanup, CI/test hardening, frontend hygiene).
- Each session ends with an `AGENT_ACTIVITY_LOG.md` entry outlining delivered work and explicit hand-offs.

## Reference Checklist
- ✅ Finish Next.js/config cleanup → unblock dev server and CI builds.
- ✅ Land CI + Vitest reliability branch → tests run locally and in GitHub Actions.
- ✅ Frontend hygiene branch → calendar modularized, unused dashboard components removed, docs aligned.
- 📌 Archive or refresh stale specs once branches merge; keep `.agent-os/meta/agents.md` as the coordination single source.
