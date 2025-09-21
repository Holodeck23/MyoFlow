# 🎯 Active Shared Context

This document is the single source of truth for high-priority, cross-cutting concerns that all agents must be aware of.

- **Webpack runtime error** (`Cannot find module './24.js'`) remains unresolved after tsconfig/nx adjustments. Investigate lingering Next.js 14.0.4 artifacts, Prisma transpilation, and dev-server caching.
- **Calendar view branch** (`feat/calendar-view-implementation`) merges the new dashboard calendar and should replace the appointments list route with a redirect once conflicts are resolved.
- **Locale coordination** – `LocaleProvider` owns `myoflow-locale`; all UI toggles should use the shared context (`useLocale` / `useTranslation`).
- **Database tests** – Vitest suites depend on `DATABASE_URL`; ensure CI runners set this env var and call `prisma.$disconnect()` on teardown.
- **User settings backend** – Prisma schema + migration for travel/tax/preferences committed; API endpoints `/api/settings/overview` and `/api/settings/tax-compliance` ready for frontend integration.
- **2025-09-18 – Codex:** `codex/language-system-cleanup` active; layout/sidebar cleaned, dashboard pages under audit for remaining hardcoded German strings.