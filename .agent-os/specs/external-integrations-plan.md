# Specification: External Service Integrations

**Author:** Gemini Code Assist
**Date:** 2025-09-20
**Status:** Proposed

This document outlines the main categories of external services and APIs a practice-management system like **MyoFlow** would typically need to connect to in order to deliver its planned features and meet Austrian compliance requirements.

## 1. Payment and Subscription Services

*   **Stripe or equivalent:** Already planned in the roadmap; used for recurring subscription billing, card payments, and invoice management. Integrating with Stripe’s Dashboard lets admins see payment histories and revenue by customer.
*   **SEPA/Open-Banking Providers:** Optional for supporting direct bank transfers. Providers like **Viva.com** or **Mollie** offer APIs for SEPA direct debits and giro transactions.

## 2. Accounting and Tax Compliance

*   **BMD, RZL, and DATEV:** Austrian tax and accounting suites. These systems don’t expose public REST APIs; typical integrations are CSV or XML exports, as noted in the roadmap. MyoFlow should generate exports in the formats these tools expect.
*   **RKSV (Registrierkassensicherheitsverordnung):** Austria’s cash-register security regulation. If therapists use MyoFlow as a POS system, receipts must be signed and registered with the tax office. Cloud providers such as **fiskaltrust** and **fiskaly** offer REST APIs (SIGN AT) to handle the receipt signing and “DEP7” export.
*   **VAT Number Validation (VIES):** To verify that clients are VAT-registered for intra-EU transactions. The European Commission’s VIES system allows businesses to check whether a VAT number is valid. Integration can be done via the EU’s SOAP interface or through third-party REST APIs (e.g., VATify, DanubeLabs).
*   **Austrian UID-Nummer (VAT ID) Verification:** Local services like DanubeLabs provide APIs that query FinanzOnline to match a VAT number with the official business record.

## 3. Healthcare/e-card Integration

*   Austria’s social-insurance e-card system (VDAS) enables hospitals and certain healthcare providers to query a patient’s insurance data.
*   **High Complexity:** Accessing these services requires contractual agreements and hardware tokens (social-insurance signature card). They are not generally open to private SaaS vendors.
*   **Priority:** This is a long-term, optional feature, only relevant if therapists bill directly to public insurers.

## 4. Compliance with Electronic Invoicing/Public Procurement

*   **e-Rechnung/E-Rechnung.gv.at:** Austria’s electronic invoice portal for public sector clients.
*   **Priority:** Niche feature. Implement only if therapists begin to sell services to public institutions. Requires generating UBL-compliant invoices.

## 5. Communication Services

*   **Email API:** Services like SendGrid or Resend are already in the plan for sending invoices and appointment reminders.
*   **SMS/WhatsApp Messaging:** Integration with Twilio or an Austrian carrier like A1 or Drei for appointment reminders and two-factor authentication.
*   **Mapping/Geocoding:** Google Maps or OpenStreetMap to geocode addresses and calculate travel times for mobile therapists.

## 6. Analytics and Business Intelligence

*   **Data Warehouse/BI Tools:** Connecting to a data warehouse (e.g., BigQuery, Redshift) via connectors to consolidate transactional data and enable advanced analytics. Third-party BI platforms (Metabase, Superset) can then be integrated for dashboards.

## 7. Identity and Single Sign-On (SSO)

*   For enterprise clients, integration with SAML or OIDC providers (e.g., Azure AD, Okta) will be needed to offer SSO. These are typically separate modules or add-ons for larger customers.

## Summary & Prioritization

The critical external integrations for an Austrian therapy-practice platform are:
1.  **Stripe** for payments.
2.  **Accounting exports** to BMD/RZL/DATEV.
3.  Tax-compliant receipt signing via a provider like **fiskaly** or **fiskaltrust** (for RKSV).

Optional but valuable integrations include VAT/EU number validation.

e-card/VDAS integration exists but requires special credentials and signing certificates, so it should be considered a long-term project rather than a near-term necessity.