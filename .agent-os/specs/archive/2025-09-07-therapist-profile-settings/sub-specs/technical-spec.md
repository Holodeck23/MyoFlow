# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-09-07-therapist-profile-settings/spec.md

> Created: 2025-09-07
> Version: 1.0.0

## Technical Requirements

### Frontend Components

- **Settings Page Layout** - Single page at `/dashboard/settings` using Next.js App Router with responsive Tailwind CSS layout and tabbed sections for business profile, service rates, and preferences
- **Business Profile Form** - React Hook Form with Zod validation for Austrian business fields (business name, address, phone, UID number format validation, VAT status selection)
- **Service Rate Templates Interface** - CRUD interface for managing default rates per service category with inline editing, delete confirmations, and bulk actions
- **Austrian Compliance Widgets** - Specialized form components for VAT status selection with Kleinunternehmer toggle, therapist designation dropdown with explanatory tooltips, and UID number input with format validation
- **Settings Navigation** - Breadcrumb navigation and tab system using Radix UI components with proper accessibility support and keyboard navigation

### Backend API Integration

- **Profile API Routes** - RESTful endpoints at `/api/therapist/profile` for GET/PUT operations with NextAuth session validation and therapist ownership verification
- **Service Rate Templates API** - Full CRUD endpoints at `/api/therapist/service-rate-templates` with category-based filtering and default template management
- **Austrian Validation Logic** - Server-side validation for UID number format (ATU followed by 8 digits), VAT status business rules, and required field validation based on therapist designation
- **Invoice System Integration** - Modify existing invoice creation API to auto-populate business details from therapist profile and suggest rates from service templates
- **Data Encryption** - Use existing libsodium encryption for sensitive fields like IBAN and UID numbers, following established patterns in the codebase

### UI/UX Specifications

- **German-First Interface** - All form labels, validation messages, and help text in German with professional therapy terminology, following established MyoFlow language patterns
- **Responsive Design** - Mobile-first approach using Tailwind CSS with proper form layouts on mobile devices and tablet-optimized views for settings management
- **Accessibility Implementation** - Proper form labels, ARIA descriptions for complex fields, keyboard navigation support, and focus management following WCAG 2.1 AA standards
- **Visual Feedback System** - Success notifications for saved settings, inline validation with clear error messages, and loading states for all async operations
- **Professional Styling** - Consistent with existing MyoFlow design system using established color palette, typography hierarchy, and component styling patterns

### Integration Requirements

- **Existing Database Schema** - Extend current Therapist model with additional fields without breaking existing relationships or data integrity
- **Invoice PDF Generation** - Modify existing Puppeteer templates to include business profile information with proper Austrian legal formatting and layout
- **Service Management System** - Connect service rate templates to existing Service model for default pricing and streamlined service creation workflows  
- **Authentication Integration** - Use existing NextAuth.js session management with therapist-level authorization and proper data isolation
- **Audit Trail Integration** - Log profile changes using existing audit system for compliance and change tracking

### Performance Criteria

- **Page Load Performance** - Settings page loads under 200ms with proper loading states and progressive enhancement for complex forms
- **Form Validation Speed** - Real-time validation with debounced input handling and optimistic UI updates for better user experience
- **API Response Times** - All profile API endpoints respond within 100ms for read operations and 300ms for write operations under normal load
- **Database Query Optimization** - Use existing Prisma query patterns with proper indexing for therapist-specific data retrieval and efficient joins

## Approach

### Development Phases

1. **Database Schema Extensions** - Add new fields to existing Therapist model for business profile information and service rate template storage
2. **API Layer Implementation** - Create new endpoints following existing patterns with proper validation and error handling
3. **Frontend Component Development** - Build reusable form components with Austrian-specific validation and styling
4. **Integration Testing** - Ensure seamless integration with existing invoice system and service management features
5. **User Acceptance Testing** - Test with Austrian therapy practice requirements and regulatory compliance needs

### Technical Strategy

- Leverage existing MyoFlow architecture and established patterns for consistency
- Use TypeScript strict mode throughout for type safety and better developer experience  
- Implement progressive enhancement to ensure functionality without JavaScript
- Follow existing security patterns for data encryption and session management
- Maintain backward compatibility with existing invoice and service data

## External Dependencies

### Required Libraries

- **React Hook Form** - Already in use for form management with Zod validation integration
- **Zod** - Existing validation library for schema validation and TypeScript inference
- **Radix UI** - Used throughout MyoFlow for accessible component primitives and tab navigation
- **Tailwind CSS** - Established styling framework with existing design system components
- **libsodium** - Already implemented for field-level encryption of sensitive data

### Austrian Compliance Resources

- **Austrian VAT Rates** - Current standard rate (20%) and reduced rates for therapy services
- **UID Number Validation** - ATU prefix format validation following Austrian business registry standards
- **Kleinunternehmer Regulations** - €30,000 annual revenue threshold and legal notice requirements
- **Therapy Professional Standards** - Austrian massage therapy and physiotherapy designation requirements

### Integration Points

- **Existing Prisma Schema** - Therapist, Invoice, and Service models require careful extension without breaking changes
- **NextAuth Session Management** - Use established authentication patterns for therapist-level authorization
- **Puppeteer PDF Templates** - Extend existing invoice PDF generation with business profile information
- **Audit System** - Leverage existing audit trail implementation for profile change tracking