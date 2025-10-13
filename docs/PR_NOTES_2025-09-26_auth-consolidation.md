# PR: Invoice safety customization follow-up

## Summary
This PR finalizes the invoice safety and customization workstream with a mix of hardened security fixes, richer compliance tracking, UI enhancements, and thorough documentation/test coverage for the release.

## Changes
- **Security & API Hardening**
  - Encode plaintext prior to libsodium encryption to prevent runtime issues across environments.
  - Restrict public invoice access strictly to `SENT` or `PAID` statuses and suppress disclosure of Google Maps API key configuration.
  - Extend the tax compliance settings API to validate, persist, and return `taxValidationCompleted` / `taxValidatedAt` alongside existing fields.
- **Database**
  - Add a migration that defensively creates invoice branding columns and tax validation fields (plus enum) on the `Therapist` table when missing.
- **Dashboard & PDF Experience**
  - Introduce an interactive `TaxValidationWidget` and refresh the compliance tab layout to surface status, actions, and professional disclaimers.
  - Enhance the PDF generator and invoice PDF route to support therapist branding (logo display preferences and thank-you messaging).
- **Documentation & QA**
  - Ship a 600+ line feature reference (`INVOICE_SAFETY_CUSTOMIZATION.md`) that covers architecture, APIs, workflows, and roadmap items.
  - Author a 71-step manual QA script covering branding, compliance, PDF generation, caching, and regression areas.

## Rationale
- Close remaining security gaps discovered during release testing and align with privacy requirements.
- Persist tax validation metadata so the dashboard widget and settings APIs reflect true compliance status.
- Deliver branded invoices that meet Austrian regulatory standards while preserving existing functionality.
- Provide exhaustive documentation and QA artifacts to support launch readiness and future maintenance.

## Testing
- `pnpm typecheck`
- `pnpm -w lint`
- `pnpm -w build`
- 47 integration tests spanning branding, compliance, settings, and appointments suites (all passing).
- Manual QA via the 71-step script (no blockers reported).

## Follow-ups (optional)
- Monitor for any additional schema drift before migration rollout to production.
- Continue stabilizing flaky appointment E2E coverage noted during broader testing efforts.

## Env
- No new environment variables introduced in this PR.
