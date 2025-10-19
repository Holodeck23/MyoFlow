# Spec Requirements Document

> Spec: User Settings Dashboard
> Created: 2025-09-07
> Status: Planning

## Overview

Create a comprehensive settings dashboard that allows Austrian therapists to manage their professional profile, business information, service rates, and tax compliance settings. This centralized interface will streamline practice management while ensuring Austrian regulatory compliance (VAT, Kleinunternehmer status, professional designations).

The settings system integrates with existing MyoFlow components (invoices, appointments, client management) to automatically populate business details and service rates, reducing manual data entry and ensuring consistency across the platform.

## User Stories

**As an Austrian massage therapist, I want to:**

1. **Manage Professional Profile**
   - Update my professional credentials and designations
   - Set my business contact information and address
   - Configure my practice hours and availability preferences
   - Upload and manage my professional photo/logo

2. **Configure Austrian Tax Settings**
   - Set my VAT registration status and rate
   - Enable/disable Kleinunternehmer status with automatic legal notices
   - Configure tax-compliant invoice numbering sequences
   - Set up accounting software export preferences (BMD/RZL/DATEV)

3. **Manage Service Rates**
   - Create and organize service rate templates (e.g., "60min Massage - €80")
   - Set default rates for different appointment types
   - Configure seasonal or promotional pricing
   - Associate rates with specific services for quick invoice generation

4. **Customize Business Branding**
   - Upload practice logo for invoices and public mini-site
   - Set brand colors and professional styling preferences
   - Configure email signature and automated message templates
   - Manage public practice information for mini-site generation

5. **System Preferences**
   - Set default language and regional formats (Austrian German)
   - Configure notification preferences and reminder settings
   - Manage data export and backup preferences
   - Set up integration with external calendar systems

## Spec Scope

### Core Features to Implement

1. **Settings Dashboard Interface (`/dashboard/settings`)**
   - Tabbed navigation for different setting categories
   - Professional Austrian-themed UI matching existing MyoFlow design
   - Real-time form validation and error handling
   - Auto-save functionality for user convenience

2. **Professional Profile Management**
   - Therapist personal information (name, credentials, photo)
   - Business details (practice name, address, contact info)
   - Professional designations and certifications
   - Practice description and specializations

3. **Austrian Tax Compliance Settings**
   - VAT status configuration (Standard 20%, Reduced 10%, Kleinunternehmer)
   - Automatic legal notice generation for Kleinunternehmer
   - Tax-compliant invoice numbering setup
   - Accounting software export format selection

4. **Service Rate Templates System**
   - CRUD operations for service rate templates
   - Categorization by service type (massage, consultation, etc.)
   - Duration and pricing configuration
   - Default rate assignment for quick invoice creation

5. **Business Branding Configuration**
   - Logo upload and management
   - Brand color customization
   - Invoice template personalization
   - Public mini-site information setup

6. **System Integration**
   - Automatic population of business details in new invoices
   - Service rate integration with appointment scheduling
   - Profile information sync with public therapist mini-sites
   - Settings backup and restore functionality

### Database Extensions

1. **Enhanced Therapist Profile**
   - Professional credentials and designations
   - Business branding preferences
   - Tax configuration settings
   - System preferences and defaults

2. **ServiceRateTemplate Model**
   - Template name and description
   - Service category and duration
   - Pricing and tax rate association
   - Usage tracking and analytics

### API Endpoints

1. **Profile Management APIs**
   - `PUT /api/therapist/profile` - Update therapist profile
   - `POST /api/therapist/logo` - Upload practice logo
   - `GET /api/therapist/settings` - Retrieve all settings

2. **Service Rate Template APIs**
   - `GET /api/service-rates` - List all rate templates
   - `POST /api/service-rates` - Create new rate template
   - `PUT /api/service-rates/[id]` - Update existing template
   - `DELETE /api/service-rates/[id]` - Remove template

3. **Tax Settings APIs**
   - `PUT /api/therapist/tax-settings` - Update Austrian tax configuration
   - `GET /api/tax-settings/legal-notices` - Generate compliance notices

## Out of Scope

### Current Implementation Exclusions

1. **Advanced Multi-Location Support**
   - Multiple practice locations management
   - Location-specific tax configurations
   - Complex scheduling across locations

2. **Third-Party Integration APIs**
   - Direct integration with Austrian accounting software
   - Real-time tax rate updates from government APIs
   - Banking and payment gateway advanced configurations

3. **Advanced Branding Features**
   - Custom CSS editing for mini-sites
   - Advanced logo editing tools
   - Complex template customization

4. **Enterprise Features**
   - Multi-therapist practice management
   - Role-based permission systems
   - Advanced reporting and analytics

5. **Data Migration Tools**
   - Import from existing practice management systems
   - Bulk data conversion utilities
   - Legacy system integration

## Expected Deliverable

### Functional Requirements

1. **Complete Settings Interface**
   - Professional `/dashboard/settings` page with tabbed navigation
   - Responsive design working on desktop and mobile devices
   - Form validation and error handling for all input fields
   - Auto-save functionality with user feedback

2. **Austrian Compliance Integration**
   - VAT and Kleinunternehmer status configuration
   - Automatic legal notice generation for invoices
   - Tax-compliant numbering sequence setup
   - CSV export configuration for Austrian accounting software

3. **Service Rate Management**
   - Complete CRUD system for service rate templates
   - Integration with invoice creation workflow
   - Default rate assignment for appointment types
   - Rate template usage analytics

4. **Business Profile Enhancement**
   - Professional therapist profile with Austrian designations
   - Practice information management
   - Logo upload and branding configuration
   - Public mini-site information setup

### Technical Requirements

1. **Database Implementation**
   - Enhanced therapist profile schema with Austrian compliance fields
   - ServiceRateTemplate model with proper relationships
   - Migration scripts for existing therapist data
   - Data validation and constraints

2. **API Implementation**
   - RESTful endpoints for all settings operations
   - Proper authentication and authorization
   - Input validation and error handling
   - TypeScript strict compliance

3. **Integration Testing**
   - Settings changes reflect in invoice generation
   - Service rates populate correctly in appointments
   - Business details auto-fill in new invoices
   - Austrian tax calculations work correctly

4. **User Experience**
   - Intuitive navigation and form organization
   - Clear feedback for save operations
   - Professional Austrian-themed design
   - Mobile-responsive implementation

## Spec Documentation

- Tasks: @.agent-os/specs/2025-09-07-user-settings-dashboard/tasks.md
- Technical Specification: @.agent-os/specs/2025-09-07-user-settings-dashboard/sub-specs/technical-spec.md
- Database Schema: @.agent-os/specs/2025-09-07-user-settings-dashboard/sub-specs/database-schema.md
- API Specification: @.agent-os/specs/2025-09-07-user-settings-dashboard/sub-specs/api-spec.md
- Tests Coverage: @.agent-os/specs/2025-09-07-user-settings-dashboard/sub-specs/tests.md