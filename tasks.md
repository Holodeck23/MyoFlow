# Outstanding Issues Resolution Tasks

> Created: 2025-09-21
> Status: Ready for Implementation
> Priority: Critical - Blocking continued development

## Overview

These tasks systematically address the three major outstanding issues identified in KNOWN_ISSUES.md that are blocking continued development of the user settings design implementation.

## Major Tasks

### Task 1: Database Schema Synchronization Resolution

**Priority:** Critical
**Estimate:** 4 hours
**Dependencies:** None
**Issue:** Prisma client cache inconsistency with TaxComplianceSettings.kleinunternehmer_start column

#### Task 1.1: Write Database Synchronization Tests
- [ ] Create test to verify Prisma schema matches actual database structure
- [ ] Write test to validate TaxComplianceSettings table structure
- [ ] Add test for kleinunternehmer_start column existence and type
- [ ] Create test for Prisma client field access consistency
- [ ] Add integration test for TaxComplianceSettings CRUD operations

**Acceptance Criteria:**
- Tests fail initially, demonstrating the synchronization issue
- Tests validate both database structure and Prisma client access
- Tests cover the specific kleinunternehmer_start column issue

#### Task 1.2: Investigate Prisma Client Connection Discrepancies
- [ ] Verify DATABASE_URL environment variable consistency across processes
- [ ] Check for multiple Prisma client instances or connection conflicts
- [ ] Validate schema.prisma maps correctly to database column names
- [ ] Investigate potential TypeScript compilation cache issues
- [ ] Document connection string format and database name verification

**Acceptance Criteria:**
- Connection string discrepancies identified and documented
- Multiple client instances ruled out or resolved
- Schema mapping verification completed
- Root cause of cache inconsistency identified

#### Task 1.3: Execute Prisma Client Regeneration Strategy
- [ ] Clear all Prisma-related caches (.next, node_modules/.prisma, etc.)
- [ ] Regenerate Prisma client with explicit schema validation
- [ ] Verify generated client types match database structure
- [ ] Test TaxComplianceSettings operations with regenerated client
- [ ] Document successful regeneration procedure

**Acceptance Criteria:**
- Prisma client successfully recognizes kleinunternehmer_start column
- All TaxComplianceSettings operations function correctly
- No more "column doesn't exist" errors in API endpoints

#### Task 1.4: Implement Database Rebuild Fallback
- [ ] Create fresh database migration from clean state
- [ ] Verify all migrations apply correctly in sequence
- [ ] Re-seed database with test data including TaxComplianceSettings
- [ ] Validate all settings API endpoints function with rebuilt database
- [ ] Document fresh rebuild procedure for deployment

**Acceptance Criteria:**
- Fresh database rebuild resolves all schema synchronization issues
- All existing functionality preserved after rebuild
- Rebuild procedure documented for future deployment issues

#### Task 1.5: Verify All Tests Pass
- [ ] Run full test suite to ensure no regressions
- [ ] Validate all TaxComplianceSettings operations work correctly
- [ ] Test settings overview API endpoint with complete data
- [ ] Verify no Prisma client cache issues remain
- [ ] Confirm deployment readiness

**Acceptance Criteria:**
- All tests pass without Prisma-related errors
- Settings API endpoints return complete data
- No database synchronization warnings or errors

### Task 2: Settings Page Performance Optimization

**Priority:** High
**Estimate:** 6 hours
**Dependencies:** Task 1 completion
**Issue:** 12+ second rebuild times and sluggish initial load due to monolithic client bundle

#### Task 2.1: Write Performance Baseline Tests
- [ ] Create performance test to measure current build times
- [ ] Add test to measure initial page load time and bundle size
- [ ] Write test to validate component lazy loading functionality
- [ ] Create test for API endpoint response times
- [ ] Add test for client-side hydration performance

**Acceptance Criteria:**
- Baseline performance metrics documented (12+ second builds)
- Tests demonstrate current performance bottlenecks
- Performance regression detection in place

#### Task 2.2: Split Settings Page into Component Modules
- [ ] Extract Overview tab into separate server component
- [ ] Convert Profile tab to lazy-loaded client component
- [ ] Split Travel tab into standalone component with dynamic imports
- [ ] Separate Pricing tab into isolated component module
- [ ] Extract Compliance tab to independent component
- [ ] Split System tab into separate lazy-loaded component

**Acceptance Criteria:**
- Settings page main file reduced from 1,800+ lines to under 500 lines
- Each tab component independently loadable
- No functional regressions in tab switching or data loading

#### Task 2.3: Implement Lazy Loading and Code Splitting
- [ ] Add React.lazy() for all non-critical settings components
- [ ] Implement dynamic imports for tab components
- [ ] Add loading suspense boundaries for each settings tab
- [ ] Configure webpack code splitting for settings modules
- [ ] Optimize icon imports to reduce bundle size

**Acceptance Criteria:**
- Only active tab components loaded and hydrated
- Bundle size reduced by at least 60% for initial page load
- Smooth loading experience with proper suspense boundaries

#### Task 2.4: Optimize API Endpoint Loading Strategy
- [ ] Gate API fetches behind tab activation state
- [ ] Implement request deduplication for settings overview
- [ ] Add proper loading states for missing endpoints
- [ ] Cache API responses to prevent redundant fetches
- [ ] Remove console noise from 404 API calls

**Acceptance Criteria:**
- API calls only triggered when relevant tabs are accessed
- No 404 errors in console during normal operation
- Cached responses improve subsequent tab load times

