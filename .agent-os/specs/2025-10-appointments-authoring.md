# Micro-Spec: Appointment Authoring UX

**Author:** Codex  
**Date:** 2025-10-21  
**Status:** Draft (implements BR-1.1)

## 1. Objective
Deliver a first-class appointment creation/edit/delete experience inside `apps/web/app/dashboard/calendar` that unblocks the beta user workflow identified in `2025-10-beta-readiness`. The UX must be intuitive, bilingual, and backed by the `/api/appointments` endpoints.

## 2. User Flows

### 2.1 Create Appointment
1. Therapist clicks `+ New appointment` button or double-clicks a calendar day.
2. Modal opens with required fields:
   - Client (select, required)
   - Service (select, required)
   - Location (select, required)
   - Date (pre-filled from trigger, default today)
   - Start time, End time (time inputs; enforce end > start)
   - Optional: Notes (textarea), travel buffer toggle.
3. User submits → loading state → POST `/api/appointments`.
4. On success: modal closes, toast confirmation, calendar refreshes & focuses on created event.
5. On error: inline alert with validation message(s) from API (handle 400, 404, 409).

### 2.2 Edit Appointment
1. Therapist clicks existing event (from list or calendar).
2. Detail drawer/modal shows summary with `Edit` button.
3. Edit uses same form as create, pre-populated.
4. PATCH request to `/api/appointments/[id]` (to be implemented if missing) or reuse POST fallback (out of scope for now?).
   - For beta unblock we will focus on create + delete; edit may redirect to detail page with existing fields but not full patch.
5. Success reloads event; display toast.

### 2.3 Delete Appointment
1. Within detail view, `Delete` triggers confirmation dialog (reuse upcoming shared confirm component).
2. On confirm, DELETE `/api/appointments/[id]`.
3. Success toast; event removed from calendar/list.

## 3. Modal Layout
- Two-column grid on desktop:
  - Left column: Client/Service/Location selects, date/time pickers.
  - Right column: Travel buffer toggle + travel notes, general notes area.
- Mobile: stacked sections with sticky submit button.
- Buttons:
  - Primary: `Save appointment`
  - Secondary: `Cancel` (closes modal)
- Use `@/components/ui/Dialog` (Radix) for modal, `@/components/ui/Select` for dropdowns, `@/components/ui/TimeField` (create if needed).

## 4. Data Dependencies
- Fetch clients/services/locations:
  - Clients: `/api/clients` (already returning list)
  - Services: need endpoint? (confirm existing; otherwise create minimal GET `/api/services`).
  - Locations: same check (likely `/api/locations`).
- Provide fallback loader while fetching options.
- Consider storing options in SWR/React Query? current code uses `fetch` + state; follow existing pattern.

## 5. Validation & Error Handling
- Client/service/location required: display inline error under each field.
- Date/time:
  - Date required (`yyyy-MM-dd`).
  - Start/end times required; convert to ISO with therapist timezone (default Europe/Vienna).
  - End must be later than start; show helper text.
- Conflict (409) from API: show top-level alert `Termin überschneidet sich ...`.
- 400/404: show `common.error` message; log to console for debugging.

## 6. Internationalization
- All labels/messages use `t('calendarAppointment.*')`.
- Add EN/DE strings to dictionaries.
- Dates/time localization: `date-fns` & `Intl` for formatting.

## 7. Accessibility
- Modal traps focus, accessible labels via `aria-labelledby`.
- Keyboard accessible selects/time inputs.
- Ensure toast announcements via existing system.

## 8. Implementation Tasks
1. Create `AppointmentForm` component (reusable for create/edit).
2. Introduce `CreateAppointmentModal` hooking into calendar header button and double-click handler.
3. Fetch data via `useEffect`/`useState` (or future data hooks).
4. Refresh calendar events after mutation (reuse `fetchAppointments` hook; maybe expose `refetch`).
5. Add toast utility (existing? likely `sonner` or similar).
6. Extend translations & tests.

## 9. Dependencies & Follow-ups
- Ensure `/api/services` and `/api/locations` exist; if missing, create read endpoints.
- Add seed data for services/locations in separate task BR-1.3.
- Editing flow may require new API route; if not feasible in beta, surface “delete & recreate” path.

## 10. Acceptance Criteria
- Create modal opens from button/double-click.
- Submitting valid form creates appointment visible in calendar & list without reload.
- Validation errors shown clearly; conflicting times handled gracefully.
- Works in EN and DE; passes a11y smoke (keyboard navigation).
