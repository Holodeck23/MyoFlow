# 🚀 MyoFlow Technical Roadmap

**Project Manager:** You  
**Senior Developer:** Claude Code  
**Target:** Austrian Therapy Practice Management → Market Leadership

---

## 📊 **Project Status Dashboard**

**Current Phase:** Foundation Complete → MVP Development  
**Next Milestone:** Working authentication system  
**Technical Debt:** None (foundation solid)  
**Blocking Issues:** CI pipeline (in progress)

---

## 🏗️ **Technical Architecture Status**

### ✅ **Foundation Layer (COMPLETE)**
- [x] Turborepo monorepo with pnpm workspaces
- [x] Next.js 14 with App Router + TypeScript strict
- [x] Prisma schema with Austrian compliance requirements
- [x] Security framework (libsodium, audit logging, RBAC)
- [x] CI/CD pipeline with GitHub Actions
- [x] Development workflow and operational rules

### 🔄 **Infrastructure Layer (IN PROGRESS)**
- [x] Docker Compose for local development
- [x] PostgreSQL + Redis setup
- [ ] Environment configuration validation
- [ ] Database migration strategy
- [ ] Error monitoring setup

### ⏳ **Application Layer (PENDING)**
- [ ] Authentication system
- [ ] Core UI components
- [ ] API route structure
- [ ] Client-side routing
- [ ] Form validation system

---

## 🎯 **Phase 1: MVP Core (Target: 2 weeks)**

### **Sprint 1.1: Authentication Foundation**
**Branch:** `feature/auth-system`  
**Acceptance Criteria:**
- [ ] Email sign-in flow works end-to-end
- [ ] Protected routes redirect to sign-in
- [ ] Session management with NextAuth
- [ ] Basic user profile creation
- [ ] Seed data creates test therapist account

**Technical Tasks:**
- [ ] NextAuth configuration with email provider
- [ ] Session middleware for protected routes  
- [ ] User onboarding flow UI
- [ ] Database seed with test data
- [ ] Auth integration tests

**Definition of Done:**
- User can sign in with email and access dashboard
- All tests pass, CI green, code reviewed

---

### **Sprint 1.2: Client Management Core**
**Branch:** `feature/client-basic-crud`  
**Acceptance Criteria:**
- [ ] Create new clients with basic info (name, email, phone)
- [ ] View client list with search functionality
- [ ] Edit client information
- [ ] Delete clients (soft delete)
- [ ] Client detail page with notes section

**Technical Tasks:**
- [ ] Client CRUD API routes with Zod validation
- [ ] Client list UI with shadcn/ui components
- [ ] Client form with proper error handling
- [ ] Search and filter functionality
- [ ] Basic notes system (unencrypted for MVP)

**Definition of Done:**
- Complete client lifecycle management works
- Responsive design on mobile/desktop
- Data validation prevents invalid entries

---

### **Sprint 1.3: Basic Scheduling**
**Branch:** `feature/appointment-basic`  
**Acceptance Criteria:**
- [ ] Create appointments with client, service, time
- [ ] Week view calendar showing appointments
- [ ] Edit/cancel appointments
- [ ] Basic appointment status tracking
- [ ] Single location support only

**Technical Tasks:**
- [ ] Appointment CRUD operations
- [ ] Calendar component (react-big-calendar or similar)
- [ ] Time slot validation logic
- [ ] Service selection integration
- [ ] Basic conflict detection

**Definition of Done:**
- Weekly calendar shows appointments correctly
- Double-booking prevention works
- Appointment lifecycle management complete

---

### **Sprint 1.4: Invoice Generation**
**Branch:** `feature/basic-invoicing`  
**Acceptance Criteria:**
- [ ] Generate invoice from completed appointment
- [ ] Austrian tax-compliant PDF output
- [ ] Kleinunternehmer regulation handling
- [ ] Invoice numbering system (MYO-YYYY-XXXX)
- [ ] Email invoice functionality

**Technical Tasks:**
- [ ] Invoice generation API with Austrian tax logic
- [ ] PDF generation with Puppeteer
- [ ] Invoice template with proper formatting
- [ ] Email delivery system integration
- [ ] Invoice storage and retrieval