#### Task 2.5: Verify Performance Improvements
- [ ] Measure new build times (target: under 5 seconds)
- [ ] Test initial page load performance (target: under 2 seconds)
- [ ] Validate bundle size reduction achieved
- [ ] Confirm no functional regressions introduced
- [ ] Document performance optimization techniques used

**Acceptance Criteria:**
- Build times reduced by at least 60% (under 5 seconds)
- Initial page load under 2 seconds
- All settings functionality preserved
- Performance improvements documented for future reference

### Task 3: Settings Backend API Implementation

**Priority:** High
**Estimate:** 8 hours
**Dependencies:** Task 1 completion
**Issue:** Missing API endpoints causing frontend 404 errors and incomplete functionality

#### Task 3.1: Write API Endpoint Tests
- [ ] Create test suite for profile settings API endpoints
- [ ] Write tests for travel settings API operations
- [ ] Add tests for system preferences API endpoints
- [ ] Create tests for credentials management API
- [ ] Write tests for export configuration API endpoints

**Acceptance Criteria:**
- Comprehensive test coverage for all missing API endpoints
- Tests validate authentication and authorization requirements
- Tests cover Austrian-specific validation requirements

#### Task 3.2: Implement Profile Settings API Endpoints
- [ ] Create GET /api/settings/profile endpoint
- [ ] Implement PUT /api/settings/profile for updates
- [ ] Add Austrian address validation and geocoding
- [ ] Implement business information validation
- [ ] Add professional credentials CRUD operations

**Acceptance Criteria:**
- Profile API endpoints return complete therapist data
- Austrian address validation works with postal codes
- Credentials management supports secure file uploads
- All endpoints properly authenticated and authorized

#### Task 3.3: Build Travel Settings API Endpoints
- [ ] Create GET /api/settings/travel endpoint
- [ ] Implement PUT /api/settings/travel for configuration updates
- [ ] Add geographic radius and boundary management
- [ ] Implement transport method and rate configuration
- [ ] Add travel cost calculation utilities

**Acceptance Criteria:**
- Travel settings API integrates with Google Maps
- Geographic calculations work with Austrian coordinates
- Transport rates properly stored and retrieved
- Travel cost calculations accurate for Austrian context

#### Task 3.4: Implement System Preferences API Endpoints
- [ ] Create GET /api/settings/system endpoint
- [ ] Implement PUT /api/settings/system for preference updates
- [ ] Add language preference persistence
- [ ] Implement notification configuration management
- [ ] Add timezone and localization settings

**Acceptance Criteria:**
- System preferences persist across user sessions
- Language settings integrate with i18n system
- Notification preferences control email and alert behavior
- Austrian localization settings properly applied

#### Task 3.5: Create Export Configuration API Endpoints
- [ ] Implement GET /api/settings/export endpoint
- [ ] Add PUT /api/settings/export for configuration updates
- [ ] Create accounting software export format management
- [ ] Implement CSV field mapping configuration
- [ ] Add automated export scheduling functionality

**Acceptance Criteria:**
- Export configurations support Austrian accounting software
- Field mapping flexible and customizable
- Automated exports schedule and execute correctly
- Export preview functionality works accurately

#### Task 3.6: Migrate Legacy JSON Settings Data
- [ ] Create migration script for existing travelSettings JSON blobs
- [ ] Migrate notificationSettings to structured UserPreferences table
- [ ] Update existing therapists with default structured settings
- [ ] Preserve backward compatibility during migration
- [ ] Validate data integrity after migration

**Acceptance Criteria:**
- All legacy JSON data successfully migrated to structured tables
- No data loss during migration process
- Backward compatibility maintained until complete migration
- All existing therapists have complete structured settings

#### Task 3.7: Verify All API Tests Pass
- [ ] Run complete API test suite for all new endpoints
- [ ] Validate Austrian-specific validation functions
- [ ] Test authentication and authorization on all endpoints
- [ ] Verify integration with frontend settings components
- [ ] Confirm no 404 errors remain in settings page

**Acceptance Criteria:**
- All API endpoints respond correctly with proper data
- Austrian validation works for all relevant fields
- Authentication properly protects all settings operations
- Frontend integration complete with no missing endpoints

## Implementation Strategy

### Technical Dependencies
1. **Task 1 must complete first** - Database synchronization blocks all other development
2. **Task 2 and Task 3 can run in parallel** - After Task 1 completes
3. **Performance testing requires API completion** - Full integration testing needs both

### Development Approach
- **Test-Driven Development:** Each major task starts with writing comprehensive tests
- **Incremental Implementation:** Tasks broken into small, verifiable steps
- **Continuous Integration:** All tests must pass before moving to next subtask
- **Documentation:** Each solution documented for future deployment

### Risk Mitigation
- **Database Issues:** Fresh rebuild strategy provides fallback option
- **Performance Regressions:** Baseline tests catch any performance decreases
- **API Integration:** Comprehensive test coverage prevents missing endpoint issues
- **Migration Safety:** Backward compatibility maintained during data migrations

### Success Criteria
- **Task 1:** Prisma client works correctly with all database columns
- **Task 2:** Build times under 5 seconds, page load under 2 seconds
- **Task 3:** All settings API endpoints functional, no 404 errors

---

**Total Estimate:** 18 hours across 3 major tasks
**Critical Path:** Task 1 → (Task 2 || Task 3)
**Expected Outcome:** Complete resolution of all blocking issues for user settings implementation