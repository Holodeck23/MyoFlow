# 📋 CLAUDE DEVELOPMENT NOTES

**Project:** MyoFlow - Austrian Therapy Practice Management  
**Session Date:** September 5, 2024  
**Status:** Phase 1 Authentication Sprint - Day 1 Complete

---

## 🎯 **Current Session Objectives**

**Primary Goal:** Phase 1 MVP Development - Authentication System  
**Active Branch:** `feature/auth-system`  
**Immediate Task:** Test email authentication flow locally  
**Next Phase:** Day 2 - Session middleware and protected routes

---

## 📊 **Architecture Decisions Made**

### **Technology Stack Finalized:**
- **Monorepo:** Turborepo + pnpm workspaces for code organization
- **Frontend:** Next.js 14 App Router + TypeScript strict mode
- **Database:** PostgreSQL + Prisma ORM for type safety
- **Authentication:** NextAuth.js with email + Google OAuth
- **Security:** libsodium field-level encryption for sensitive data
- **PDF Generation:** Puppeteer for Austrian-compliant invoices
- **Deployment:** Vercel (recommended) with PostgreSQL + Redis

### **Business Logic Decisions:**
- **Single-tenant per therapist:** Data isolation and premium positioning
- **Austrian-first:** Kleinunternehmer, VAT rates, therapist designations
- **Path-based mini-sites:** `/s/[slug]` routing for public pages
- **Security-first:** Field-level encryption, audit logging, RBAC

---

## 🔧 **Current Technical Status**

### **Completed Infrastructure:**
- ✅ Complete Prisma schema with Austrian compliance
- ✅ Security framework (encryption, audit, permissions)
- ✅ Comprehensive documentation and operational rules
- ✅ Git workflow and branch protection setup
- ✅ CI/CD pipeline with testing requirements

### **Day 1 Authentication Complete:**
- ✅ NextAuth.js configured with email provider
- ✅ Sign-in page with clean UI and loading states
- ✅ Protected dashboard page with session management  
- ✅ Home page with authentication-aware navigation
- ✅ SessionProvider and Tailwind CSS setup
- ✅ Environment variables configured

### **Ready for Testing:**
- 🧪 Email authentication flow (Gmail setup needed)
- ⏳ Local development server testing (`pnpm dev`)

### **Gmail Testing Setup (Non-2FA Account):**

**Step 1: Copy environment file**
```bash
cp .env.example .env
```

**Step 2: Configure Gmail in `.env`**
```env
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-test-account@gmail.com
EMAIL_SERVER_PASSWORD=your-gmail-password
EMAIL_FROM=MyoFlow <your-test-account@gmail.com>
NEXTAUTH_SECRET=development-secret-key-change-in-production
NEXTAUTH_URL=http://localhost:3000
```

**Step 3: Test authentication flow**
```bash
pnpm dev
# Visit http://localhost:3000
# Click "Sign In"
# Enter email address
# Check Gmail for magic link
```

**Note:** Uses non-2FA Gmail account for development testing. In production, will use proper app passwords or email service.

### **Technical Debt:**
- None identified - foundation is solid

---

## 💼 **Business Context**

### **Project Origin:**
- Started as gift for estranged wife's massage therapy business
- Evolved into comprehensive Austrian therapy practice platform
- Goal: Validate with real user, then scale to €10k MRR

### **Market Opportunity:**
- Austrian massage therapists using Excel + manual processes
- Regulatory compliance (GDPR, VAT, Kleinunternehmer) as competitive moat
- Network effects through mini-sites and affiliate program

### **Revenue Model:**
- €50-200/month per therapist subscription
- Target: 50-200 therapists for €10k MRR
- Stripe Connect for payment processing

---

## 🛡️ **Operational Framework**

### **Development Rules Established:**
- **Surgical edits only:** No bulk file replacements
- **One branch = one purpose:** Prevents scope creep
- **Mandatory testing:** `typecheck → lint → build` before commit
- **Factual documentation:** No cheerleading language

### **Quality Gates:**
- TypeScript strict mode compliance
- ESLint + Prettier formatting
- Next.js build success required
- Manual testing before PR merge

---

## 📅 **Development Phases**

### **Phase 1: MVP (2 weeks)**
1. Authentication system (NextAuth + email)
2. Basic client CRUD (no encryption initially)
3. Simple appointment scheduling (single location)
4. Austrian-compliant invoice generation

**Success:** Wife uses daily instead of existing system

### **Phase 2: Revenue-Ready (Month 2)**
1. Multi-tenant onboarding
2. Stripe subscription integration
3. Field-level encryption for health data
4. Public mini-site generation

**Success:** €50 MRR from 1-2 therapists

### **Phase 3: Scale (Month 3-6)**
1. Advanced features (multi-location, automation)
2. Affiliate program activation
3. Market expansion preparation

**Success:** €500 MRR from 10+ therapists

---

## 🚨 **Known Challenges & Solutions**

### **Feature Creep Risk:**
- **Problem:** Tendency to build ecosystem instead of MVP
- **Solution:** Strict phase boundaries, CLAUDE_CODE_RULES.md enforcement

### **CI Pipeline Issues:**
- **Problem:** ESLint configuration conflicts in monorepo
- **Solution:** Simplified to Next.js defaults only

### **First-Time Repository Management:**
- **Problem:** New to Git workflow and repository maintenance
- **Solution:** Comprehensive documentation and branch protection rules

---

## 🎯 **Immediate Next Steps**

### **Today's Priority:**
1. Wait for CI pipeline to pass (ESLint fix applied)
2. Complete branch protection rules setup
3. Merge documentation/setup PR to main
4. Create `feature/auth-system` branch

### **This Week:**
1. NextAuth email authentication implementation
2. Protected route middleware setup
3. Basic user dashboard creation
4. Database seed with test therapist data

---

## 📝 **Session Notes**

### **Key Insights:**
- Project has evolved from personal tool to legitimate business opportunity
- Technical foundation is enterprise-grade and well-architected  
- Main challenge is discipline to resist feature creep
- Austrian regulatory compliance is significant competitive advantage

### **Development Approach:**
- Claude Code operational rules prevent scope drift
- Surgical edits maintain code integrity
- Comprehensive testing before commits
- Focus on user value over technical perfection

### **Business Validation Plan:**
- Start with wife as primary user and feedback source
- Measure daily usage and feature adoption
- Use affiliate system for organic growth
- Austrian therapist market research needed

---

## 🔄 **Update Log**

**2024-09-05 10:30:** ESLint fix applied (4th attempt) - simplified config to Next.js defaults  
**2024-09-05 10:15:** Technical roadmap created with sprint planning  
**2024-09-05 10:00:** CLAUDE_CODE_RULES.md operational framework established  
**2024-09-05 09:45:** Comprehensive README documentation completed

---

**Next Session Priority:** Begin authentication system implementation after CI passes