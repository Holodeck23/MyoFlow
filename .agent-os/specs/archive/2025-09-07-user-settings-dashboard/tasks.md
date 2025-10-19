# Tasks Checklist

> Spec: User Settings Dashboard
> Created: 2025-09-07
> Status: Ready for Implementation

## Task Overview

This checklist breaks down the implementation of the Austrian therapist settings dashboard into specific, actionable tasks. The implementation will create a comprehensive settings interface that allows therapists to manage their professional profile, business information, service rates, and Austrian tax compliance settings.

**Total Estimated Time:** 24-32 hours
**Dependencies:** Existing MyoFlow authentication, database schema, and UI components
**Target Completion:** 5-7 business days

---

## Phase 1: Database Schema & API Foundation (6-8 hours)

### Task 1.1: Extend Therapist Database Schema
- [ ] **Priority:** High | **Estimated Time:** 2 hours | **Dependencies:** None
- [ ] Add new fields to existing Therapist model in `/packages/database/schema.prisma`:
  - `businessHours` (JSON field for weekly schedule)
  - `vatRate` (Decimal, default 20.0 for Austrian standard)
  - `invoicePrefix` (String, default year format)
  - `nextInvoiceNumber` (Int, default 1)
  - `businessLogo` (String, nullable URL)
  - `website` (String, nullable URL)
  - `bio` (String, nullable, max 1000 chars)
- [ ] Create database migration script with proper Austrian defaults
- [ ] Update Prisma client types and regenerate
- [ ] Test migration on development database

### Task 1.2: Create ServiceRateTemplate Model
- [ ] **Priority:** High | **Estimated Time:** 2 hours | **Dependencies:** Task 1.1
- [ ] Define ServiceRateTemplate schema in `/packages/database/schema.prisma`:
  - `id` (String, cuid primary key)
  - `therapistId` (String, foreign key)
  - `name` (String, required, max 100 chars)
  - `description` (String, nullable, max 500 chars)
  - `priceInCents` (Int, required, positive)
  - `durationMinutes` (Int, required, 15-480 range)
  - `category` (Enum: MASSAGE, CONSULTATION, THERAPY, OTHER)
  - `isActive` (Boolean, default true)
  - `createdAt` and `updatedAt` timestamps
- [ ] Add relationship to Therapist model
- [ ] Create migration and test with sample data
- [ ] Seed development database with Austrian therapy service templates

### Task 1.3: Implement Core API Endpoints
- [ ] **Priority:** High | **Estimated Time:** 3-4 hours | **Dependencies:** Task 1.1, 1.2
- [ ] Create `/api/user/profile` GET/PUT endpoints in `apps/web/app/api/user/profile/route.ts`:
  - GET: Return current user profile with therapist details
  - PUT: Update user name and therapist information
  - Include proper Austrian field validation (postal codes, phone numbers)
  - Implement Zod validation schemas
- [ ] Create `/api/user/business-settings` GET/PUT endpoints:
  - GET: Return business configuration settings
  - PUT: Update VAT rate, Kleinunternehmer status, business hours
  - Validate Austrian tax number format (ATU prefix)
- [ ] Add proper error handling and TypeScript types
- [ ] Test all endpoints with Postman/Thunder Client

---

## Phase 2: Service Rate Management API (4-5 hours)

### Task 2.1: Service Rate CRUD Endpoints
- [ ] **Priority:** High | **Estimated Time:** 3 hours | **Dependencies:** Task 1.2
- [ ] Create `/api/service-rates/route.ts` for GET/POST operations:
  - GET: List all active service rates for authenticated therapist
  - POST: Create new service rate template with validation
  - Include query parameter filtering (active status, category)
  - Implement proper Austrian currency formatting
- [ ] Create `/api/service-rates/[id]/route.ts` for individual operations:
  - GET: Retrieve specific service rate template
  - PUT: Update existing service rate template
  - DELETE: Soft delete (set isActive to false)
- [ ] Add comprehensive input validation with Zod schemas
- [ ] Implement proper error responses and status codes

### Task 2.2: Austrian Validation Endpoints
- [ ] **Priority:** Medium | **Estimated Time:** 2 hours | **Dependencies:** None
- [ ] Create `/api/validate/tax-number` endpoint:
  - Validate Austrian tax number formats (ATU, UID)
  - Return format type and validation status
  - Include helpful error messages in German
