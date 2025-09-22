# MyoFlow Development Roadmap

## 🚀 Current Sprint: User Authentication & Trial System
**Status:** In Progress (2025-09-21)
**Goal:** Enable new user registration with 30-day trials

### ✅ Completed Today
- Database schema updated for user authentication
- Registration API endpoint created
- Password hashing with bcryptjs
- Trial tracking infrastructure

### 🔄 In Progress
- Auth system integration with database users
- Registration flow testing
- Sign-in flow with real credentials

---

## 📋 POST-MVP ROADMAP

### 1. **Admin Dashboard & Analytics** (Phase 2)
**Priority:** High
**Timeline:** After MVP launch

- **Admin role system** (ADMIN enum added to schema)
- **Platform analytics**: Revenue, user growth, trial conversions
- **User management**: View/manage all therapists
- **Support tools**: Customer impersonation, ticket system
- **Feature flags**: Enable/disable features per customer

### 2. **Clinic Module** (Phase 3) 🏥
**Priority:** High - Major Revenue Opportunity
**Timeline:** Post-MVP (next major feature)

**Key Features:**
- **Multi-therapist management** within single clinic
- **Clinic owner dashboard** with staff overview
- **Staff role management** (CLINIC_ADMIN, STAFF)
- **Centralized billing** and subscription management
- **Shared resources**: Rooms, equipment, schedules
- **Clinic branding** and public pages

**Technical Considerations:**
- New database models: Clinic, ClinicMembership
- Role hierarchy: CLINIC_OWNER > CLINIC_ADMIN > STAFF
- Billing: Clinic-level subscriptions vs per-therapist

### 3. **Pricing Tiers & Functionality** 💰
**Priority:** Critical for Revenue
**Timeline:** Before clinic module launch

**Proposed Tiers:**
- **Solo Therapist** (€29/month): Current MVP features
- **Small Clinic** (€99/month): 2-5 therapists + basic clinic features
- **Large Clinic** (€199/month): Unlimited therapists + advanced features
- **Enterprise** (Custom): White-label + integrations

**Feature Differentiation:**
- Number of therapists
- Advanced analytics
- Priority support
- API access
- Custom branding

### 4. **Integration Ecosystem** (Phase 4)
- **ÖGK direct billing** integration
- **Accounting software** APIs (BMD, RZL, DATEV)
- **Calendar integrations** (Outlook, Google Calendar)
- **Payment providers** beyond Stripe

---

## 🎯 Immediate Next Steps (This Week)
1. Complete user authentication system
2. Test full registration → trial → dashboard flow
3. Google Sign-in reactivation
4. Logo and landing page fixes
5. Basic guided onboarding tour

---

## 💡 Revenue Strategy Notes
- **Trial to paid conversion** is critical - needs onboarding optimization
- **Clinic module** could 3x revenue per customer
- **Austrian compliance** remains key differentiator
- **Freemium vs trial model** - trial better for B2B

**Last Updated:** 2025-09-21