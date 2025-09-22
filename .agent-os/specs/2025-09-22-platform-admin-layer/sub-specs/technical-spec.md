# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-09-22-platform-admin-layer/spec.md

> Created: 2025-09-22
> Version: 1.0.0

## Technical Requirements

### Authentication & Authorization
- Extend existing NextAuth.js configuration to support admin routes with separate sign-in flow at /admin/login
- Add admin role validation middleware for protecting /admin/* routes with role-based access control
- Implement admin session management with appropriate timeouts and security headers
- Create admin credential seeding system using environment variables for initial SUPER_ADMIN account

### Database Schema Extensions
- Extend Role enum in Prisma schema to include SUPER_ADMIN, SUPPORT, FINANCE roles
- Add AdminAuditLog table for tracking all admin actions with user, action, target, timestamp, and reason fields
- Add FeatureFlag table with name, enabled status, description, and optional user/role targeting
- Add SystemAnnouncement table with title, content, active status, start/end dates, and target audience
- Add AdminSession table for enhanced admin session tracking and impersonation logging

### Admin Dashboard Infrastructure
- Create new /apps/web/app/admin route structure with layout.tsx for admin-specific navigation
- Build admin middleware for role validation and audit logging on all admin actions
- Implement admin-specific UI components using existing Radix UI library with distinct admin styling
- Create admin dashboard layout with navigation for User Management, Analytics, Feature Flags, and Announcements

### User Management System
- Build therapist account listing with search, filter, and pagination using existing Prisma User queries
- Implement account enable/disable functionality with audit logging and reason tracking
- Create password reset functionality for admin use with secure token generation and email notification
- Add user detail views showing account status, subscription info, and activity metrics

### Account Impersonation Feature
- Implement secure session switching that allows SUPPORT/SUPER_ADMIN to impersonate therapist accounts
- Create impersonation middleware that logs all actions during impersonated sessions
- Add impersonation UI indicators and exit controls visible during impersonated sessions
- Ensure GDPR Article 9 compliance for health data access during impersonation

### Analytics Dashboard
- Build revenue overview using aggregated data from existing Invoice table
- Create user metrics dashboard showing total users, active users, and growth trends
- Implement basic charts using existing data without external analytics dependencies
- Add export functionality for Austrian accounting compliance (BMD/RZL/DATEV compatible)

### Feature Flags System
- Create feature flag evaluation logic that works with existing React components
- Build admin interface for managing feature flags with real-time preview capabilities
- Implement user/role-based feature targeting for controlled rollouts
- Add feature flag evaluation hooks for React components

### System Announcements
- Build announcement management interface for creating, editing, and scheduling announcements
- Implement therapist-facing announcement banner system with dismiss functionality
- Add announcement targeting by user role or account status
- Create announcement persistence to prevent re-showing dismissed announcements

### Security & Compliance
- Implement comprehensive audit logging for all admin actions with Austrian data protection compliance
- Add rate limiting and CSRF protection for admin routes
- Ensure libsodium encryption compatibility for health data access during impersonation
- Add admin action notification system for sensitive operations

## Performance Requirements

- Admin dashboard should load within 2 seconds with up to 1000 therapist accounts
- User search and filtering should respond within 500ms
- Feature flag evaluation should add minimal overhead (<10ms) to page loads
- Analytics queries should complete within 3 seconds for data up to 1 year old

## Approach

### Implementation Strategy
1. **Database First**: Extend Prisma schema with new admin tables and role enums
2. **Middleware Layer**: Build admin authentication and audit logging middleware
3. **Route Structure**: Create admin app directory with dedicated layout and navigation
4. **Component Library**: Extend existing UI components with admin-specific variants
5. **Security**: Implement role-based access control and audit logging throughout

### Integration with Existing System
- Leverage existing NextAuth.js configuration and extend with admin roles
- Use existing Prisma client and extend with admin-specific queries
- Integrate with existing libsodium encryption for secure data access
- Build on existing Radix UI component library for consistent styling

### Security Considerations
- Admin routes protected by role-based middleware
- All admin actions logged to AdminAuditLog table
- Impersonation sessions tracked and time-limited
- CSRF protection on all admin forms
- Rate limiting on admin authentication endpoints

## External Dependencies

### New Dependencies Required
- None - implementation uses existing Next.js, Prisma, NextAuth.js, and Radix UI stack

### Database Changes
- Schema migration for new admin tables (AdminAuditLog, FeatureFlag, SystemAnnouncement, AdminSession)
- Role enum extension to include admin roles
- Index optimization for admin queries and audit log searches

### Environment Variables
- `SUPER_ADMIN_EMAIL` - Initial super admin account email
- `SUPER_ADMIN_PASSWORD` - Initial super admin account password
- `ADMIN_SESSION_TIMEOUT` - Admin session timeout in minutes (default: 480)
- `AUDIT_LOG_RETENTION_DAYS` - Audit log retention period (default: 2555 - 7 years for Austrian compliance)