- [ ] Create `/api/validate/postal-code` endpoint:
  - Validate 4-digit Austrian postal codes
  - Return city suggestions and Bundesland information
  - Include mapping for major Austrian cities
- [ ] Add rate limiting to validation endpoints
- [ ] Test with various Austrian postal codes and tax numbers

---

## Phase 3: Frontend Settings Page Structure (6-8 hours)

### Task 3.1: Settings Page Layout and Navigation
- [ ] **Priority:** High | **Estimated Time:** 2 hours | **Dependencies:** None
- [ ] Create `/apps/web/app/dashboard/settings/page.tsx` route:
  - Implement responsive layout using existing dashboard wrapper
  - Add tabbed navigation component for settings categories
  - Create breadcrumb navigation (Dashboard > Settings)
  - Include page title and description header
- [ ] Update dashboard sidebar navigation in `components/dashboard-layout.tsx`:
  - Add "Settings" link with appropriate icon
  - Ensure proper active state highlighting
  - Test navigation flow from dashboard to settings
- [ ] Implement mobile-responsive design:
  - Collapsible sidebar on tablet/mobile
  - Bottom tab navigation for mobile screens
  - Test responsive behavior across screen sizes

### Task 3.2: Reusable Settings Components
- [ ] **Priority:** High | **Estimated Time:** 2-3 hours | **Dependencies:** Task 3.1
- [ ] Create settings form components in `components/settings/`:
  - `SettingsHeader.tsx` - Page header with title and save status
  - `SettingsTabs.tsx` - Tabbed navigation component
  - `SettingsCard.tsx` - Reusable card wrapper for form sections
  - `SettingsFormField.tsx` - Standardized form field component
- [ ] Implement form validation using React Hook Form + Zod:
  - Austrian phone number validation regex
  - 4-digit postal code validation
  - Tax number format validation
  - Email format validation
- [ ] Create loading states and error handling components:
  - Skeleton loaders for data fetching
  - Inline error message display
  - Form-level error summary component

### Task 3.3: Auto-save and State Management
- [ ] **Priority:** Medium | **Estimated Time:** 2-3 hours | **Dependencies:** Task 3.2
- [ ] Implement auto-save functionality:
  - Save draft changes to localStorage every 30 seconds
  - Show "Saving..." and "Saved" status indicators
  - Restore drafts when page is reloaded
  - Clear drafts when changes are successfully submitted
- [ ] Set up TanStack Query integration:
  - Create custom hooks for settings data fetching
  - Implement optimistic updates for better UX
  - Add proper cache invalidation strategies
  - Handle concurrent update conflicts
- [ ] Add comprehensive form state management:
  - Track dirty state for unsaved changes warning
  - Implement form reset functionality
  - Handle validation state across form sections

---

## Phase 4: Profile and Business Settings Forms (6-8 hours)

### Task 4.1: Professional Profile Settings Form
- [ ] **Priority:** High | **Estimated Time:** 3 hours | **Dependencies:** Task 3.2
- [ ] Create `ProfileSettingsForm.tsx` component:
  - Personal information fields (title, first name, last name)
  - Contact information (phone, email with verification flow)
  - Professional bio text area (1000 char limit)
  - Profile picture upload with preview
- [ ] Implement Austrian-specific features:
  - Professional title dropdown (DR, MAG, PROF)
  - Austrian phone number formatting and validation
  - German language labels and validation messages
  - Support for Austrian professional certifications
- [ ] Add profile picture functionality:
  - Drag-and-drop image upload
  - Image preview and cropping
  - File size and format validation (5MB, jpg/png/webp)
  - Integration with `/api/upload/avatar` endpoint
- [ ] Test form submission and validation edge cases

### Task 4.2: Business Settings Configuration Form
- [ ] **Priority:** High | **Estimated Time:** 3-4 hours | **Dependencies:** Task 4.1
- [ ] Create `BusinessSettingsForm.tsx` component:
  - Business name and address fields
  - Austrian postal code validation with city auto-complete
  - Tax configuration (Kleinunternehmer vs VAT registered)
  - Business hours schedule widget
- [ ] Implement Austrian tax compliance features:
  - Kleinunternehmer status toggle with legal notice preview
  - VAT rate selection (20% standard, 10%/13% reduced)
  - Tax number validation (ATU prefix format)
  - Invoice prefix and numbering sequence configuration
