# Plan: Platform Admin Features

**Author:** Gemini Code Assist
**Date:** 2025-09-20
**Status:** Proposed

This document outlines the phased implementation plan for introducing platform-wide administration features for MyoFlow.

## Assessment Summary

*   **Role system:** Only practice-level roles (`OWNER`, `STAFF`, `ACCOUNTANT`, `AFFILIATE`) are defined. No admin/super-admin roles exist.
*   **Authentication:** NextAuth is configured for therapist logins via email or Google but there’s no separate admin route or credentials.
*   **Dashboards:** The project only includes therapist dashboards (for appointments, invoices, etc.); there is no admin dashboard in the code or roadmap.
*   **Analytics:** The roadmap plans to add client retention analytics and advanced reporting later, but there’s currently no analytics module or BI infrastructure.
*   **Content management:** There is no CMS or help-article system in the repository.

## Recommended Plan for Admin/Platform Owner features

### Phase 1 – MVP: Add basic admin role and simple control panel

1.  **Extend user roles.** In `packages/db/schema.prisma`, add new roles like `SUPER_ADMIN`, `SUPPORT` and `FINANCE` to the `Role` enum. Update `UserRole` type and authorization utilities accordingly.
2.  **Admin authentication.** Configure NextAuth to support an `/admin` sign-in route with a separate credentials provider or a whitelisted email domain. Seed the database with at least one `SUPER_ADMIN` user.
3.  **Basic admin dashboard.** Create a separate Next.js layout (`/apps/web/app/admin/*`) that only users with `SUPER_ADMIN` or `SUPPORT` roles can access. Start with:

    *   **User management:** List all therapists/users; allow enabling/disabling accounts, resetting passwords and viewing basic user info.
    *   **Admin impersonation:** Provide a “log in as user” action for support.
    *   **Billing overview:** A simple summary of subscription plans (if subscriptions are implemented) and high-level revenue totals computed from invoice data.
4.  **Feature flags & announcements.** Implement a simple feature-flag table and admin UI to toggle features (e.g., enable a beta module for specific therapists). Add a table for system announcements and display a banner to therapists when there’s an active announcement.

This phase uses mostly existing tech—Next.js for UI, Prisma for data, TanStack Query for fetching—and can be completed relatively quickly because it requires minimal analytics.

### Phase 2 – Growth: Dedicated analytics dashboard and integrations

1.  **Analytics and BI foundations.**

    *   Extend the database with tables for tracking trial conversions, user activity (daily/monthly active users), and churn.
    *   Build APIs that aggregate metrics (e.g., total revenue per month, average revenue per therapist, trial conversion rates, churn rates).
2.  **Dashboard visualisations.** Use a charting library such as Chart.js or Recharts to create revenue charts, active-user graphs and churn funnels within the admin dashboard.
3.  **Stripe & support integration.** Connect to Stripe’s API for real-time subscription and payment analytics. Integrate customer-support tooling (Zendesk, Intercom, etc.) to surface ticket volumes and resolution times.
4.  **Role-based panels.** Create dashboard tabs for `FINANCE` (detailed revenue metrics and exports), `SUPPORT` (impersonation, ticket insights) and `SUPER_ADMIN` (feature flags, user management, system health).
5.  **Content management.** Add a basic CMS or headless CMS integration (e.g., Sanity, Notion) for help articles and announcement banners. Provide editing tools in the admin panel.

This phase turns the admin dashboard into a hub for company-level insights and integrates the billing and support services used to run your SaaS.

### Phase 3 – Scale: Full BI suite and advanced SaaS tooling

1.  **Data warehouse & ELT.** Consolidate transactional data (invoices, subscriptions, usage logs, support tickets) into a warehouse (e.g., BigQuery, Snowflake). Use an ELT pipeline (Airbyte, dbt) to model metrics such as cohort retention, lifetime value and feature adoption.
2.  **Self-service BI dashboards.** Implement a BI tool (Metabase, Superset or custom) on top of the warehouse. Expose filters and segmentation for revenue per therapist, churn cohorts, and behavioural analytics.
3.  **Predictive analytics.** Build churn prediction models and trial conversion forecasting. Use machine learning pipelines (e.g., scikit-learn, TensorFlow) fed from the data warehouse.
4.  **Scalable administration.** Add organisation-level features such as multi-tenant management, chain-practice support, and white-label configuration. Introduce granular permissioning (RBAC/ABAC) for large teams.
5.  **Enterprise integrations.** Include SOC-2 compliant audit logging, SSO (SAML/LDAP) and an API marketplace for third-party developers.

By following these phases, you can progressively introduce admin capabilities without disrupting the existing therapist-centric product. The initial changes focus on adding an admin role and simple user management; later phases bring in deeper analytics, role-based dashboards and a scalable BI stack.