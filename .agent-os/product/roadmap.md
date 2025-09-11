# Product Roadmap

## Phase 1: MVP Foundation (COMPLETED)

**Goal:** Complete core therapy practice management functionality
**Success Criteria:** Wife uses daily instead of Excel/Word workflows

### Features

- [x] Authentication System - NextAuth.js with email + Google OAuth `M`
- [x] Client Management - Full CRUD with Austrian data fields, search, tags `L`
- [x] Appointment Scheduling - Austrian holidays, conflict detection, professional UI `L`
- [x] Invoice Generation - Austrian-compliant VAT calculations, sequential numbering `L`
- [x] PDF Export System - Puppeteer-based professional invoice PDFs `M`

### Dependencies

- PostgreSQL database setup
- Vercel deployment pipeline
- Austrian business rule validation

## Phase 2: Revenue Optimization (IN PROGRESS - Sprint 1.5)

**Goal:** Transform from admin tool to revenue-growing business system
**Success Criteria:** 15-25% increase in practice profitability, validated market demand from Austrian therapists

### Features

- [x] PDF Invoice Downloads - Professional Austrian-format invoices with download API `S`
- [x] Service Rate Defaults - Therapist profile settings with pricing templates (Sprint 1.5 IN PROGRESS) `M`
- [ ] CSV Accounting Exports - BMD/RZL/DATEV integration for tax preparation `M`
- [ ] Client Retention Analytics - Lifetime value tracking and churn analysis `L`
- [ ] Automated Follow-up System - Reactivation emails and wellness check-ins `L`
- [ ] Multi-tenant Onboarding - Registration flow with practice setup wizard `L`
- [ ] Stripe Subscription Integration - €50-200/month billing with Austrian VAT `M`

### Dependencies

- Email service integration (Resend/SendGrid)
- Stripe Connect setup for payments
- Multi-tenant database isolation

## Phase 3: Scale and Polish (PLANNED)

**Goal:** Expand market reach and enterprise features
**Success Criteria:** Established Austrian market presence, referral program active

### Features

- [ ] Client Portal - Self-service appointment booking and invoice viewing `XL`
- [ ] Advanced Scheduling - Resource allocation, team calendars, availability rules `L`
- [ ] Package Deal Management - Treatment packages with automatic billing `M`
- [ ] Wellness Program Templates - Pre-built campaigns for client engagement `M`
- [ ] Mobile App - Native iOS/Android for on-the-go practice management `XL`
- [ ] Referral Program - Automated affiliate tracking and payouts `L`
- [ ] RKSV Compliance - Cash register integration for larger practices `XL`

### Dependencies

- Mobile development team
- Advanced email automation platform
- Legal compliance review for affiliate program

## Phase 4: Advanced Features (FUTURE)

**Goal:** Enterprise-grade functionality and market leadership
**Success Criteria:** €2000+ MRR, enterprise client acquisitions

### Features

- [ ] AI Treatment Recommendations - Machine learning for personalized therapy plans `XL`
- [ ] Inventory Management - Product sales, stock tracking, supplier integration `L`
- [ ] Advanced Analytics - Predictive client behavior, revenue forecasting `L`
- [ ] Multi-location Support - Chain management with centralized reporting `XL`
- [ ] Integration Marketplace - Third-party app ecosystem and API platform `XL`
- [ ] Therapist Wellness Tracking - Burnout prevention and self-care logging `M`
- [ ] Telehealth Integration - Video consultations and remote monitoring `XL`

### Dependencies

- Machine learning infrastructure
- Enterprise sales team
- Advanced data warehouse setup

## Phase 5: Enterprise Features (LONG-TERM)

**Goal:** Enterprise market penetration and platform ecosystem
**Success Criteria:** Market leadership, white-label partnerships

### Features

- [ ] White-label Solutions - Customizable platform for therapy chains `XL`
- [ ] Advanced Reporting Suite - Business intelligence dashboard for multi-location `XL`
- [ ] Compliance Automation - Auto-updating regulatory requirements `L`
- [ ] International Expansion - German, Swiss market adaptations `XL`
- [ ] API Ecosystem - Developer platform with third-party integrations `XL`
- [ ] Advanced Security - SOC2 compliance, penetration testing `L`
- [ ] Enterprise SSO - Active Directory, SAML integration `M`

### Dependencies

- Enterprise development team
- International legal compliance research
- SOC2 audit partnership