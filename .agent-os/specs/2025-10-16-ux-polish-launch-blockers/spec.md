# Spec Requirements Document

> Spec: UX Polish & Launch Blockers
> Created: 2025-10-16

## Overview

Implement critical UX improvements and validation enhancements to ensure first-time users have a polished, intuitive "WOW" experience without encountering bugs, confusing workflows, or unclear interface elements. This spec addresses launch-blocking issues identified during comprehensive QA testing.

## User Stories

### Professional Therapist During Onboarding

As a new Austrian massage therapist signing up for MyoFlow, I want clear visual feedback about which environment I'm in (demo/production) and intuitive guidance through complex compliance fields, so that I can confidently complete my profile setup without making costly mistakes or feeling confused.

**Workflow:** Therapist signs up → sees clear demo/production indicator → encounters VAT/UID fields with inline examples and tooltips → receives immediate validation feedback on IBAN format → gets prompted to complete missing profile sections → successfully launches practice.

**Problem Solved:** Eliminates confusion about test vs. production data, reduces setup errors in compliance-critical fields, prevents incomplete profile launches.

### Existing User Managing Settings

As an established therapist managing my practice settings, I want inline validation and helpful examples for all regulatory fields, so that I don't accidentally enter invalid data that could cause invoice generation failures or compliance issues.

**Workflow:** Opens Settings → updates IBAN → sees format example (AT## #### #### #### ####) → enters invalid format → receives immediate inline error → corrects format → saves successfully with confidence.

**Problem Solved:** Prevents data entry errors that could cascade into invoice failures, tax reporting issues, or payment processing problems.

### Admin User Accessing System

As a system administrator, I want clear separation between admin functions and the main therapist platform, so that I don't accidentally mix administrative actions with regular practice management workflows.

**Workflow:** Logs in with admin credentials → automatically routed to /admin dashboard → cannot access main platform with admin account → maintains clear mental model of admin vs. user roles.

**Problem Solved:** Prevents role confusion, accidental data corruption, and security boundary violations.

## Spec Scope

1. **Account Type System** - Database schema and authentication logic to distinguish TEST, PRODUCTION, ADMIN, and DEV account types with appropriate visual indicators and feature flags
2. **Visual Environment Indicators** - Persistent banners/badges showing account type (Test Data, Production, Admin Panel, Dev Mode) across all pages
3. **Field Validation Framework** - Comprehensive inline validation for IBAN, VAT/UID numbers, logo URLs, postal codes, Chamber IDs with real-time feedback
4. **Contextual Tooltips System** - Tooltip component library integrated into all compliance and complex form fields with examples and Austrian context
5. **Admin Account Segregation** - Authentication routing logic preventing admin accounts from accessing main platform URLs
6. **Profile Completion Prompts** - Automated detection of incomplete onboarding steps with actionable prompts and quick-link navigation
7. **Test Data Management** - Clear labeling and isolation of test accounts (current state: all accounts are test with dummy data)

## Out of Scope

- Help Center & Documentation System (separate spec post-launch)
- Mobile/Responsive Design Completion (separate sprint)
- Legal/Compliance Document Expiry Notices (part of RKSV compliance spec)
- Bulk Actions & Advanced Error Recovery (separate spec)
- Practice Mode Switching for non-Austrian practitioners (future internationalization spec)

## Expected Deliverable

1. Database schema includes `accountType` field with TEST, PRODUCTION, ADMIN, DEV enum values
2. Users can immediately distinguish their account type via persistent visual indicators (color-coded banners)
3. Test accounts display prominent "Test Data Only" banner to prevent confusion with production data
4. All regulatory and payment fields (IBAN, VAT, UID, Chamber ID) provide inline validation with helpful error messages and format examples
5. Complex compliance fields display contextual tooltips with Austrian-specific guidance and sample values
6. Admin accounts cannot access main platform routes and are properly segregated to /admin namespace
7. Users with incomplete profiles receive automated prompts with clear next steps and navigation shortcuts
8. System can transition test accounts to production accounts when ready for real practice launch
