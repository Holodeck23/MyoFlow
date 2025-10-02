# Multi-Tenancy Migration Plan

## Current Architecture Analysis
- **Single-tenant per therapist**: Each User → Therapist (1:1)
- **Data isolation**: All models scoped by `therapistId`
- **Authentication**: NextAuth with user-level auth

## Target Multi-Tenant Architecture

### 1. Organization/Tenant Model
Add `Organization` as the top-level tenant boundary:
```
Organization (Tenant)
├── Users (multiple)
├── Therapists (multiple)
├── Shared Resources (locations, services, etc.)
```

### 2. Database Schema Changes Required

#### New Models
- `Organization` - Tenant boundary
- `OrganizationMembership` - User-to-Organization many-to-many
- `OrganizationSettings` - Tenant-specific configuration

#### Modified Models
- Add `organizationId` to all tenant-scoped models
- Update foreign key relationships
- Maintain `therapistId` for therapist-specific data

### 3. Migration Strategy

#### Phase 1: Schema Extension (Safe)
- Add `Organization` models without breaking existing structure
- Add optional `organizationId` fields
- Create migration to auto-create organizations for existing therapists

#### Phase 2: Data Migration
- Migrate existing single-tenant data to organization structure
- Update all API endpoints to be organization-aware
- Add organization-level access controls

#### Phase 3: UI Updates
- Add organization selection/switching
- Update all forms and APIs to pass `organizationId`
- Add organization management interface

### 4. Access Control Model

#### Roles
- **Organization Admin**: Full access to organization
- **Therapist**: Access to own clients + shared resources
- **Receptionist**: Limited access (appointments, basic client info)
- **Billing**: Invoice and payment access only

#### Data Scoping
- Organization-level: Settings, locations, services, billing
- Therapist-level: Clients, appointments, personal notes
- Shared: Organization users can see each other's availability

### 5. API Changes Required

#### Authentication Flow
```
User Login → Organization Selection → Role-based Access
```

#### Middleware Updates
- Add organization context to all API routes
- Verify user has access to requested organization
- Scope all database queries by `organizationId`

### 6. Benefits of Multi-Tenancy

#### For Practices
- Multiple therapists share resources
- Unified billing and reporting
- Centralized client management
- Cross-therapist scheduling

#### For SaaS Business
- Higher revenue per customer
- Better retention (harder to switch)
- Economies of scale
- Enterprise sales opportunities

### 7. Implementation Priority

#### Critical Path
1. Database schema changes
2. Authentication middleware updates
3. Core API endpoint updates
4. UI organization context

#### Estimated Timeline
- **Phase 1**: 1-2 weeks (schema + migration)
- **Phase 2**: 2-3 weeks (API updates)
- **Phase 3**: 2-3 weeks (UI updates)
- **Total**: 5-8 weeks for full migration

### 8. Risk Mitigation

#### Backward Compatibility
- Keep existing single-therapist organizations working
- Gradual migration path for existing customers
- Feature flags for multi-tenant features

#### Data Integrity
- Comprehensive migration testing
- Database backups before schema changes
- Rollback procedures documented

### 9. Austrian Compliance Impact

#### GDPR Considerations
- Organization-level DPA agreements
- Cross-therapist data access policies
- Audit logging for organization-level access

#### Tax Implications
- Individual therapist VAT status maintained
- Organization-level billing consolidation option
- Separate Kleinunternehmer tracking per therapist

## Recommendation

**Proceed with migration** - Multi-tenancy will significantly improve:
- Market positioning (compete with enterprise solutions)
- Revenue potential (practice-wide subscriptions)
- Feature capabilities (team scheduling, shared resources)

Start with Phase 1 (schema) immediately to establish foundation.