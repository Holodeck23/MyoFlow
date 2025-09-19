# 🤝 User Settings Implementation - Claude & Codex Coordination Plan

**Created:** September 18, 2025
**Status:** Ready for parallel implementation
**Goal:** Safe, coordinated user settings implementation using git worktrees

---

## 🎯 **Implementation Strategy**

### **Git Worktree Setup (SAFE PARALLEL DEVELOPMENT)**
```bash
# Codex Workspace - Database & API Focus
cd /Users/ZOD/Documents/GitHub/MyoFlow-codex
git checkout main && git pull
git checkout -b codex/user-settings-backend

# Claude Workspace - Frontend & UI Focus
cd /Users/ZOD/Documents/GitHub/MyoFlow-claude
git checkout main && git pull
git checkout -b claude/user-settings-frontend
```

**Why This Works:**
- ✅ **Zero merge conflicts** during development (separate working directories)
- ✅ **Shared database** (same .env across worktrees)
- ✅ **Independent testing** (each agent can run dev server independently)
- ✅ **Clean integration** via PRs once both parts complete

---

## 📋 **Task Division (Conflict-Free Zones)**

### **🔧 Codex: Backend Infrastructure (codex/user-settings-backend)**

#### **Phase 1: Database Schema (Week 1)**
- [ ] **Prisma Schema Extensions**
  - `UserProfile` model with Austrian compliance fields
  - `TravelSettings` model with Google Maps integration
  - `SystemPreferences` model with localization
  - `ServiceRateTemplate` enhancements
- [ ] **Database Migration**
  - Add all new tables with proper constraints
  - Austrian validation (postal codes, VAT numbers)
  - Encryption field preparation (libsodium integration)

#### **Phase 2: API Endpoints (Week 1-2)**
- [ ] **Profile Management APIs**
  - `GET/PUT /api/user/profile` - business info, credentials
  - `GET/PUT /api/user/travel-settings` - location, transport, rates
  - `GET/PUT /api/user/system-preferences` - language, notifications
- [ ] **Austrian Compliance APIs**
  - `POST /api/validate/vat-number` - Austrian VAT validation
  - `POST /api/validate/postal-code` - Austrian postal code validation
  - `GET /api/tax/kleinunternehmer-status` - threshold tracking

#### **Phase 3: Integration Services (Week 2)**
- [ ] **Google Maps Integration**
  - Travel distance/time calculation endpoints
  - Address geocoding and validation
- [ ] **Export Services**
  - BMD/RZL/DATEV CSV generation
  - Accounting software format APIs

### **🎨 Claude: Frontend & User Experience (claude/user-settings-frontend)**

#### **Phase 1: Core Settings UI (Week 1)**
- [ ] **Settings Layout & Navigation**
  - Replace placeholder settings page with tabbed interface
  - Professional Austrian medical software design
  - Mobile-responsive layout with proper breakpoints
- [ ] **Profile Management Forms**
  - Business information form with Austrian validation
  - Professional credentials management
  - Contact information and service descriptions

#### **Phase 2: Advanced Settings (Week 1-2)**
- [ ] **Travel Configuration UI**
  - Interactive map for base location setting
  - Service radius visualization
  - Transport method selection with rate configuration
- [ ] **System Preferences**
  - German/English language toggle
  - Austrian date/currency formatting options
  - Notification preferences and compliance alerts

#### **Phase 3: Integration & Polish (Week 2)**
- [ ] **Austrian Compliance Dashboard**
  - Kleinunternehmer threshold tracking display
  - VAT status indicators and legal notices
  - Real-time compliance status monitoring
- [ ] **Export Configuration UI**
  - BMD/RZL/DATEV export format selection
  - CSV field mapping interface
  - Automated export scheduling

---

## 🔒 **Conflict Prevention Rules**

### **File Ownership (NO OVERLAP)**
```
📁 CODEX TERRITORY (Backend):
├── packages/db/schema.prisma           # Database schema only
├── apps/web/app/api/user/             # User API routes
├── apps/web/app/api/validate/         # Validation endpoints
├── packages/lib/austrian-validation/  # Austrian business logic
├── packages/lib/google-maps/          # Maps integration
└── packages/lib/csv-export/           # Export utilities

📁 CLAUDE TERRITORY (Frontend):
├── apps/web/app/dashboard/settings/   # Settings pages & components
├── packages/ui/settings/              # Settings-specific UI components
├── packages/ui/forms/                 # Form components & validation
├── apps/web/components/settings/      # Settings page components
└── apps/web/hooks/settings/           # Settings-related hooks
```

### **Shared Dependencies (COORDINATION REQUIRED)**
- ✅ **TypeScript Types**: Codex creates in `packages/lib/types/user-settings.ts`
- ✅ **Translation Keys**: Claude adds to existing `packages/lib/i18n/` files
- ✅ **Database Migrations**: Codex handles all Prisma migrations
- ✅ **API Integration**: Claude uses endpoints Codex creates (contract-first)

---

## 📞 **Communication Protocol**

### **Daily Sync (Via Activity Log)**
1. **Morning**: Check `AGENT_ACTIVITY_LOG.md` for overnight progress
2. **Evening**: Update activity log with completed tasks and blockers
3. **Blockers**: Immediate activity log update if waiting on other agent

### **Integration Points**
1. **Week 1 Mid-Point**: Codex provides API contracts for Claude frontend integration
2. **Week 1 End**: Both agents test integration in their respective worktrees
3. **Week 2 Mid-Point**: Combined testing and bug fixes
4. **Week 2 End**: PR coordination and final merge

### **Emergency Coordination**
- **Schema Conflicts**: Codex leads all database changes
- **Type Conflicts**: Codex provides definitive types in shared package
- **Integration Issues**: Both agents coordinate via activity log immediately

---

## 🧪 **Testing Strategy**

### **Independent Testing**
- **Codex**: API endpoint testing, database migration validation
- **Claude**: Component testing, UI/UX validation, responsiveness
- **Both**: E2E testing in respective worktrees

### **Integration Testing**
- **Shared**: Full user settings workflow testing once both parts complete
- **Austrian Compliance**: Real VAT validation, postal code testing
- **Mobile Testing**: Touch interface, responsive design validation

---

## 🚀 **Success Criteria**

### **Week 1 Deliverables**
- ✅ **Codex**: Database schema + core API endpoints functional
- ✅ **Claude**: Basic settings UI + form validation working
- ✅ **Both**: API contract integration successful

### **Week 2 Deliverables**
- ✅ **Codex**: Advanced features (maps, exports) + Austrian compliance
- ✅ **Claude**: Complete settings dashboard + mobile optimization
- ✅ **Both**: Production-ready user settings system

### **Final Integration**
- ✅ **Austrian Compliance**: VAT, Kleinunternehmer, postal validation working
- ✅ **Travel Settings**: Google Maps integration with real calculations
- ✅ **Professional UI**: Medical software quality matching Figma designs
- ✅ **Mobile Ready**: Touch-first responsive design
- ✅ **Export Ready**: BMD/RZL/DATEV accounting software integration

---

## 📋 **Next Steps**

1. **Codex**: Review this plan and confirm backend task assignment
2. **Both**: Set up respective git worktree branches
3. **Codex**: Start with Prisma schema extensions (highest priority)
4. **Claude**: Begin settings page layout and navigation structure
5. **Both**: Update activity log daily with progress and integration needs

**This plan ensures zero merge conflicts while maximizing parallel development efficiency!**