**Definition of Done:**
- PDF invoices meet Austrian legal requirements
- Email delivery works reliably
- Invoice history tracking implemented

---

## 🚀 **Phase 2: Revenue-Ready (Target: Month 2)**

### **Sprint 2.1: Multi-Tenant Setup**
- [ ] Therapist registration flow
- [ ] Workspace isolation
- [ ] Pricing page and signup flow
- [ ] Stripe subscription integration

### **Sprint 2.2: Enhanced Security**
- [ ] Field-level encryption for health data
- [ ] Audit logging implementation
- [ ] RBAC system activation
- [ ] 2FA scaffolding

### **Sprint 2.3: Public Mini-Sites**
- [ ] Therapist slug-based routing (/s/[slug])
- [ ] Public booking form
- [ ] Custom branding system
- [ ] Contact information display

### **Sprint 2.4: Payment Processing**
- [ ] Stripe Connect integration
- [ ] Subscription billing automation
- [ ] Payment status tracking
- [ ] Revenue reporting

---

## 🎨 **Technical Standards Checklist**

### **Before Starting Any Feature:**
- [ ] Branch created from updated main
- [ ] User story and acceptance criteria defined
- [ ] Technical approach documented
- [ ] Dependencies identified

### **During Development:**
- [ ] Surgical edits only (no bulk replacements)
- [ ] Single responsibility per branch
- [ ] Zod validation for all inputs
- [ ] Error handling implemented
- [ ] TypeScript strict compliance

### **Before Commit:**
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes  
- [ ] `pnpm build` succeeds
- [ ] Manual testing completed
- [ ] Commit message follows conventional format

### **PR Readiness:**
- [ ] All acceptance criteria met
- [ ] No console errors in browser
- [ ] Responsive design verified
- [ ] Database migrations tested
- [ ] Documentation updated

---

## 🔧 **Development Environment Checklist**

### **Local Setup Verification:**
- [ ] `pnpm install` completes without errors
- [ ] Docker containers start successfully  
- [ ] Database migrations apply cleanly
- [ ] `pnpm dev` starts all services
- [ ] Authentication flow works locally
- [ ] Hot reload functions properly

### **Production Readiness:**
- [ ] Environment variables documented
- [ ] Database connection pooling configured
- [ ] Error monitoring integration
- [ ] Performance benchmarks established
- [ ] Backup strategy implemented

---

## 📈 **Success Metrics Tracking**

### **Technical KPIs:**
- **Code Quality:** 0 TypeScript errors, <10 ESLint warnings
- **Test Coverage:** >80% for critical paths
- **Performance:** <2s page load, <500ms API response
- **Reliability:** >99% uptime, <1% error rate

### **Product KPIs:**
- **Phase 1:** 1 active user (your wife) using daily
- **Phase 2:** €50 MRR from 1-2 therapists
- **Phase 3:** €500 MRR from 10+ therapists  
- **Phase 4:** Sustainable market leadership with established customer base

---

## 🚨 **Risk Register & Mitigation**

### **Technical Risks:**
- **NextAuth Integration Complexity** → Use email-only flow first
- **PDF Generation Performance** → Implement caching strategy
- **Database Migration Issues** → Test migrations on staging data

### **Business Risks:**
- **Feature Creep** → Strict adherence to phase boundaries
- **Over-Engineering** → MVP-first approach, defer optimization
- **Market Validation** → Get wife using it before building more

---

## 📋 **Current Sprint Commitment**

**Active Sprint:** Foundation Setup → Authentication  
**Sprint Goal:** Working sign-in flow with protected routes  
**Sprint Duration:** 1 week  
**Next Review:** After authentication complete

**Backlog Priority:**
1. Complete CI pipeline fix
2. Set up branch protection rules  
3. Start `feature/auth-system` branch
4. Implement email sign-in flow

---

**Last Updated:** {{ today }}  
**Next Review:** Weekly on Fridays  
**Escalation Path:** Claude Code operational rules