- [ ] Create business hours schedule interface:
  - Weekly schedule with time picker components
  - Enable/disable specific days
  - Default Austrian business hours (9:00-17:00)
  - Validation for logical time ranges
- [ ] Add business logo upload functionality similar to profile picture

### Task 4.3: Service Rate Template Management
- [ ] **Priority:** High | **Estimated Time:** 2-3 hours | **Dependencies:** Task 2.1
- [ ] Create `ServiceRateTemplatesForm.tsx` component:
  - List view of existing service rate templates
  - Add/edit modal with form validation
  - Delete confirmation dialog
  - Drag-and-drop reordering (future enhancement)
- [ ] Implement Austrian therapy service categories:
  - Pre-defined categories (Massage, Consultation, Therapy, Other)
  - Duration picker with common intervals (30, 60, 90 minutes)
  - Price input with Euro formatting and validation
  - Template activation/deactivation toggles
- [ ] Add service rate template features:
  - Duplicate template functionality
  - Usage analytics (how often used in invoices)
  - Bulk operations (activate/deactivate multiple)
  - Export template list to CSV
- [ ] Integrate with invoice system for auto-population

---

## Phase 5: File Upload and Validation (3-4 hours)

### Task 5.1: Image Upload System
- [ ] **Priority:** Medium | **Estimated Time:** 2-3 hours | **Dependencies:** None
- [ ] Create file upload API endpoints:
  - `/api/upload/avatar` for profile pictures
  - `/api/upload/business-logo` for business branding
  - `/api/upload/[type]/[filename]` for file deletion
- [ ] Implement secure file handling:
  - File type validation (jpg, png, webp, svg for logos)
  - File size limits (5MB maximum)
  - Filename sanitization and UUID prefixing
  - Malware scanning (basic file header validation)
- [ ] Create reusable upload components:
  - `ImageUploader.tsx` with drag-and-drop interface
  - Image preview with crop/resize functionality
  - Progress indicators for upload status
  - Error handling for upload failures
- [ ] Add file management features:
  - Delete existing uploaded files
  - Replace existing images
  - Temporary file cleanup on upload cancellation

### Task 5.2: Advanced Validation and Error Handling
- [ ] **Priority:** Medium | **Estimated Time:** 1-2 hours | **Dependencies:** Task 2.2
- [ ] Implement comprehensive client-side validation:
  - Real-time validation on input blur
  - Austrian-specific format validation
  - Cross-field validation (e.g., VAT number required if not Kleinunternehmer)
  - Custom validation messages in German
- [ ] Create error recovery mechanisms:
  - Retry failed API requests with exponential backoff
  - Graceful degradation for network failures
  - Session expiry handling with return URL
  - Conflict resolution for concurrent edits
- [ ] Add accessibility features:
  - WCAG 2.1 AA compliance
  - Proper ARIA labels and roles
  - Keyboard navigation support
  - Screen reader compatibility testing

---

## Phase 6: Integration and Testing (4-5 hours)

### Task 6.1: System Integration
- [ ] **Priority:** High | **Estimated Time:** 2-3 hours | **Dependencies:** All previous tasks
- [ ] Integrate settings with existing MyoFlow systems:
  - Auto-populate business details in new invoices
  - Apply service rate defaults to appointment scheduling
  - Update therapist profile information across the platform
  - Sync settings changes with public mini-site generation
- [ ] Create data migration utilities:
  - Migrate existing therapist data to new schema
  - Set Austrian defaults for new fields
  - Handle data inconsistencies gracefully
  - Provide rollback capabilities for failed migrations
- [ ] Test integration points:
  - Invoice generation uses updated business settings
  - Appointment booking reflects new service rates
  - Profile changes appear in client communications
  - Settings persist correctly across user sessions

### Task 6.2: Testing and Quality Assurance
- [ ] **Priority:** High | **Estimated Time:** 2 hours | **Dependencies:** Task 6.1
- [ ] Create comprehensive test coverage:
  - Unit tests for validation schemas and utility functions
  - Integration tests for API endpoints with Austrian data
  - E2E tests for complete settings update workflows
  - Accessibility testing with automated tools
- [ ] Test Austrian-specific features:
  - Postal code validation with real Austrian addresses
  - Tax number format validation
  - VAT calculations and Kleinunternehmer legal notices
  - German language display and validation messages
