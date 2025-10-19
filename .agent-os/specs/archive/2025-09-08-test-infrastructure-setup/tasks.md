# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-09-08-test-infrastructure-setup/spec.md

> Created: 2025-09-08
> Status: Ready for Implementation

## Tasks

- [ ] 1. Setup Vitest Infrastructure in Monorepo Packages
  - [ ] 1.1 Write initial test configuration files for @myoflow/lib package
  - [ ] 1.2 Install Vitest and coverage dependencies in target packages
  - [ ] 1.3 Configure TypeScript integration and path mapping for tests
  - [ ] 1.4 Create shared test utilities and setup files
  - [ ] 1.5 Update package.json scripts for test execution
  - [ ] 1.6 Configure Turborepo to handle test dependencies and caching
  - [ ] 1.7 Verify basic test infrastructure works with simple smoke tests

- [ ] 2. Migrate and Enhance Austrian Business Logic Tests
  - [ ] 2.1 Write comprehensive test suite for Austrian VAT/KU calculations
  - [ ] 2.2 Convert existing test-austrian-invoicing.js to Vitest format
  - [ ] 2.3 Convert existing test-austrian-holidays.js to TypeScript/Vitest
  - [ ] 2.4 Create test fixtures for all 9 Austrian Bundesländer holidays
  - [ ] 2.5 Add edge case testing for fiscal year boundaries and thresholds
  - [ ] 2.6 Build test utilities for date manipulation and VAT scenarios
  - [ ] 2.7 Verify all Austrian compliance tests pass with 80%+ coverage

- [ ] 3. Implement API Route Testing Infrastructure
  - [ ] 3.1 Write tests for invoice generation API endpoints
  - [ ] 3.2 Set up request/response mocking for Next.js API routes
  - [ ] 3.3 Configure database mocking to isolate business logic
  - [ ] 3.4 Create test fixtures for PDF generation workflows
  - [ ] 3.5 Add error handling and edge case testing for API routes
  - [ ] 3.6 Verify API tests run in isolation without external dependencies

- [ ] 4. Enable CI Pipeline Test Integration
  - [ ] 4.1 Write CI configuration changes to enable unit tests
  - [ ] 4.2 Update .github/workflows/ci.yml to uncomment test execution
  - [ ] 4.3 Configure test failure to block PR merges
  - [ ] 4.4 Set up test coverage reporting and badge generation
  - [ ] 4.5 Add parallel test execution to minimize CI runtime
  - [ ] 4.6 Test CI pipeline with sample PR to verify blocking behavior
  - [ ] 4.7 Verify complete CI workflow runs tests and blocks on failures