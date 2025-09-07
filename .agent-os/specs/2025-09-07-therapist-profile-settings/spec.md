# Spec Requirements Document

> Spec: Therapist Profile Settings System
> Created: 2025-09-07
> Status: Planning

## Overview

Implement a comprehensive therapist profile and settings system that allows therapists to manage their business information, service rate defaults, and Austrian compliance settings. This system will streamline invoice creation by pre-populating business details and service rates, while ensuring Austrian regulatory compliance for therapy practices.

## User Stories

### Business Profile Management

As a massage therapist in Austria, I want to maintain my business profile information in one central location, so that my invoices automatically include correct business details, legal notices, and contact information without manual entry each time.

The therapist accesses `/dashboard/settings`, fills out business name, address, UID number, VAT status, and saves the information. When creating invoices, this information auto-populates in the PDF templates with proper Austrian legal formatting.

### Service Rate Defaults

As a therapy practice owner, I want to set default rates for my services by category, so that when I create new services or invoices, the pricing is automatically filled in rather than requiring manual entry every time.

The therapist navigates to service rate settings, defines default pricing for massage categories (60min massage: €80, 30min massage: €50), and when creating new appointments or invoices, these rates are automatically suggested based on the service type selected.

### Austrian Compliance Settings

As an Austrian therapist, I want to configure my VAT status and legal designation once, so that all generated invoices include the correct legal notices, VAT calculations, and professional designations required by Austrian law.

The therapist sets their designation (Heilmasseur, Medizinischer Masseur, etc.), configures Kleinunternehmer status, and all subsequent PDF invoices automatically include the appropriate legal disclaimers and VAT handling.

## Spec Scope

1. **Business Profile Form** - Single settings page allowing therapists to enter and update business name, address, contact details, and Austrian compliance information (UID number, VAT status, designation)

2. **Service Rate Templates** - Interface to define default pricing for service categories that auto-populate when creating new services or invoices

3. **Settings Integration** - Connect profile settings to existing invoice PDF generation so business information automatically appears on generated invoices

4. **Profile Validation** - Austrian-specific validation for UID number format, required fields based on VAT status, and business designation requirements

5. **Database Schema Extensions** - Extend existing Therapist model with new fields for business information and create service rate defaults storage

## Out of Scope

- Profile completion wizard or onboarding flow (future enhancement)
- Advanced service template system with multiple named templates (future enhancement)  
- File upload for business logos or documents (future enhancement)
- Multi-location business settings (future enhancement)
- RKSV cash register compliance settings (future feature)

## Expected Deliverable

1. **Functional Settings Page** - Therapist can access `/dashboard/settings`, update all business information, service rates, and Austrian compliance settings with proper validation and save functionality

2. **Invoice Integration** - When generating PDF invoices, business information from settings automatically populates in the invoice template with correct Austrian legal formatting and VAT calculations

3. **Service Rate Defaults** - When creating new services, default rates are suggested based on configured templates, and invoice line items auto-populate with these rates when services are selected

## Spec Documentation

- Tasks: @.agent-os/specs/2025-09-07-therapist-profile-settings/tasks.md
- Technical Specification: @.agent-os/specs/2025-09-07-therapist-profile-settings/sub-specs/technical-spec.md