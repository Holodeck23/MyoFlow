# User Settings Design Specification

> Spec: Comprehensive User Settings for Austrian Therapy Practice Management
> Created: 2025-09-18
> Status: Planning

## Overview

Design and implement a comprehensive user settings system for MyoFlow that addresses the unique requirements of Austrian therapy practice management. This system will provide therapists with complete control over their professional profile, Austrian tax compliance settings, travel configurations, and system preferences while maintaining the highest standards of data security and regulatory compliance.

The settings system will transform MyoFlow from a basic practice management tool into a fully configurable Austrian medical software platform, enabling practitioners to customize every aspect of their workflow to match their specific business needs and legal requirements.

## User Stories

**As an Austrian therapist setting up my practice:**
- I want to configure my professional profile with business registration details so my invoices are legally compliant
- I want to set my VAT status (Kleinunternehmer vs. standard) so tax calculations are automatic and accurate
- I want to configure my base location and travel preferences so appointment scheduling includes realistic travel time
- I want to set up my service rates and therapy offerings so invoicing reflects my actual practice

**As a solo practitioner managing Austrian tax compliance:**
- I want real-time Kleinunternehmer threshold tracking so I know when I'm approaching the €55,000 limit
- I want configurable VAT rates for different services so my invoices comply with Austrian tax law
- I want export preferences for my accounting software (BMD/RZL/DATEV) so bookkeeping is streamlined
- I want automatic legal notice generation so my invoices include required Austrian compliance text

**As a mobile therapist providing home visits:**
- I want to set my travel rates per kilometer and transport method so travel costs are calculated accurately
- I want to configure my service radius and preferred routes so scheduling respects my geographic limitations
- I want travel buffer time settings so appointments include realistic preparation and transition time
- I want fuel cost tracking and mileage logging for tax deduction purposes

**As a professional therapist maintaining quality standards:**
- I want to manage my qualifications and certifications so clients see my credentials
- I want to set notification preferences for appointment reminders and compliance alerts
- I want language preferences (German/English) that apply consistently across the entire system
- I want to customize my public booking page appearance and available services

**As a grant application reviewer (Upper Austria focus):**
- I want to see sophisticated business configuration options demonstrating software maturity
- I want evidence of Austrian regulatory compliance built into core functionality
- I want professional medical software standards reflected in the settings interface design

## Spec Scope

### In Scope

#### Core Settings Categories
- **Professional Profile Management**: Business info, credentials, contact details, public page configuration
- **Austrian Tax Compliance**: VAT registration, Kleinunternehmer status, threshold tracking, legal notices
- **Travel & Location Configuration**: Base location, transport methods, rates, service radius, buffer times
- **Service Rate Templates**: Therapy types, pricing, VAT handling, package deals
- **System Preferences**: Language toggle, date/currency formats, notification settings
- **Integration & Export**: BMD/RZL/DATEV preferences, CSV format configuration, API connections

#### Technical Implementation
- **Form Validation**: Austrian postal codes, UID numbers, professional licensing validation
- **Data Persistence**: Secure storage with field-level encryption for sensitive business data
- **Real-time Updates**: Immediate application of settings changes across the system
- **Backup & Migration**: Settings export/import for data portability
- **Audit Logging**: Track changes to critical business settings for compliance

#### Austrian Compliance Features
- **Automatic Legal Text**: Generate required invoice notices based on tax status
- **Threshold Monitoring**: Real-time tracking of Kleinunternehmer revenue limits
- **Regional Settings**: Support for all 9 Austrian Bundesländer with specific holiday calendars
- **Professional Standards**: Comply with Austrian medical software regulations and data protection

### Out of Scope

- **Multi-user Management**: Settings remain single-therapist focused for MVP
- **Advanced Integrations**: Direct API connections to ÖGK or complex ERP systems
- **Financial Analytics**: Detailed revenue reporting and business intelligence
- **Custom Branding**: Logo uploads and extensive visual customization
- **Third-party Services**: Integration with external booking platforms or payment processors
- **Mobile App Settings**: Focus on web application configuration only

## Expected Deliverable

A complete user settings system that transforms MyoFlow into a fully configurable Austrian therapy practice management platform:

### 1. Professional Settings Dashboard
- **Intuitive Navigation**: Clean tabbed interface with logical grouping of related settings
- **Progress Tracking**: Visual indicators showing profile completion and compliance status
- **Quick Actions**: One-click access to most common configuration changes
- **Mobile Responsive**: Professional appearance and full functionality on all devices

### 2. Austrian Business Compliance
- **Tax Status Management**: Complete VAT registration and Kleinunternehmer configuration
- **Legal Compliance**: Automatic generation of required invoice notices and legal text
- **Threshold Monitoring**: Real-time tracking and alerts for tax status changes
- **Regional Support**: Full compatibility with Austrian federal and state regulations

### 3. Travel-Aware Configuration
- **Location Management**: Precise base location setting with map integration
- **Transport Configuration**: Multiple vehicle types with custom rates and costs
- **Geographic Boundaries**: Service radius with visual map representation
- **Time Management**: Buffer times, travel speeds, and scheduling constraints

### 4. Service & Pricing Management
- **Rate Templates**: Professional therapy service configuration with Austrian pricing
- **VAT Handling**: Automatic tax calculations based on service type and business status
- **Package Deals**: Multi-session pricing with compliance-aware invoicing
- **Professional Credentials**: Qualification management with public display options

### 5. System Integration
- **Accounting Export**: BMD/RZL/DATEV compatible data formats with custom field mapping
- **Language Localization**: Complete German/English toggle with persistent preferences
- **Notification Center**: Configurable alerts for appointments, compliance, and business milestones
- **Data Management**: Secure backup, restore, and migration capabilities

The deliverable will establish MyoFlow as a professional-grade Austrian medical software solution, providing practitioners with the configuration flexibility and compliance assurance required for successful therapy practice management.

## Spec Documentation

- Tasks: @.agent-os/specs/2025-09-18-user-settings-design/tasks.md
- Technical Specification: @.agent-os/specs/2025-09-18-user-settings-design/sub-specs/technical-spec.md
- UI/UX Specification: @.agent-os/specs/2025-09-18-user-settings-design/sub-specs/ui-ux-spec.md
- Database Schema: @.agent-os/specs/2025-09-18-user-settings-design/sub-specs/database-schema.md
- API Specification: @.agent-os/specs/2025-09-18-user-settings-design/sub-specs/api-spec.md
- Testing Specification: @.agent-os/specs/2025-09-18-user-settings-design/sub-specs/tests.md