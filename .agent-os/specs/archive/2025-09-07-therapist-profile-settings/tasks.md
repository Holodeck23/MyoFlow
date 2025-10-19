# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-09-07-therapist-profile-settings/spec.md

> Created: 2025-09-07
> Status: Ready for Implementation

## Tasks

- [x] 1. Database Schema Implementation
  - [x] 1.1 Write tests for Therapist model extensions and ServiceRateTemplate model
  - [x] 1.2 Create Prisma migration for new Therapist fields (business info, compliance, preferences)
  - [x] 1.3 Create ServiceRateTemplate model with relationships and constraints
  - [x] 1.4 Add database indexes for performance optimization
  - [x] 1.5 Implement data validation constraints for Austrian compliance (UID format, email validation)
  - [x] 1.6 Run migration and verify schema changes
  - [x] 1.7 Seed database with sample service rate templates for testing
  - [x] 1.8 Verify all database tests pass

- [x] 2. API Endpoints Development
  - [x] 2.1 Write tests for therapist profile API endpoints (/api/therapist/profile)
  - [x] 2.2 Implement GET /api/therapist/profile with profile completion calculation
  - [x] 2.3 Implement PUT /api/therapist/profile with Austrian validation and encryption
  - [x] 2.4 Write tests for service rate template API endpoints
  - [x] 2.5 Implement CRUD endpoints for service rate templates with ownership validation
  - [x] 2.6 Add Austrian compliance validation logic (UID format, VAT status rules)
  - [x] 2.7 Integrate with existing audit logging system
  - [x] 2.8 Verify all API tests pass

- [ ] 3. Settings Page UI Development
  - [ ] 3.1 Write tests for therapist settings page components
  - [ ] 3.2 Create main settings layout at /dashboard/settings with tabbed navigation
  - [ ] 3.3 Build business profile form with Austrian field validation
  - [ ] 3.4 Implement service rate templates management interface
  - [ ] 3.5 Add profile completion indicator and progress tracking
  - [ ] 3.6 Create German-language form labels and validation messages
  - [ ] 3.7 Implement responsive design for mobile and tablet views
  - [ ] 3.8 Verify all UI component tests pass

- [ ] 4. Invoice Integration Enhancement
  - [ ] 4.1 Write tests for invoice integration with therapist profile data
  - [ ] 4.2 Modify invoice creation API to use profile business information
  - [ ] 4.3 Update PDF generation templates to include Austrian business details
  - [ ] 4.4 Integrate service rate templates into invoice line item creation
  - [ ] 4.5 Add legal notice generation based on therapist designation and VAT status
  - [ ] 4.6 Test Austrian compliance formatting in generated PDFs
  - [ ] 4.7 Verify invoice creation workflow with new profile data
  - [ ] 4.8 Verify all integration tests pass

- [ ] 5. End-to-End Testing and Documentation
  - [ ] 5.1 Write comprehensive E2E tests for complete profile setup workflow
  - [ ] 5.2 Test profile completion flow from empty profile to fully configured
  - [ ] 5.3 Test service rate template creation and application to invoices  
  - [ ] 5.4 Verify Austrian compliance validation across all forms
  - [ ] 5.5 Test mobile responsiveness and accessibility compliance
  - [ ] 5.6 Update user documentation for profile setup and service rate management
  - [ ] 5.7 Document API endpoints and integration points
  - [ ] 5.8 Verify all E2E tests pass and feature is production-ready