- [ ] Perform browser compatibility testing:
  - Chrome, Firefox, Safari on desktop
  - Mobile browsers (iOS Safari, Chrome Mobile)
  - Responsive design across screen sizes
  - Print functionality for business information

### Task 6.3: Documentation and Deployment Preparation
- [ ] **Priority:** Medium | **Estimated Time:** 1 hour | **Dependencies:** Task 6.2
- [ ] Create user documentation:
  - Settings page user guide in German
  - Austrian tax compliance explanation
  - Service rate template best practices
  - Troubleshooting common issues
- [ ] Update technical documentation:
  - API endpoint documentation updates
  - Database schema change log
  - Integration guide for future features
  - Deployment checklist and rollback procedures
- [ ] Prepare for production deployment:
  - Environment variable configuration
  - Database migration scripts testing
  - Performance optimization checks
  - Security audit of new endpoints

---

## Acceptance Criteria

### Functional Requirements
- [ ] **Settings Dashboard Access**: Authenticated therapists can access `/dashboard/settings` with proper navigation
- [ ] **Profile Management**: Complete CRUD operations for therapist profile information
- [ ] **Business Configuration**: Austrian tax settings (VAT, Kleinunternehmer) properly configured
- [ ] **Service Rates**: Full management system for service rate templates with categories
- [ ] **File Uploads**: Profile pictures and business logos upload and management
- [ ] **Form Validation**: Real-time validation with Austrian-specific rules
- [ ] **Auto-save**: Draft changes saved automatically with user feedback

### Austrian Compliance Requirements
- [ ] **Tax Configuration**: Proper VAT vs Kleinunternehmer setup with legal notices
- [ ] **Address Validation**: Austrian postal codes and city validation
- [ ] **Phone Numbers**: Austrian phone number format validation and formatting
- [ ] **Professional Titles**: Support for Austrian medical/therapy professional designations
- [ ] **German Language**: All labels, messages, and validation in German
- [ ] **Currency Formatting**: Proper Euro currency display and input

### Technical Requirements
- [ ] **TypeScript Compliance**: All code passes strict TypeScript compilation
- [ ] **Database Integration**: New schema fields properly integrated with existing data
- [ ] **API Standards**: RESTful endpoints with proper error handling and validation
- [ ] **Performance**: Settings page loads in <2 seconds, form updates in <1 second
- [ ] **Security**: Proper authentication, input validation, and file upload security
- [ ] **Mobile Responsive**: Full functionality on mobile and tablet devices

### Integration Requirements
- [ ] **Invoice System**: Business settings auto-populate in invoice generation
- [ ] **Appointment System**: Service rates integrate with appointment scheduling
- [ ] **Dashboard Navigation**: Seamless navigation from main dashboard
- [ ] **Profile Consistency**: Settings changes reflected across all MyoFlow components
- [ ] **Data Persistence**: All settings persist correctly across user sessions

---

## Risk Assessment

### High Risk Items
- **Database Migration Complexity**: New schema fields require careful migration of existing data
- **Austrian Legal Compliance**: Tax settings must accurately reflect Austrian business law
- **File Upload Security**: Image uploads require proper validation and security measures

### Medium Risk Items
- **Form State Management**: Complex forms with auto-save may have state synchronization issues
- **API Integration**: Multiple new endpoints require thorough testing for edge cases
- **Mobile Responsiveness**: Settings interface must work well on small screens

### Mitigation Strategies
- **Incremental Testing**: Test database migrations on staging environment first
- **Legal Review**: Consult with Austrian tax expert for compliance validation
- **Security Audit**: Review all file upload endpoints for security vulnerabilities
- **Cross-browser Testing**: Test on multiple devices and browsers before deployment

---

## Dependencies and Prerequisites

### Technical Dependencies
- [ ] Existing MyoFlow authentication system (NextAuth.js)
- [ ] Current database schema and Prisma setup
- [ ] Established UI component library
- [ ] File upload infrastructure and storage

### Business Dependencies  
- [ ] Austrian tax compliance requirements documentation
- [ ] Professional therapy service category standards
- [ ] Brand guidelines and design system
- [ ] User feedback from existing MyoFlow features

### Team Dependencies
- [ ] Access to Austrian business law consultation
- [ ] Design approval for new UI components
- [ ] Database administrator for schema changes
- [ ] Security review for file upload features

This comprehensive task breakdown ensures systematic implementation of the Austrian therapist settings dashboard while maintaining high code quality, security standards, and regulatory compliance.