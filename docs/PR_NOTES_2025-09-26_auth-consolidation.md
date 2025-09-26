# PR: Auth consolidation, demo gating, dynamic admin, and E2E smoke tests

## Summary
This PR consolidates NextAuth to a single source, strengthens runtime discipline with a Prisma singleton, gates demo logins behind an environment flag, resolves admin dynamic build warnings, and adds minimal E2E smoke tests.

## Changes
- Auth
  - Consolidate NextAuth v5 to apps/web/src/lib/auth.ts; legacy apps/web/lib/auth.ts re-exports
  - Switch to Prisma singleton (import { prisma } from '@myoflow/db') in auth and admin routes
  - Tighten TS path aliases to prefer src and add explicit '@/app/*'
- Security / Demo Gating
  - Gate test user + 'demo' password and admin demo login with AUTH_ENABLE_DEMO, disabled by default and never in production
  - Added AUTH_ENABLE_DEMO=false to .env.example with docs
- Admin
  - Mark admin pages and API routes dynamic = 'force-dynamic' to acknowledge cookies() usage and silence build warnings
- Build / Config
  - Transpile @myoflow/db in apps/web/next.config.js
- Tests
  - Playwright: enable AUTH_ENABLE_DEMO in test env
  - Add smoke tests: credentials sign-in and admin demo login
- Docs
  - CLAUDE.md: session update (Sept 26, 2025)
  - DECISION_LOG.md: new entry for auth consolidation + gating
  - DEVELOPMENT.md: env details and E2E run docs
  - AGENT_COORDINATION.md and agents.md: session log and coordination updates

## Rationale
- Remove ambiguity around auth handlers and avoid duplicate configs
- Reduce Prisma client churn in dev/HMR and standardize server-side DB access
- Ensure demo backdoors are opt-in only and never active in production
- Make admin dynamic behavior explicit to keep Next.js build clean

## Testing
- pnpm typecheck && pnpm lint && pnpm build passed locally
- Playwright e2e executed; some unrelated appointments tests are flaky due to assumptions. Smoke tests for auth and admin demo pass when AUTH_ENABLE_DEMO=true

## Follow-ups (optional)
- Migrate admin cookie-based auth to NextAuth RBAC to reduce surface area
- Stabilize/flaky appointments e2e tests and align selectors with current UI
- Consider pinning next-auth version for the beta or moving to stable v5 once available

## Env
- Add to .env.local for demo flows in dev only:
  - AUTH_ENABLE_DEMO=true