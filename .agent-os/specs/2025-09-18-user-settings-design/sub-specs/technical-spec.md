# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-09-18-user-settings-design/spec.md

> Created: 2025-09-18
> Version: 1.0.0

## Technical Requirements

### Frontend Architecture

#### Component Structure
```typescript
// Main Settings Page Component
/app/dashboard/settings/page.tsx

// Settings Tab Components
/components/settings/
├── ProfileSettings.tsx          // Business profile and credentials
├── TaxComplianceSettings.tsx    // Austrian VAT and Kleinunternehmer
├── TravelSettings.tsx           // Location and transport configuration
├── ServiceRatesSettings.tsx     // Therapy pricing and templates
├── SystemPreferences.tsx       // Language, notifications, formats
├── IntegrationSettings.tsx      // Export formats and API connections
├── SettingsNavigation.tsx       // Tab navigation component
└── SettingsLayout.tsx           // Shared layout and progress tracking
```

#### State Management
- **Zustand Store**: Centralized settings state with persistence
- **Form State**: React Hook Form with Austrian validation schemas
- **Cache Management**: React Query for server state synchronization
- **Optimistic Updates**: Immediate UI feedback with rollback on errors

#### Validation Framework
```typescript
// Austrian-specific validation schemas
const austrianPostalCodeSchema = z.string().regex(/^[1-9]\d{3}$/)
const austrianUIDSchema = z.string().regex(/^ATU\d{8}$/)
const kleinunternehmerThresholdSchema = z.number().max(55000)

// Professional licensing validation
const therapistLicenseSchema = z.object({
  licenseNumber: z.string().min(5),
  issuingAuthority: z.enum(['WKO', 'BMG', 'Regional']),
  expirationDate: z.date().min(new Date()),
  specializations: z.array(z.string())
})
```

### Backend Architecture

#### API Endpoint Structure
```typescript
// Settings Management Endpoints
/api/settings/
├── profile          // GET, PUT - Business profile data
├── tax-compliance   // GET, PUT - VAT status and tax settings
├── travel          // GET, PUT - Location and transport config
├── service-rates   // GET, POST, PUT, DELETE - Rate templates
├── preferences     // GET, PUT - System preferences
├── export-config   // GET, PUT - Accounting software settings
└── validation      // POST - Real-time field validation
```

#### Data Persistence Strategy
- **Atomic Updates**: Each settings category updates independently
- **Encryption**: Sensitive business data encrypted at field level
- **Versioning**: Track settings changes with timestamps and user attribution
- **Backup**: Automatic settings snapshots for disaster recovery

#### Real-time Synchronization
```typescript
// Settings update workflow
1. Client submits form data
2. Server validates against Austrian regulations
3. Encrypted storage with audit logging
4. Cache invalidation and client notification
5. Dependent system updates (invoice templates, tax calculations)
```

### Database Schema Extensions

#### Settings Tables
```sql
-- Core therapist settings (extends existing Therapist table)
ALTER TABLE "Therapist" ADD COLUMN IF NOT EXISTS
  settings_profile_completion INTEGER DEFAULT 0,
  settings_last_updated TIMESTAMP DEFAULT NOW(),
  settings_version INTEGER DEFAULT 1;

-- Professional credentials tracking
CREATE TABLE "TherapistCredentials" (
  id TEXT PRIMARY KEY,
  therapist_id TEXT REFERENCES "Therapist"(id),
  credential_type TEXT NOT NULL, -- 'license', 'certification', 'qualification'
  issuing_authority TEXT NOT NULL,
  credential_number TEXT,
  issue_date DATE,
  expiration_date DATE,
  status TEXT DEFAULT 'active',
  verification_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Travel configuration
CREATE TABLE "TravelSettings" (
  id TEXT PRIMARY KEY,
  therapist_id TEXT UNIQUE REFERENCES "Therapist"(id),
  base_address TEXT NOT NULL,
  base_coordinates POINT, -- PostGIS for geographic calculations
  transport_method TEXT DEFAULT 'car', -- 'car', 'public', 'bike', 'walk'
  rate_per_km DECIMAL(5,2),
  minimum_travel_charge DECIMAL(5,2),
  maximum_travel_distance INTEGER, -- in kilometers
  travel_buffer_minutes INTEGER DEFAULT 15,
  fuel_cost_per_100km DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- System preferences
CREATE TABLE "UserPreferences" (
  id TEXT PRIMARY KEY,
  therapist_id TEXT UNIQUE REFERENCES "Therapist"(id),
  language TEXT DEFAULT 'de', -- 'de', 'en'
  currency_format TEXT DEFAULT 'EUR',
  date_format TEXT DEFAULT 'DD.MM.YYYY',
  timezone TEXT DEFAULT 'Europe/Vienna',
  notification_appointments BOOLEAN DEFAULT true,
  notification_tax_threshold BOOLEAN DEFAULT true,
  notification_compliance BOOLEAN DEFAULT true,
  email_reminders BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Austrian Compliance Engine

#### Tax Calculation System
```typescript
interface AustrianTaxSettings {
  vatRegistered: boolean
  kleinunternehmerStatus: boolean
  currentYearRevenue: number
  vatRate: number // 20%, 10%, or 0%
  businessRegistrationNumber: string
  taxAdvisorContact?: string
}

