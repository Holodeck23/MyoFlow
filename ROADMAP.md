# MyoFlow Roadmap

_Last updated: 2025-09-18_

## Snapshot
- MVP core (auth, clients, appointments, invoices) shipped; calendar modularization and webpack cleanup still pending.
- Next.js 14.2.13 is live, but a legacy 14.0.4 eslint config and Prisma transpilation keep the dev server fragile.
- CI scaffolds Postgres/Redis yet skips tests; Vitest needs an automated DATABASE_URL handshake.
- Calendar UI sits in a single page with TODOs—refactors are planned across focused branches.
- Documentation remains spec-first via Agent OS; redundant summaries are being consolidated into this file and `DECISION_LOG.md`.

## Product Track
- Sprint 1.1–1.4 delivered auth, client management, scheduling, and Austrian invoice PDFs.
- **Calendar Experience (In Flight):** modularize dashboard calendar, add travel timeline, unblock API integration.
- **Travel-Aware Scheduling:** enhance routing, block conflicts across locations, surface surcharges.
- **User Settings Dashboard:** expand therapist profile defaults, localization, and legal text management.
- **After MVP:** marketing mini-sites, retention campaigns, and Austrian regulatory polish follow once infrastructure stabilizes.

## Technical Track
- **Foundation (Complete):** Turborepo, pnpm workspaces, Prisma schema, libsodium security, seed data.
- **Next Priorities:**
  - Finish Next.js upgrade (align lint configs, drop Prisma from transpilePackages, purge stale `.next`).
  - Standardize TypeScript configs via `tsconfig.base.json` + package-specific includes.
  - Stabilize CI by provisioning databases, running Vitest, and pruning unused services.
- **Future Enhancements:** shared env schema validation, thin data-access layer for API calls, Playwright smoke suite with CI toggle.

## Execution Rhythm
- Specs live in `.agent-os/specs/`; prune or refresh before implementation and capture decisions in `DECISION_LOG.md`.
- All work starts from updated `main` in dedicated worktrees; keep active branches limited (Next.js cleanup, CI/test hardening, frontend hygiene).
- Each session ends with an `AGENT_ACTIVITY_LOG.md` entry outlining delivered work and explicit hand-offs.

## Reference Checklist
- ✅ Finish Next.js/config cleanup → unblock dev server and CI builds.
- ✅ Land CI + Vitest reliability branch → tests run locally and in GitHub Actions.
- ✅ Frontend hygiene branch → calendar modularized, unused dashboard components removed, docs aligned.
- 📌 Archive or refresh stale specs once branches merge; keep `.agent-os/meta/agents.md` as the coordination single source.
