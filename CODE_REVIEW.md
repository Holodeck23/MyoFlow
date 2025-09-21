# Code Review Findings and Recommendations

This document summarizes the findings and recommendations from a recent code review of the MyoFlow codebase.

## Detailed Refactoring Plan

This plan outlines a safe and incremental approach to refactoring the MyoFlow codebase. The goal is to improve the codebase's stability, performance, and maintainability without introducing breaking changes.

### Phase 1: Stabilize the Foundation (1-2 days)

**Goal:** Create a stable and efficient development environment.

1.  **Pre-build Shared Packages:**
    *   **Task:** Modify the `@myoflow/lib` and `@myoflow/ui` packages to be pre-built before being consumed by the `web` app.
    *   **Steps:**
        1.  In `packages/lib/package.json` and `packages/ui/package.json`, change the `main` field to `./dist/index.js` and the `types` field to `./dist/index.d.ts`.
        2.  In `packages/ui/tsconfig.json`, add `"outDir": "./dist"` and `"declaration": true` to the `compilerOptions`.
        3.  Update `turbo.json` to ensure that the `lib` and `ui` packages are built before the `web` app.
    *   **Verification:** The `dev` server should start faster, and the app should function as before.

2.  **Fortify the CI/CD Pipeline:**
    *   **Task:** Improve the CI/CD pipeline to provide a more robust safety net.
    *   **Steps:**
        1.  Enable the E2E tests in `.github/workflows/ci.yml`.
        2.  Add a Redis service to the CI workflow.
        3.  Refactor the workflow to use a single `DATABASE_URL` environment variable.
        4.  Add a step to cache the `node_modules` directory.
    *   **Verification:** The CI pipeline should run successfully, and all tests should pass.

### Phase 2: Refactor the Calendar (2-3 days)

**Goal:** Improve the modularity and maintainability of the calendar feature.

1.  **Extract Data Fetching Logic:**
    *   **Task:** Create a custom hook to handle fetching appointment data.
    *   **Steps:**
        1.  Create a new file `apps/web/src/hooks/useAppointments.ts`.
        2.  Move the data fetching logic from `apps/web/app/dashboard/calendar/page.tsx` to the new hook.
        3.  The hook should return `data`, `loading`, and `error` states.
    *   **Verification:** The calendar page should still fetch and display appointments as before.

2.  **Decompose the Calendar Page:**
    *   **Task:** Break the `CalendarPage` component into smaller, presentational components.
    *   **Steps:**
        1.  Create a new `components` folder in `apps/web/app/dashboard/calendar`.
        2.  Create the following components:
            *   `CalendarHeader.tsx`
            *   `AppointmentList.tsx`
            *   `TravelTimeline.tsx`
            *   `CalendarLegend.tsx`
        3.  Move the relevant JSX and logic from `page.tsx` to these new components.
    *   **Verification:** The calendar page should look and function the same as before.

3.  **Centralize Helper Functions:**
    *   **Task:** Move utility functions to a shared location.
    *   **Steps:**
        1.  Create a new file `apps/web/src/lib/utils.ts`.
        2.  Move the `formatTime`, `formatPrice`, and `getStatusColor` functions from `page.tsx` to the new `utils.ts` file.
    *   **Verification:** The calendar page should still display times, prices, and statuses correctly.

### Phase 3: Code Cleanup and Documentation (1 day)

**Goal:** Remove dead code and update documentation.

1.  **Remove Dead Code:**
    *   **Task:** Remove any remaining references to `CSVExportManager`, `ServiceRateManager`, and `DashboardNav`.
    *   **Steps:**
        1.  Search the codebase for any remaining references to these components.
        2.  Remove the references.
    *   **Verification:** The app should build and run without errors.

2.  **Update Documentation:**
    *   **Task:** Update the `ROADMAP.md` and other documentation to reflect the current state of the codebase.
    *   **Steps:**
        1.  Remove the references to the deleted components.
        2.  Update the status of the CI/CD pipeline and the calendar refactoring.
    *   **Verification:** The documentation should be accurate and up-to-date.

## High-Priority

### Stabilize the Development Environment

*   **Problem:** The development server is "fragile" and slow due to the on-the-fly transpilation of the `@myoflow/lib` and `@myoflow/ui` packages. This is because the `main` field in their `package.json` files points to the TypeScript source code (`index.ts`) instead of a compiled JavaScript file.
*   **Recommendation:** Pre-build the `@myoflow/lib` and `@myoflow/ui` packages.
    1.  In `packages/lib/package.json` and `packages/ui/package.json`, change the `main` field to `./dist/index.js` and the `types` field to `./dist/index.d.ts`.
    2.  In `packages/ui/tsconfig.json`, add `"outDir": "./dist"` and `"declaration": true` to the `compilerOptions`.
    3.  Update `turbo.json` to ensure that the `lib` and `ui` packages are built before the `web` app.

### Improve CI/CD

*   **Problem:** The CI/CD pipeline in `.github/workflows/ci.yml` is not running E2E tests and is missing a Redis service, which is a project dependency.
*   **Recommendation:**
    1.  Enable the E2E tests by setting `if: true` for the "Run E2E tests" step.
    2.  Add a Redis service to the `services` section of the workflow.
    3.  Refactor the workflow to use a single `DATABASE_URL` environment variable for the entire job.
    4.  Add a step to cache the `node_modules` directory to speed up the pipeline.

## Medium-Priority

### Refactor the Calendar Page

*   **Problem:** The `apps/web/app/dashboard/calendar/page.tsx` component is a 500+ line monolith that is difficult to maintain and test.
*   **Recommendation:** Refactor the component into smaller, more manageable pieces:
    1.  Extract the data fetching logic into a custom hook (e.g., `useAppointments`).
    2.  Break the UI into smaller presentational components (e.g., `CalendarHeader`, `AppointmentList`, `TravelTimeline`, `CalendarLegend`).
    3.  Move helper functions to a separate `utils` file.

## Low-Priority

### Update Documentation

*   **Problem:** The documentation (e.g., `ROADMAP.md`, `translation_sweep_report.md`) is slightly out of date and refers to components that have already been deleted (e.g., `CSVExportManager`, `ServiceRateManager`, `DashboardNav`).
*   **Recommendation:** Update the documentation to reflect the current state of the codebase. This will prevent confusion for future developers.