class AustrianTaxCalculator {
  calculateVAT(amount: number, settings: AustrianTaxSettings): number
  checkKleinunternehmerThreshold(revenue: number): ThresholdStatus
  generateLegalNotice(settings: AustrianTaxSettings): string
  getApplicableVATRate(serviceType: string, settings: AustrianTaxSettings): number
}
```

#### Geographic Calculation Engine
```typescript
interface TravelCalculation {
  distance: number
  duration: number
  cost: number
  route: LatLng[]
  warnings: string[]
}

class AustrianTravelCalculator {
  async calculateTravel(
    from: Address,
    to: Address,
    settings: TravelSettings
  ): Promise<TravelCalculation>

  isWithinServiceRadius(address: Address, settings: TravelSettings): boolean
  calculateOptimalRoute(appointments: Appointment[]): Route[]
  estimateDailyTravelCosts(date: Date): number
}
```

### Security Implementation

#### Data Protection
- **Field-level Encryption**: Business registration, tax numbers, financial data
- **Access Control**: Settings changes require re-authentication for sensitive modifications
- **Audit Trail**: Complete logging of all settings modifications with timestamps
- **GDPR Compliance**: Right to export, modify, and delete all settings data

#### Austrian Regulatory Compliance
- **Data Localization**: All settings data stored within EU/Austrian jurisdiction
- **Professional Standards**: Comply with Austrian medical software regulations
- **Tax Authority Integration**: Prepare for future ÖGK and BMF API connections
- **Legal Notice Generation**: Automatic compliance text based on business configuration

## Approach

### Implementation Strategy

#### Phase 1: Core Settings Infrastructure (Week 1)
1. **Database Schema**: Create new settings tables with encryption support
2. **API Framework**: Build RESTful endpoints with validation middleware
3. **Frontend Shell**: Create settings page layout with navigation tabs
4. **Basic Forms**: Implement profile and preferences forms with validation

#### Phase 2: Austrian Compliance Features (Week 2)
1. **Tax Settings**: VAT registration and Kleinunternehmer configuration
2. **Legal Text Engine**: Automatic generation of required invoice notices
3. **Threshold Monitoring**: Real-time revenue tracking and alerts
4. **Regional Support**: Austrian state-specific holiday and regulation handling

#### Phase 3: Travel & Geographic Features (Week 3)
1. **Location Management**: Base address setting with map integration
2. **Travel Calculator**: Distance, time, and cost calculation engine
3. **Service Radius**: Geographic boundary setting with visual representation
4. **Route Optimization**: Smart scheduling with travel-aware time management

#### Phase 4: Integration & Polish (Week 4)
1. **Accounting Export**: BMD/RZL/DATEV format configuration and generation
2. **Notification System**: Configurable alerts and reminder preferences
3. **Data Migration**: Settings import/export for backup and portability
4. **Performance Optimization**: Caching, lazy loading, and mobile optimization

### Development Workflow

#### Testing Strategy
- **Unit Tests**: Comprehensive validation logic and calculation testing
- **Integration Tests**: API endpoint testing with Austrian test data
- **E2E Tests**: Complete settings workflow testing in Playwright
- **Compliance Testing**: Austrian tax and legal requirement validation

#### Deployment Approach
- **Feature Flags**: Gradual rollout of settings categories
- **Migration Scripts**: Safe database schema updates with rollback capability
- **Monitoring**: Real-time tracking of settings performance and error rates
- **Documentation**: Comprehensive API documentation and user guides

## External Dependencies

### Austrian Government APIs
- **BMF Tax Database**: Future integration for VAT number validation
- **WKO Registry**: Professional license verification (planned)
- **Austrian Postal Service**: Address validation and standardization

### Geographic Services
- **Google Maps API**: Travel calculation and route optimization
- **Austrian Geographic Service**: Precise coordinate and boundary data
- **OpenStreetMap**: Fallback geographic data for offline functionality

### Accounting Software Integration
- **BMD NTCS**: Export format specifications and API documentation
- **RZL**: Data structure requirements and validation rules
- **DATEV**: Austrian-specific format modifications and compliance

### Third-party Libraries
```json
{
  "dependencies": {
    "@googlemaps/google-maps-services-js": "^3.3.42",
    "libphonenumber-js": "^1.10.44",
    "date-fns-tz": "^2.0.0",
    "country-list": "^2.3.0",
    "validator": "^13.11.0",
    "sharp": "^0.32.6",
    "pdf-lib": "^1.17.1"
  }
}
```

### Infrastructure Requirements
- **Redis Cache**: Settings caching and session management
- **PostgreSQL Extensions**: PostGIS for geographic calculations
- **File Storage**: Secure document storage for credentials and certificates
- **Email Service**: Notification delivery and compliance alerts
- **Monitoring**: Application performance and error tracking