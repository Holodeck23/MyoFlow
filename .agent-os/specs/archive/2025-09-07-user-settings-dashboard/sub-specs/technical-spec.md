# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-09-07-user-settings-dashboard/spec.md

> Created: 2025-09-07
> Version: 1.0.0

## Technical Requirements

### Frontend Architecture

#### Page Structure
- **Route:** `/dashboard/settings`
- **Layout:** Uses existing dashboard layout wrapper (`@/components/dashboard-layout`)
- **Navigation:** Add "Settings" link to main dashboard sidebar
- **Page Component:** `apps/web/app/dashboard/settings/page.tsx`

#### Component Hierarchy
```
SettingsPage
├── SettingsHeader (breadcrumb + title)
├── SettingsTabs (profile, business, notifications, security)
├── ProfileSettingsForm
├── BusinessSettingsForm  
├── NotificationSettingsForm
└── SecuritySettingsForm
```

#### State Management
- **Form State:** React Hook Form with Zod validation
- **API State:** TanStack Query for server state management
- **Local State:** React useState for UI interactions (tabs, modals, loading states)
- **Optimistic Updates:** Client-side updates with server reconciliation

### Form Validation Requirements

#### Profile Form Validation
```typescript
const profileSchema = z.object({
  firstName: z.string().min(2, "Vorname muss mindestens 2 Zeichen lang sein"),
  lastName: z.string().min(2, "Nachname muss mindestens 2 Zeichen lang sein"),
  email: z.string().email("Ungültige E-Mail-Adresse"),
  phone: z.string()
    .regex(/^(\+43|0043|0)[1-9]\d{1,14}$/, "Ungültige österreichische Telefonnummer")
    .optional(),
  dateOfBirth: z.date().max(new Date(), "Geburtsdatum kann nicht in der Zukunft liegen").optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).optional(),
  bio: z.string().max(1000, "Bio darf maximal 1000 Zeichen haben").optional()
})
```

#### Business Form Validation
```typescript
const businessSchema = z.object({
  businessName: z.string().min(2, "Firmenname erforderlich"),
  businessAddress: z.object({
    street: z.string().min(1, "Straße erforderlich"),
    city: z.string().min(1, "Stadt erforderlich"),
    postalCode: z.string().regex(/^\d{4}$/, "Ungültige österreichische PLZ"),
    country: z.literal("AT")
  }),
  taxNumber: z.string()
    .regex(/^ATU\d{8}$/, "Ungültige österreichische UID-Nummer")
    .optional(),
  isKleinunternehmer: z.boolean(),
  defaultVatRate: z.number().min(0).max(100).optional(),
  businessPhone: z.string()
    .regex(/^(\+43|0043|0)[1-9]\d{1,14}$/, "Ungültige Telefonnummer")
    .optional(),
  businessEmail: z.string().email("Ungültige E-Mail-Adresse").optional(),
  website: z.string().url("Ungültige Website-URL").optional()
})
```

### UI/UX Specifications

#### Design System Compliance
- **Color Scheme:** Follow existing MyoFlow Austrian branding
- **Typography:** Inter font family, consistent heading hierarchy
- **Spacing:** Tailwind CSS spacing scale (4px base unit)
- **Components:** Reuse existing UI components from `@/components/ui/`

#### Responsive Design Requirements
- **Desktop (≥1024px):** Two-column layout, sidebar navigation + content
- **Tablet (768px-1023px):** Single column with collapsible sidebar
- **Mobile (≤767px):** Full-width stack layout with bottom tab navigation

#### Form UX Patterns
- **Auto-save:** Draft changes saved every 30 seconds to localStorage
- **Validation:** Real-time validation on blur, inline error messages
- **Loading States:** Skeleton loaders during data fetching
- **Success Feedback:** Toast notifications for successful updates
- **Error Handling:** Form-level and field-level error display

#### Accessibility Requirements
- **WCAG 2.1 AA Compliance:** All form controls properly labeled
- **Keyboard Navigation:** Full keyboard accessibility with tab order
- **Screen Readers:** Proper ARIA labels and role attributes
- **Color Contrast:** 4.5:1 minimum contrast ratio for all text
- **Focus Management:** Visible focus indicators and proper focus handling

### Integration Points

#### Database Integration
- **User Profile Updates:** PATCH `/api/users/profile` endpoint
- **Business Settings:** PATCH `/api/users/business` endpoint  
- **Service Rate Templates:** CRUD operations via `/api/service-rates` endpoints
- **Notification Preferences:** PATCH `/api/users/notifications` endpoint

