# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-09-15-figma-ui-transition/spec.md

> Created: 2025-09-15
> Version: 1.0.0

## Endpoints

### Preserved Endpoints (No Changes)
All existing API routes will remain unchanged to ensure zero breaking changes:

- **GET/POST/PUT/DELETE /api/clients/[id]** - Client management with Austrian data fields
- **GET/POST/PUT/DELETE /api/appointments/[id]** - Appointment scheduling with Austrian holiday integration
- **GET/POST/PUT/DELETE /api/invoices/[id]** - Invoice generation with Austrian VAT compliance
- **GET /api/therapist/profile** - Therapist profile and Kleinunternehmer tracking
- **GET /api/auth/[...nextauth]** - Authentication endpoints via NextAuth.js

### Frontend-Backend Integration Points

#### Dashboard Data Loading
- **Purpose**: Load dashboard metrics and Kleinunternehmer status for hero widget
- **Current Endpoints**: Multiple GET requests to /api/appointments, /api/invoices, /api/therapist/profile
- **UI Enhancement**: Add professional loading skeletons and error states while maintaining existing data flow

#### Form Submission Workflows
- **Purpose**: Handle client/appointment/invoice creation and updates
- **Current Endpoints**: POST/PUT requests with existing validation schemas
- **UI Enhancement**: Rebuild form components with Figma styling while preserving exact request payloads

#### Austrian Compliance Data Display
- **Purpose**: Show Kleinunternehmer progress, VAT calculations, invoice compliance status
- **Current Endpoints**: GET /api/therapist/profile, /api/invoices with Austrian business logic
- **UI Enhancement**: Professional data visualization matching Figma design without changing underlying calculations

## Controllers

### Client Management Controller Preservation
- **Existing Logic**: Complete CRUD operations with Austrian data fields, search/filtering, notes system
- **UI Integration**: Rebuild client listing, profile, and editing interfaces while maintaining exact API contracts
- **Validation**: Preserve existing Zod schemas and error handling, enhance error presentation only

### Appointment Scheduling Controller Preservation
- **Existing Logic**: Austrian holiday integration, conflict detection, recurrence handling
- **UI Integration**: Professional calendar interface and appointment cards while maintaining existing scheduling logic
- **Data Flow**: Preserve appointment listing, creation, and update workflows with enhanced mobile-friendly UI

### Invoice Generation Controller Preservation
- **Existing Logic**: Austrian VAT compliance, Kleinunternehmer handling, sequential numbering, PDF generation
- **UI Integration**: Professional invoice management interface while maintaining exact business calculations
- **Austrian Compliance**: Zero changes to tax logic, legal notices, or compliance tracking

### Error Handling Preservation
- Maintain existing API error response formats
- Enhance error UI presentation with professional messaging
- Preserve validation error handling for Austrian compliance fields