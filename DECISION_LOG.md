# MyoFlow Development Decision Log

## 2025-09-15: Strategic Pivot to Figma-Based UI

### Context
- Current UI implementation assessed as "15% complete, broken imports, looks like student project"
- User generated professional Figma design showing Austrian medical software standards
- Development server had Heroicons import conflicts preventing dashboard access
- Multiple dev servers running causing port conflicts

### Key Decisions Made

#### 1. Strategic UI Direction
**Decision:** Complete UI rebuild using Figma design as foundation
**Rationale:** Current incremental UI fixes insufficient for Austrian medical software market positioning
**Impact:** Preserves all Austrian business logic while achieving professional appearance

#### 2. Technical Stabilization
**Decision:** Fix immediate blocking issues before major UI work
**Actions Taken:**
- Killed multiple conflicting dev servers
- Verified Sidebar.tsx already using Lucide React (no Heroicons conflict)
- Clean dev server now running on localhost:3000
- Development environment stabilized

#### 3. Project Documentation Strategy
**Decision:** Update CLAUDE.md to reflect strategic pivot, maintain decision log
**Rationale:** Need clear record of major strategic changes and technical decisions
**Implementation:** Created formal decision log and updated project documentation

### Technical Status
- ✅ Development server running cleanly (localhost:3000)
- ✅ No import conflicts detected
- ✅ All packages compiling without errors
- ✅ Comprehensive Figma transition spec created (`.agent-os/specs/2025-09-15-figma-ui-transition/`)

### Next Steps
1. Merge current stabilized branch to main
2. Await Figma code assets from user
3. Execute complete UI transformation per spec
4. Preserve all Austrian compliance and business logic

### Preserved Assets
- Austrian business logic (Kleinunternehmer, VAT, GDPR)
- API routes and database schemas
- Authentication system (NextAuth.js)
- Austrian compliance calculations
- PDF generation system

### Dependencies
- ✅ **Figma Code Received**: Professional enterprise-grade React/TypeScript components
- ⚠️ **CI Still Failing**: Codex analyzing latest failure
- ✅ **Implementation Plan**: Documented 12-16 hour realistic estimate (not 98 hours)

## 2025-09-15 Evening: Figma Code Analysis Completed

### Figma Code Quality Assessment
**Rating: 9.5/10 - Enterprise Production Ready**

#### Key Findings:
- **Perfect Austrian Implementation**: Proper German medical terminology throughout
- **Professional Component Architecture**: shadcn/ui integration, TypeScript interfaces
- **Mobile-First Responsive**: `flex-col sm:flex-row` patterns optimized for therapy workflows
- **Austrian Business Logic**: €35,000 Kleinunternehmer threshold, proper forecasting
- **Zero Backend Changes Required**: All existing APIs, Austrian compliance logic preserved

#### Revised Implementation Estimate: 12-16 Hours (Major Reduction)
1. **Integration Setup** (2-3h): Copy components, add missing shadcn/ui pieces
2. **Component Replacement** (6-8h): Replace dashboard, wire up real data
3. **Mobile Polish** (2-3h): Responsive testing, performance optimization
4. **Quality Assurance** (2h): API integration, Austrian calculations verification

#### Strategic Decision: Full Figma Code Integration
- User will add complete Figma codebase to project for systematic integration
- Professional Austrian medical software appearance achievable in days, not months
- All existing Austrian business logic and APIs preserved without modification

## 2025-09-18: Calendar Implementation Recovery & Coordination Success

### Context
- Parallel Claude sessions created schema/migration conflicts across branches
- Database out of sync with migration files (missing columns, renamed fields)
- CI failing with cascading errors (isActive, certificates, webpack issues)
- Repository chaos from uncoordinated development

### Key Decisions Made

#### 1. Single Environment Coordination
**Decision:** All Claude/Codex work in same environment, no parallel branches
**Rationale:** Parallel sessions caused schema disasters and repository conflicts
**Implementation:** Shared `AGENT_ACTIVITY_LOG.md` updates, systematic handoffs

#### 2. Database-First Development
**Decision:** Always migrate schema before switching contexts or agents
**Actions Taken:**
- Used `prisma db pull` to synchronize schema with actual database state
- Consolidated migrations into single comprehensive update
- Added 9 missing columns across Therapist + ServiceRateTemplate tables

#### 3. Systematic Debugging Approach
**Decision:** Address root causes, not just symptoms when fixing CI
**Implementation:**
- Fixed TypeScript interfaces for Google Maps APIs
- Removed `@myoflow/db` from transpilePackages to fix bundling
- Updated all tests to match new appointment schema
- Resolved isActive vs active field naming conflicts

### Technical Achievements
- ✅ **Calendar Implementation Rescued**: Production-ready calendar with Austrian compliance
- ✅ **CI Pipeline Fixed**: All TypeScript, build, and test failures resolved
- ✅ **Travel Visualization**: Professional route mapping and timeline display
- ✅ **Database Synchronization**: Schema aligned with migration files
- ✅ **Google Maps Integration**: Real Austrian travel calculations working

### Lessons Learned
- **Schema introspection** can resolve complex migration mismatches
- **Git worktrees** recommended for future parallel feature development
- **Coordination beats parallelization** for complex database work
- **Systematic approach** prevents CI hell and reduces debugging time

## 2025-09-17: Google Maps Integration & Austrian Market Focus

### Key Decisions Made

#### 1. Upper Austria Grant Application Focus
**Decision:** Convert all test data to Linz/Oberösterreich for grant application
**Rationale:** Upper Austria grants require local relevance and realistic scenarios
**Implementation:** All clients in 4xxx postal codes, therapist based in Linz

#### 2. Real Travel Calculations vs Mock Data
**Decision:** Implement actual Google Maps API integration with Austrian locale
**Technical Details:**
- Austrian locale (de-AT, region=at) for proper address handling
- Fallback to Haversine formula when API unavailable
- Server-side only implementation to protect API keys

#### 3. Austrian Compliance in Travel Features
**Decision:** Maintain Austrian business rules in travel calculations
**Implementation:**
- Proper Euro formatting and German terminology
- Travel cost calculations with Austrian rates
- 4xxx postal code validation for Oberösterreich