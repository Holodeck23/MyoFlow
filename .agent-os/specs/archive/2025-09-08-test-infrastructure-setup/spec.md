# Spec Requirements Document

> Spec: Sprint 1.6 Test Infrastructure & Quality Setup
> Created: 2025-09-08
> Status: Planning

## Overview

Implement comprehensive unit testing infrastructure using Vitest for MyoFlow's Austrian therapy practice management system to ensure bulletproof compliance with Austrian regulatory requirements. This foundation enables automated testing of critical business logic including VAT/Kleinunternehmer calculations, Austrian holiday systems, and invoice generation workflows.

## User Stories

### Automated Austrian Compliance Testing

As a **MyoFlow developer**, I want to **run automated unit tests for Austrian business logic**, so that **regulatory compliance features are bulletproof and legally sound**.

Developers can execute `pnpm test` to validate all Austrian-specific calculations, holiday systems, and compliance rules automatically. The system tests VAT rates, Kleinunternehmer thresholds, state-specific Austrian holidays, and invoice generation logic with comprehensive coverage to prevent compliance failures.

### CI Pipeline Quality Gates

As a **development team**, I want **automated testing in CI pipeline**, so that **no broken Austrian compliance code reaches production**.

Every pull request automatically runs the full test suite including Austrian holiday calculations, VAT/KU business logic, and API endpoint validation. Failed tests block merges, ensuring that critical Austrian regulatory features maintain compliance standards required for therapy practice operations.

### Legacy Test Integration

As a **project maintainer**, I want **existing Codex test files properly integrated**, so that **previous testing work contributes to system reliability**.

The existing `test-austrian-invoicing.js` and `test-austrian-holidays.js` files are converted to proper Vitest format and integrated into the monorepo testing infrastructure, preserving the valuable Austrian compliance test coverage already developed.

## Spec Scope

1. **Vitest Configuration** - Complete setup across monorepo packages with proper TypeScript integration
2. **Austrian Business Logic Tests** - Comprehensive coverage for VAT/KU calculations and holiday systems
3. **CI Pipeline Integration** - Enable automated testing in GitHub Actions workflow
4. **API Route Testing** - Unit tests for invoice generation and PDF endpoints
5. **Legacy Test Migration** - Convert existing Codex test files to Vitest format

## Out of Scope

- E2E testing infrastructure (already implemented with Playwright)
- Frontend component testing (deferred to future sprints)
- Performance and load testing
- Database integration testing
- Visual regression testing

## Expected Deliverable

1. **Functioning test command** - `pnpm test` executes successfully across all monorepo packages
2. **CI automation** - GitHub Actions runs unit tests and blocks failed builds
3. **Austrian compliance coverage** - 80%+ test coverage for VAT/KU and holiday calculation functions

## Spec Documentation

- Tasks: @.agent-os/specs/2025-09-08-test-infrastructure-setup/tasks.md
- Technical Specification: @.agent-os/specs/2025-09-08-test-infrastructure-setup/sub-specs/technical-spec.md
- Test Coverage Plan: @.agent-os/specs/2025-09-08-test-infrastructure-setup/sub-specs/test-coverage.md