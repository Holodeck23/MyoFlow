# Specification: Beta Readiness Remediation (Appointments → Invoices)

**Author:** Codex (GPT-5)  
**Date:** 2025-10-21  
**Status:** Draft

## 1. Summary
Perplexity’s end-to-end “beta user” QA uncovered blocker-level defects across the core business workflow (clients → appointments → invoices → exports). This spec defines the scope, success criteria, and implementation boundaries required to restore those workflows to production-readiness on the `fix/auth-onboarding-hygiene` foundation. The work spans calendar authoring, invoicing UX, client data completeness, navigation polish, and regression coverage.

## 2. Goals
- Reinstate a functional appointment creation/edit flow integrated with the dashboard calendar.
- Deliver an invoice authoring experience that accepts valid data (date picker, inline validation) and successfully POSTs to `/api/invoices`, generating PDFs/exports downstream.
- Ensure client records capture compliant address data and that encrypted notes persist correctly.
- Replace fragile interactions (e.g., raw `window.confirm`) with first-class UI/UX patterns that log audit events.
- Stabilize navigation (sidebar/footer) and dashboard metrics so primary links work without manual URL hacking.
- Provide test/QA artifacts verifying workflows 1–4 of the QA script in both EN/DE.

## 3. Non-Goals
- Building team/multi-practitioner features (out of scope for current beta).
- Expanding accounting export capabilities beyond ensuring the UI is reachable and works with newly generated invoices.
- Implementing full calendar drag-and-drop or external calendar sync (basic creation/edit suffices).
- Replacing demo/test data seeding strategy beyond what is necessary for the above goals.

## 4. Background & Inputs
- Source QA report: Perplexity Browser Agent – October 2025 beta assessment (shared by ZOD).
- Existing architecture: Next.js 14 app (client-heavy dashboard) with Prisma backend and `@myoflow/lib` for compliance logic.
- Recent auth/onboarding hardening landed on `fix/auth-onboarding-hygiene`; onboarding flows are now functional.
- Client API already supports address fields and note encryption, but frontend forms/UX never consumed the data.

## 5. Functional Requirements

### 5.1 Calendar & Appointments
1. Implement appointment authoring (create/edit/cancel) accessible from `/dashboard/calendar`:
   - “+ New appointment” button opens a modal (or navigates to a new page) with fields for client, service, location, start/end, travel buffer, and notes.
   - Inline validation for overlapping appointments (surface `/api/appointments` 409 errors).
   - Persist via existing POST endpoint; optimistic UI optional but success toast and calendar refresh required.
2. Days in the month/week view must respond to a click (focus selected date) and double-click (open create modal with seeded date).
3. Appointment detail view (`/dashboard/appointments/[id]`) must expose edit/delete buttons that reuse shared components.
4. Provide minimal seed data (services/locations) for new dev accounts to exercise the flow easily (update seeding scripts or onboarding defaults).

### 5.2 Invoicing
1. Replace the static date input with the shared date picker (or an accessible equivalent) ensuring locale-aware formatting and timezone correctness.
2. Permit manual entry of service date, defaulting to today, and enforce min/max (reject future dates with compliance warning; future-dated invoicing remains out of scope).
3. Surface API validation errors inline (field-level if available; otherwise toast with details).
4. Successful creation redirects to invoice detail and PDF generation remains functional (update smoke tests to cover).

### 5.3 Client Data & Notes
1. Extend create/edit client forms with street, postal code, city, and country fields mapped to the existing API and preserved during edit/load; mark them required for invoices and block invoice creation if missing.
2. Ensure notes use `body` payload (not `bodyEnc`) and show confirmation/error to the therapist.
3. Introduce reusable confirmation dialog component for destructive actions (client delete, upcoming appointment delete), replacing `window.confirm`.

### 5.4 Navigation & Dashboard Polish
1. Audit sidebar/footer links: remove `href="#"` placeholders, gate future items with `disabled` tooltips, and ensure active routes match the page.
2. Fix routing stalls where clicking sidebar items fails to update the main content (typically due to stale client-only components).
3. Replace dashboard metric placeholders with live counts (appointments today, total clients, etc.) sourced from APIs or server components.
4. Resolve translation gaps discovered in QA (nav labels, error messages) and verify both EN/DE render without key fallbacks.

## 6. Technical Requirements
- Maintain separation between server/client components; prefer server components for data fetching when practical (dashboard metrics).
- Calendar modal should reuse existing `@/components/ui` primitives to stay consistent with design system.
- Confirmation dialog must integrate with audit logging (trigger `logAudit` where applicable).
- Ensure all new inputs leverage Zod validation on the server; mirror client-side with lightweight checks for UX.
- Update manual seeds or onboarding defaults via `packages/db/prisma/seed.ts` if required.

## 7. QA & Testing
- Update `MANUAL_QA_TEST_SCRIPT.md` section for workflows 1–4 reflecting new UX steps.
- Add Playwright smoke covering signup → create client (with address) → create appointment → create invoice → download PDF.
- Verify bilingual support by switching languages during QA (translation keys fixed).
- Collect console/network logs for each workflow during regression run; no uncaught errors allowed.

## 8. Deliverables & Artifacts
- Spec-compliant implementation branch `beta-readiness/appointments-invoices` (or equivalent).
- Updated documentation: `KNOWN_ISSUES.md` (new blockers cleared), `.agent-os/meta/SHARED_CONTEXT.md`, and a QA summary.
- PR checklist ensuring lint/typecheck/build/Playwright pass.
- Release notes summarizing restored workflows for stakeholders.

## 9. Open Questions (Resolved 2025-10-21)
- **Appointment drag-and-drop rescheduling:** Deferred; focus on stable CRUD for beta.
- **Client addresses for invoicing:** Mandatory; block invoices when address data missing.
- **Future-dated invoices:** Disallow; restrict service dates to today/past with compliance messaging.

Status may be promoted to “Approved” after incorporating these decisions.
