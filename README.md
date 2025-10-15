# MyoFlow

<div align="center">
  <h3>🏥 Secure Practice Management for Austrian Therapists</h3>
  <p>A comprehensive, bilingual platform built with security-first principles</p>
  
  [![CI](https://github.com/Holodeck23/MyoFlow/workflows/CI/badge.svg)](https://github.com/Holodeck23/MyoFlow/actions)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
  [![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
  [![Prisma](https://img.shields.io/badge/Prisma-5.0+-2D3748)](https://prisma.io/)
</div>

---

## Overview

MyoFlow is a **single-tenant** practice management platform specifically designed for Austrian therapists, with primary focus on massage therapy but extensible to yoga, consulting, and product sales. Built with TypeScript and modern web technologies, it provides enterprise-grade security while maintaining ease of use.

### 🎯 Core Purpose
- **Client Management:** Secure storage with field-level encryption for sensitive health data
- **Appointment Scheduling:** Multi-location support with intelligent travel buffer management
- **Austrian Tax Compliance:** Built-in Kleinunternehmer regulation and multi-VAT rate handling
- **Public Mini-Sites:** Branded booking pages for each therapist at `/s/[slug]`
- **Revenue Tracking:** Real-time analytics and Austrian tax threshold monitoring

### 🏗️ Architecture
- **Monorepo:** Turborepo with pnpm workspaces for optimal developer experience
- **Frontend:** Next.js 14.2.13 with App Router, TypeScript strict mode, Tailwind CSS
- **Backend:** Next.js API routes with Austrian-compliant APIs, PostgreSQL + Prisma
- **Security:** libsodium field-level encryption, comprehensive audit logging, RBAC
- **Infrastructure:** Docker Compose for local development, GitHub Actions CI/CD
- **Development:** Agent OS structured workflow with Claude-Codex coordination

### 🎉 Current Status (October 2025)

**✅ MVP + Sprint 1 Complete:**
- 🔐 **Authentication** - NextAuth v5 with Google + credentials, professional UI
- 👥 **Client Management** - Complete CRUD with encryption, Austrian data fields
- 📅 **Appointment Scheduling** - Austrian holidays, conflict detection, travel buffers
- 🧾 **Invoice Generation** - Austrian tax-compliant with VAT/Kleinunternehmer support
- 📄 **PDF Generation** - Professional Austrian-formatted invoices
- ⚙️ **Therapist Profiles** - Business settings with compliance tracking
- 🔒 **Production Hardening** - All 11 Code Quality items complete (security, architecture, performance)

**🚀 Active Development (7-Sprint Plan - 2/7 Complete):**
1. ✅ **Hardening Sprint** - Security, architecture, performance (Oct 4, 2025)
2. ✅ **Runtime Performance** - Settings optimization, seed relocation (Oct 4, 2025)
3. **UX + i18n Cleanup** - Translation fixes, string extraction
4. **Settings Completion** - APIs, UI wiring, PostGIS
5. **Compliance & Reporting** - RKSV flows, live metrics
6. **E2E Reliability** - Playwright coverage expansion
7. **Polish & Launch Prep** - Final QA and launch checklist

**🔮 Post-Launch Roadmap (Archived):**
- Multi-tenancy migration
- GDPR compliance enhancement
- ÖGK integration
- Advanced analytics

See `docs/current/project-status.md` for current status and `ROADMAP.md` for detailed sprint breakdown. Historical plans are in `docs/archive/`.

---

## 🚀 Quick Start

> **New to MyoFlow?** See [DEVELOPMENT.md](./DEVELOPMENT.md) for complete setup guide.

### Prerequisites
```bash
# Required versions
node --version   # ≥ v20.0.0
pnpm --version   # ≥ v8.0.0  
docker --version # Any recent version
```

### Installation
```bash
# 1. Clone and install
git clone https://github.com/Holodeck23/MyoFlow.git
cd MyoFlow && pnpm install

# 2. Environment setup
cp .env.example .env
echo "ENCRYPTION_KEY_B64=$(openssl rand -base64 32)" >> .env
echo "INTAKE_TOKEN_SECRET=$(openssl rand -hex 32)" >> .env
echo "NEXTAUTH_SECRET=$(openssl rand -hex 32)" >> .env

# 3. Start services and database
pnpm docker:up && pnpm prisma:migrate:dev

# 4. Launch development server
pnpm dev
```

🎉 **Ready!** Visit http://localhost:3000 and sign in with `dev@myoflow.local`

---

## 📦 Architecture & Structure

### Monorepo Layout
```
MyoFlow/
├── apps/
│   └── web/                 # Next.js app (dashboard + mini-sites)
│       ├── app/            # App Router pages and API routes
│       ├── components/     # React components
│       ├── lib/           # App-specific utilities
│       └── middleware.ts  # Security headers & auth
├── packages/
│   ├── db/                # Prisma schema + migrations + seed
│   ├── lib/               # Shared business logic & utilities
│   │   ├── security/      # Encryption, tokens, permissions
│   │   ├── audit/         # Comprehensive logging system
│   │   ├── at/           # Austrian tax calculations
│   │   ├── pdf/          # Invoice PDF generation
│   │   └── i18n/         # Bilingual support (DE/EN)
│   └── ui/               # shadcn/ui components + theme
├── infra/
│   ├── docker/           # Local PostgreSQL + Redis
│   └── ci/              # GitHub Actions configuration
└── .github/workflows/   # CI pipeline
```

### Technology Stack

| **Category**      | **Technology**                           | **Purpose**                                    |
|-------------------|------------------------------------------|------------------------------------------------|
| **Frontend**      | Next.js 14, TypeScript, Tailwind CSS    | Server-side rendered React with type safety   |
| **Components**    | shadcn/ui, Radix UI primitives          | Accessible, customizable UI components        |
| **Database**      | PostgreSQL 16, Prisma ORM               | Robust data storage with type-safe queries    |
| **Authentication**| NextAuth.js, Google OAuth, Email        | Secure authentication with multiple providers |
| **Security**      | libsodium, HMAC tokens, Audit logs      | Field-level encryption and comprehensive logging|
| **Queue/Cache**   | Redis 7, BullMQ                         | Background jobs and caching                   |
| **Payments**      | Stripe (Connect + Subscriptions)        | Payment processing and marketplace features   |
| **PDF Generation**| Puppeteer, React-to-PDF                 | Austrian-compliant invoice generation         |
| **Monitoring**    | PostHog (EU), Comprehensive logging     | Privacy-focused analytics and error tracking  |

---

## 🛡️ Security Architecture

MyoFlow implements **defense-in-depth** security principles throughout the application:

### 🔐 Data Protection
- **Field-Level Encryption:** All sensitive data (health flags, notes, consent forms) encrypted with libsodium
- **Key Management:** Environment-based encryption keys, rotatable design
- **Data Classification:** Clear separation of PII, PHI, and business data

### 🔍 Access Control & Auditing
- **RBAC System:** Role-based permissions (OWNER, STAFF, ACCOUNTANT, AFFILIATE)
- **Audit Logging:** Every read/write operation on sensitive data is logged with actor, timestamp, IP
- **Permission Boundaries:** ACCOUNTANT role cannot access encrypted health data

### 🌐 Network & Transport Security
- **Security Headers:** HSTS, CSP with nonces, Referrer-Policy, Permissions-Policy
- **Rate Limiting:** Intelligent limits on authentication and public endpoints
- **CSRF Protection:** Built-in NextAuth.js CSRF protection
- **TLS Everywhere:** HTTPS enforced in production environments

### 🔑 Authentication & Sessions
- **NextAuth.js:** Industry-standard authentication with secure session management
- **2FA Ready:** TOTP scaffolding included for enhanced security
- **Token Security:** HMAC-signed intake tokens with expiration

---

## 🇦🇹 Austrian Regulatory Compliance

### Tax & Legal Framework
- **Kleinunternehmer Regulation:** Automatic tracking against 55,000€ annual threshold
- **Multi-VAT Support:** 10%, 13%, 20% rates with proper calculations
- **Invoice Compliance:** Austrian-standard PDF generation with required legal text
- **Therapist Classifications:** Support for HEILMASSEUR, MEDIZINISCHER_MASSEUR, GEWERBLICHER_MASSEUR

### Data Privacy (GDPR Ready)
- **Data Minimization:** Only collect necessary information
- **Encryption by Default:** Sensitive personal data encrypted at rest
- **Audit Trail:** Complete history of data access for compliance reporting
- **Right to Deletion:** Architecture supports data removal workflows

---

## 💼 Core Features

### 📊 Analytics Dashboard
- **Revenue Tracking:** Real-time monthly/annual revenue calculations
- **Client Insights:** New vs. returning client analysis
- **Service Performance:** Revenue breakdown by service category
- **Tax Monitoring:** Kleinunternehmer threshold progress with visual indicators
- **Location Analytics:** Multi-location revenue comparison

### 👥 Client Management
- **Secure Profiles:** Encrypted health flags and medical notes
- **Intake System:** HMAC-signed links for secure data collection
- **Contact Management:** Email, phone, address with tagging system
- **Consent Tracking:** Digital consent forms with IP and timestamp logging
- **GDPR Compliance:** Built-in data subject rights management

### 📅 Appointment System
- **Smart Scheduling:** Multi-location calendar with conflict detection
- **Travel Buffer Logic:** Automatic buffer calculation between different locations
- **Status Tracking:** BOOKED → COMPLETED → PAID workflow
- **Client Communication:** Automated reminders and confirmations (via BullMQ)

### 💰 Financial Operations
- **Invoice Generation:** Austrian-compliant PDF creation with VAT calculations
- **Payment Integration:** Stripe Connect for direct payments
- **Subscription Billing:** Recurring payment management
- **Revenue Analytics:** Real-time financial reporting and tax calculations
- **Multi-Currency:** Euro-focused with international support

### 🌐 Public Mini-Sites
- **Custom Branding:** Therapist-specific colors, logos, and styling
- **Service Catalog:** Public pricing and service descriptions
- **Online Booking:** Integration with appointment system
- **Product Sales:** Physical and digital product marketplace
- **Affiliate Program:** Revenue sharing with referral tracking

---

## 🤖 Agent OS Development Workflow

MyoFlow follows the **Agent OS structured development approach** with coordinated AI agents:

### Agent Communication Protocol
- **agents.md** - Central communication hub between Claude and Codex
- **CLAUDE.md** - Detailed session notes and implementation tracking  
- **Structured Workflow** - `/create-spec` → `/create-tasks` → execution → coordination

### Agent Responsibilities
- **Claude (Implementation)** - Feature development, UI/UX, real-time debugging, Austrian compliance
- **Codex (Infrastructure)** - System architecture, CI/CD, build optimization, environment setup
- **Coordination** - Parallel task execution with structured handoffs and status updates

### Development Phases
1. **MVP Phase** (Complete ✅) - Core Austrian therapy practice features
2. **Revenue Phase** (Next) - Multi-tenant onboarding, payment integration  
3. **Scale Phase** (Future) - Advanced features, market expansion

---

## 🔧 Traditional Development Workflow

### Branch Strategy
```bash
# Feature development
git checkout -b feature/client-management
# ... development work ...
pnpm typecheck && pnpm lint && pnpm build  # Always test before commit
git commit -m "feat: add encrypted client health records"

# Bug fixes
git checkout -b fix/invoice-pdf-generation
# ... fix implementation ...
git commit -m "fix: resolve PDF generation memory leak"
```

### Development Scripts
```bash
# Development
pnpm dev              # Start all services with hot reload
pnpm build            # Production build verification
pnpm typecheck        # TypeScript validation
pnpm lint             # ESLint + Prettier formatting
pnpm test             # Unit + integration tests (when implemented)

# Database Management
pnpm prisma:studio        # Visual database browser
pnpm prisma:migrate:dev   # Apply schema changes
pnpm prisma:generate      # Regenerate client after schema changes
pnpm prisma:reset         # Reset DB to clean state (destructive!)

# Infrastructure
pnpm docker:up    # Start PostgreSQL + Redis containers
pnpm docker:down  # Stop all containers and cleanup
```

### Testing Strategy (In Development)
- **Unit Tests:** Crypto functions, tax calculations, business logic
- **Integration Tests:** API routes, database operations, authentication
- **E2E Tests:** Critical user journeys with Playwright
- **Security Tests:** Penetration testing and vulnerability scanning

---

## 🌍 Internationalization (i18n)

### Language Support
- **Primary:** German (Austria) - `de-AT`
- **Secondary:** English (US/UK) - `en-US`
- **Extensible:** Framework ready for additional languages

### Implementation
```typescript
// Dictionary-based translations
import { getDictionary } from '@myoflow/lib/i18n'

const dict = await getDictionary('de')
console.log(dict.dashboard.title) // "Dashboard"
```

### Localization Features
- **Currency:** Euro formatting with Austrian conventions
- **Dates:** Localized date/time formatting
- **Numbers:** Austrian decimal and thousand separators
- **Legal Text:** Jurisdiction-specific terms and conditions

---

## 🔧 Environment Configuration

### Required Environment Variables
```bash
# Core Application
APP_BASE_URL=https://myoflow.at
NODE_ENV=production

# Database & Cache  
DATABASE_URL=postgresql://user:pass@localhost:5432/myoflow
REDIS_URL=redis://localhost:6379

# Security & Encryption
ENCRYPTION_KEY_B64=<32-byte-base64-key>    # libsodium encryption
INTAKE_TOKEN_SECRET=<hmac-secret>          # Intake link signing
NEXTAUTH_SECRET=<session-secret>           # Session encryption

# Authentication Providers
NEXTAUTH_URL=https://myoflow.at
GOOGLE_CLIENT_ID=<oauth-client-id>
GOOGLE_CLIENT_SECRET=<oauth-secret>

# Email/SMS Services
EMAIL_SERVER_HOST=smtp.resend.com
EMAIL_FROM="MyoFlow <noreply@myoflow.at>"
RESEND_API_KEY=<resend-key>
VONAGE_API_KEY=<sms-key>

# Payment Processing
STRIPE_SECRET_KEY=<stripe-secret>
STRIPE_WEBHOOK_SECRET=<webhook-secret>
STRIPE_CONNECT_CLIENT_ID=<connect-id>

# Optional: Analytics
POSTHOG_API_KEY=<posthog-key>
POSTHOG_HOST=https://eu.posthog.com
POSTHOG_ENABLED=true
```

---

## 📈 Deployment & Operations

### Production Deployment
- **Platform:** Vercel (recommended) or self-hosted Next.js
- **Database:** PostgreSQL with connection pooling
- **File Storage:** Local filesystem or S3-compatible storage
- **Monitoring:** PostHog for analytics, logging for errors
- **Backup:** Automated daily database backups

### Scaling Considerations
- **Single-Tenant:** Each therapist gets isolated data
- **Horizontal Scaling:** Stateless design allows multiple instances  
- **Database:** Read replicas for analytics, write master for transactions
- **CDN:** Static assets and images served via CDN

### Security Operations
- **SSL/TLS:** Automatic certificate management
- **WAF:** Web Application Firewall for attack protection
- **Monitoring:** Real-time security event monitoring
- **Updates:** Automated dependency updates with security focus

---

## 📚 Resources & Documentation

### For Developers
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Complete development guide
- [QUICK_START.md](./QUICK_START.md) - 5-minute setup for new developers
- [Security Architecture](./docs/security.md) - Detailed security documentation
- [API Reference](./docs/api.md) - Complete API documentation

### For Users
- [User Guide](./docs/user-guide.md) - Complete user documentation
- [Austrian Tax Guide](./docs/austrian-taxes.md) - Tax compliance information
- [Mini-Site Setup](./docs/mini-sites.md) - Public site configuration

### Community & Support
- **Issues:** [GitHub Issues](https://github.com/Holodeck23/MyoFlow/issues)
- **Discussions:** [GitHub Discussions](https://github.com/Holodeck23/MyoFlow/discussions)
- **Security:** security@myoflow.at for security vulnerabilities

---

## 📄 License & Legal

**MyoFlow** is proprietary software designed specifically for Austrian therapy practices. 

- **Commercial License:** Required for production use
- **Development License:** Available for approved contributors
- **Compliance:** Built to meet Austrian regulatory requirements
- **Support:** Professional support available for licensed users

**Copyright © 2024 MyoFlow. All rights reserved.**

---

<div align="center">
  <p><strong>Built with ❤️ for Austrian therapists</strong></p>
  <p>Secure • Compliant • User-Friendly</p>
</div>

