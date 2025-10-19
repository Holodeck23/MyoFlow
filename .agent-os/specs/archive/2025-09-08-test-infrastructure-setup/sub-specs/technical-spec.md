# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-09-08-test-infrastructure-setup/spec.md

> Created: 2025-09-08
> Version: 1.0.0

## Technical Requirements

### Vitest Configuration Setup
- Install Vitest in `@myoflow/lib`, `@myoflow/web`, and `@myoflow/db` packages
- Configure TypeScript integration with proper path mapping and module resolution
- Set up test coverage reporting with c8/v8 coverage provider
- Configure test environment with Node.js environment for business logic testing

### Monorepo Package Configuration
- Update `package.json` files in target packages with test scripts
- Configure Turborepo to handle test dependencies and caching
- Set up shared test configuration file for consistent settings across packages
- Enable watch mode for development testing workflow

### Austrian Business Logic Testing Framework
- Create test utilities for Austrian VAT rate calculations (20% standard, 10%/13% reduced)
- Build Kleinunternehmer threshold testing helpers (€35,000 annual revenue limit)
- Implement Austrian holiday system test fixtures for all 9 Bundesländer
- Set up date manipulation utilities for fiscal year and quarterly testing

### CI Pipeline Integration
- Enable unit test execution in `.github/workflows/ci.yml` (lines 98-99, 102-103)
- Configure test failure to block PR merges and deployments
- Set up test coverage reporting and badge generation
- Add parallel test execution to minimize CI runtime

### Legacy Test Migration
- Convert existing `test-austrian-invoicing.js` to Vitest format with TypeScript
- Migrate `test-austrian-holidays.js` to proper test structure
- Preserve existing test logic while improving organization and readability
- Add missing edge cases and error scenarios to existing tests

### API Route Testing Infrastructure
- Set up request/response mocking for Next.js API routes
- Configure database mocking to isolate business logic testing
- Create test fixtures for invoice generation workflows
- Build PDF generation testing with headless environment support

## Approach

### Phase 1: Core Infrastructure Setup
1. Install Vitest and coverage dependencies across monorepo packages
2. Create shared test configuration with TypeScript path mapping
3. Update Turborepo configuration to include test tasks
4. Configure CI pipeline to run tests on PR and main branch pushes

### Phase 2: Austrian Business Logic Testing
1. Migrate existing JavaScript test files to TypeScript/Vitest
2. Create comprehensive test utilities for Austrian tax calculations
3. Build test fixtures for holiday system validation
4. Implement edge case testing for regulatory compliance scenarios

### Phase 3: API and Integration Testing
1. Set up MSW for API route mocking
2. Create database test fixtures and seeding utilities
3. Build PDF generation test suite with headless testing
4. Add invoice workflow integration tests

### Phase 4: CI Integration and Coverage
1. Enable test execution in GitHub Actions workflow
2. Configure coverage reporting and badge generation
3. Set up test failure blocking for PR merges
4. Optimize test performance for CI environment

## External Dependencies

### Core Testing Framework
- **Vitest** - Modern test framework with native TypeScript support
- **Justification:** Faster than Jest, better TypeScript integration, Vite ecosystem alignment

### Coverage and Reporting
- **@vitest/coverage-c8** - Native coverage reporting
- **Justification:** Built-in coverage without additional setup complexity

### Mocking and Fixtures
- **msw (Mock Service Worker)** - API mocking for integration tests
- **Justification:** Industry standard for HTTP request mocking in tests

### Development Dependencies
- **@types/node** - Node.js type definitions for test environment
- **tsx** - TypeScript execution for test scripts and utilities
- **happy-dom** or **jsdom** - DOM environment for component testing (if needed)