#### Authentication Integration
- **Session Validation:** Middleware ensures authenticated access only
- **Profile Picture Upload:** Integration with file upload service
- **Email Change Flow:** Email verification required for email updates
- **Password Change:** Secure password update with current password verification

#### Existing System Integration
- **Invoice System:** Business settings auto-populate invoice templates
- **Appointment System:** Service rate defaults applied to new appointments
- **Client System:** Therapist contact info displayed in client communications
- **Dashboard Layout:** Seamless integration with existing navigation

### Austrian-Specific Requirements

#### Localization
- **Language:** German language for all labels, messages, and validation
- **Date Format:** DD.MM.YYYY (Austrian standard)
- **Phone Format:** Austrian phone number validation and formatting
- **Address Format:** Austrian postal code validation (4-digit)
- **Currency:** Euro (€) symbol and formatting

#### Compliance Features
- **Tax Configuration:** Kleinunternehmer vs VAT-registered business setup
- **Legal Information:** Required business information fields
- **Data Privacy:** GDPR-compliant data handling and user controls
- **Professional Credentials:** Support for Austrian therapy certifications

#### Business Logic
- **VAT Rate Defaults:** 20% standard rate, 10%/13% reduced rates available
- **Invoice Numbering:** Sequential numbering format configuration
- **Service Categories:** Pre-defined Austrian therapy service types
- **Holiday Calendar:** Integration with Austrian federal/state holidays

### Performance Requirements

#### Loading Performance
- **Initial Load:** Settings page loads in <2 seconds
- **Form Submission:** Updates complete in <1 second
- **Image Upload:** Profile pictures upload in <5 seconds
- **Bundle Size:** Settings page code split to reduce main bundle

#### Caching Strategy
- **User Data:** Cache user profile data with 5-minute TTL
- **Service Rates:** Cache service rate templates client-side
- **Static Data:** Cache dropdown options (countries, currencies) indefinitely
- **Optimistic Updates:** Immediate UI updates with server reconciliation

#### Error Recovery
- **Network Failures:** Retry failed requests with exponential backoff
- **Validation Errors:** Maintain form state during server validation failures
- **Session Expiry:** Graceful redirect to login with return URL
- **Data Conflicts:** Conflict resolution for concurrent updates

## Approach

### Implementation Strategy

#### Phase 1: Core Infrastructure
1. Create settings page route and layout structure
2. Implement tabbed navigation component
3. Set up form validation schemas and error handling
4. Create reusable form components for settings

#### Phase 2: Profile & Business Settings  
1. Implement profile settings form with validation
2. Build business settings form with Austrian compliance
3. Add service rate template management interface
4. Integrate profile picture upload functionality

#### Phase 3: Advanced Features
1. Implement notification preferences management
2. Add security settings (password change, 2FA setup)
3. Create data export/import functionality
4. Add theme and language preference controls

#### Phase 4: Polish & Optimization
1. Implement auto-save and draft recovery
2. Add comprehensive error handling and recovery
3. Optimize performance with code splitting and caching
4. Complete accessibility testing and improvements

### Development Considerations

#### Code Organization
- **Page Component:** Single responsible settings page with tab routing
- **Form Components:** Separate components for each settings category
- **Validation Schemas:** Centralized Zod schemas with Austrian localization
- **API Integration:** Custom hooks for each settings endpoint

#### Testing Strategy
- **Unit Tests:** Form validation logic and component behavior
- **Integration Tests:** API endpoint integration and data flow
- **E2E Tests:** Complete user workflows for settings updates
- **Accessibility Tests:** Automated accessibility compliance testing

#### Security Considerations
- **Data Validation:** Server-side validation mirrors client-side rules
- **File Uploads:** Secure image upload with type and size validation
- **Sensitive Data:** Encrypt sensitive business information at rest
- **Audit Trail:** Log all settings changes for compliance and debugging

## External Dependencies

No additional external dependencies required. The implementation will use the existing Next.js/React/TypeScript technology stack with current dependencies:

- **Form Management:** React Hook Form (already installed)
- **Validation:** Zod (already installed) 
- **State Management:** TanStack Query (already installed)
- **UI Components:** Existing MyoFlow component library
- **Styling:** Tailwind CSS (already configured)
- **File Upload:** Built-in Next.js API routes with existing file handling