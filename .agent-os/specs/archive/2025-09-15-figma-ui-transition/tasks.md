# Spec Tasks

These are the detailed, actionable tasks for the MyoFlow Figma UI transformation project detailed in @.agent-os/specs/2025-09-15-figma-ui-transition/spec.md

> Created: 2025-09-15
> Updated: 2025-09-15
> Status: Ready for Implementation
> Total Effort: 98 hours over 4 weeks

---

## Phase 1: Foundation Setup (Week 1 - 30 hours)

### Task 1.1: Branch Setup & Figma Asset Integration
- **Priority**: Critical
- **Effort**: 2 hours
- **Dependencies**: None
- **Description**: Prepare development branch and integrate Figma design assets
- **Deliverables**:
  - [ ] Create feature branch `feat/figma-ui-transformation` from current stable branch
  - [ ] Set up Figma design token extraction workflow
  - [ ] Download and organize Figma assets (icons, images, design specs)
  - [ ] Create asset directory structure in `/apps/web/public/figma-assets/`
- **Success Criteria**:
  - Clean feature branch ready for development
  - Figma assets accessible and organized
  - Design token documentation available

### Task 1.2: Design System Foundation
- **Priority**: Critical
- **Effort**: 8 hours
- **Dependencies**: Task 1.1
- **Description**: Replace broken CSS gradient system with clean Figma-based design tokens
- **Deliverables**:
  - [ ] Extract color palette from Figma (primary, secondary, neutral, semantic colors)
  - [ ] Implement Tailwind CSS custom configuration with Figma design tokens
  - [ ] Create spacing scale system (4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px)
  - [ ] Define border radius system (none, sm: 4px, md: 8px, lg: 12px, xl: 16px)
  - [ ] Set up Austrian medical aesthetic foundation colors
  - [ ] Remove existing broken gradient CSS variables
  - [ ] Create design token documentation file
- **Success Criteria**:
  - Tailwind config includes all Figma design tokens
  - CSS builds without gradient-related errors
  - Color palette matches Figma specifications exactly
- **Files to Modify**:
  - `/apps/web/tailwind.config.js`
  - `/apps/web/app/globals.css`

### Task 1.3: Typography System Implementation
- **Priority**: High
- **Effort**: 6 hours
- **Dependencies**: Task 1.2
- **Description**: Implement professional medical software typography hierarchy
- **Deliverables**:
  - [ ] Install and configure Inter font family with proper weights (400, 500, 600, 700)
  - [ ] Define typography scale (text-xs, text-sm, text-base, text-lg, text-xl, text-2xl, text-3xl)
  - [ ] Create heading hierarchy (h1-h6) with Austrian medical context
  - [ ] Implement line-height and letter-spacing standards
  - [ ] Update existing typography classes throughout application
  - [ ] Create typography component library with German/Austrian terminology
- **Success Criteria**:
  - Inter font loads correctly across all browsers
  - Typography hierarchy matches Figma specifications
  - Text is readable and professional on all screen sizes
- **Files to Modify**:
  - `/apps/web/app/layout.tsx`
  - `/apps/web/tailwind.config.js`
  - Typography utility classes throughout app

### Task 1.4: Icon System Standardization
- **Priority**: High
- **Effort**: 4 hours
- **Dependencies**: Task 1.2
- **Description**: Fix Heroicons/Lucide React conflicts by standardizing on Lucide React
- **Deliverables**:
  - [ ] Audit all current icon usage across application (Heroicons vs Lucide)
  - [ ] Remove Heroicons package dependency completely
  - [ ] Migrate all icons to Lucide React equivalents
  - [ ] Create icon mapping documentation (old icon → new icon)
  - [ ] Implement consistent icon sizing (16px, 20px, 24px, 32px)
  - [ ] Select professional medical software appropriate icons
  - [ ] Update icon color system to match design tokens
- **Success Criteria**:
  - Zero Heroicons dependencies in package.json
  - All icons render consistently with Lucide React
  - Icon colors match design system
- **Files to Modify**:
  - All component files using icons
  - `/apps/web/package.json` (remove Heroicons)

### Task 1.5: Core Component Library Rebuild
- **Priority**: Critical
- **Effort**: 10 hours
- **Dependencies**: Tasks 1.2, 1.3, 1.4
- **Description**: Reconstruct all UI components using shadcn/ui foundation with Figma styling
- **Deliverables**:
  - [ ] Install and configure shadcn/ui in project
  - [ ] Rebuild Button component with Figma specifications (variants: primary, secondary, outline, ghost)
  - [ ] Rebuild Card component with proper shadows, borders, and spacing
  - [ ] Rebuild Input component with focus states and validation styling
  - [ ] Rebuild Label component with proper typography and spacing
  - [ ] Rebuild Badge component with Austrian context (status indicators)
  - [ ] Create professional loading skeleton components
  - [ ] Implement form components with preserved Zod validation integration
  - [ ] Create error state components with professional messaging
  - [ ] Test component responsiveness across breakpoints
- **Success Criteria**:
  - All components match Figma design specifications exactly
  - Components are responsive and accessible
  - Zod validation integration preserved
  - Components work across all screen sizes
- **Files to Modify**:
  - `/apps/web/src/components/ui/Button.tsx`
  - `/apps/web/src/components/ui/Card.tsx`
  - `/apps/web/src/components/ui/Input.tsx`
  - `/apps/web/src/components/ui/Label.tsx`
  - `/apps/web/src/components/ui/Badge.tsx`
  - Create new skeleton components

---

## Phase 2: Core Interface Rebuild (Week 2 - 40 hours)

### Task 2.1: Dashboard Hero Widget Implementation
- **Priority**: Critical
- **Effort**: 8 hours
- **Dependencies**: Phase 1 complete
- **Description**: Rebuild dashboard with Kleinunternehmer tracking as prominent hero element
- **Deliverables**:
  - [ ] Design hero widget component matching Figma specifications
  - [ ] Implement Kleinunternehmer progress visualization (€55,000 threshold)
  - [ ] Create Austrian compliance status indicators
  - [ ] Add quarterly revenue breakdown display
  - [ ] Implement VAT status tracking visualization
  - [ ] Create professional dashboard grid layout
  - [ ] Add animation/transitions for data updates
  - [ ] Ensure mobile responsiveness for hero widget
- **Success Criteria**:
  - Hero widget prominently displays Kleinunternehmer status
  - Austrian tax calculations display correctly
  - Widget is mobile-responsive and touch-friendly
  - Data updates in real-time with backend
- **Files to Modify**:
  - `/apps/web/app/dashboard/page.tsx`
  - Create new `KleinunternehmerWidget.tsx` component

### Task 2.2: Navigation System Overhaul
- **Priority**: Critical
- **Effort**: 8 hours
- **Dependencies**: Task 1.5
- **Description**: Replace broken DashboardNav with professional sidebar navigation
- **Deliverables**:
  - [ ] Remove existing DashboardNav component completely
  - [ ] Implement professional sidebar navigation matching Figma design
  - [ ] Create German navigation labels (Kunden, Termine, Rechnungen, Einstellungen)
  - [ ] Add professional breadcrumb system for sub-pages
  - [ ] Implement active navigation state indicators
  - [ ] Create collapsible mobile navigation
  - [ ] Add navigation icons using Lucide React
  - [ ] Ensure navigation works consistently across all pages
  - [ ] Add logout functionality with proper positioning
- **Success Criteria**:
  - Navigation is clean and professional
  - German translations are accurate and natural
  - Mobile navigation collapses properly
  - Active states work correctly
- **Files to Modify**:
  - `/apps/web/app/components/Sidebar.tsx` (enhance existing)
  - `/apps/web/app/components/DashboardNav.tsx` (remove)
  - `/apps/web/app/dashboard/layout.tsx`
  - All dashboard pages (remove DashboardNav imports)

### Task 2.3: Client Management Interface Rebuild
- **Priority**: High
- **Effort**: 12 hours
- **Dependencies**: Tasks 2.1, 2.2
- **Description**: Rebuild client listing, profiles, and forms with professional Figma styling
- **Deliverables**:
  - [ ] Rebuild client listing page with professional table/card layout
  - [ ] Enhance client profile pages with Austrian data field styling
  - [ ] Rebuild client creation/editing forms with Figma form design
  - [ ] Implement professional search and filtering interface
  - [ ] Create client status indicators and tags system
  - [ ] Add professional client notes interface
  - [ ] Implement mobile-optimized client management workflows
  - [ ] Create loading states for client data operations
  - [ ] Add professional error handling and validation messaging
  - [ ] Preserve all existing API integrations and data handling
- **Success Criteria**:
  - Client interface looks professional and matches Figma
  - All existing functionality preserved (search, notes, CRUD)
  - Mobile experience is optimized for therapy practice use
  - Austrian data fields properly displayed
- **Files to Modify**:
  - `/apps/web/app/dashboard/clients/page.tsx`
  - `/apps/web/app/dashboard/clients/[id]/page.tsx`
  - `/apps/web/app/dashboard/clients/[id]/edit/page.tsx`
  - `/apps/web/app/dashboard/clients/new/page.tsx`

### Task 2.4: Appointment Interface Enhancement
- **Priority**: High
- **Effort**: 12 hours
- **Dependencies**: Tasks 2.1, 2.2
- **Description**: Professional appointment scheduling and calendar interface
- **Deliverables**:
  - [ ] Rebuild appointment listing with professional card layout
  - [ ] Create enhanced appointment detail cards matching Figma
  - [ ] Implement professional appointment creation/editing forms
  - [ ] Design calendar view with Austrian date formatting
  - [ ] Create appointment status indicators and workflow states
  - [ ] Add conflict detection UI with clear error messaging
  - [ ] Implement mobile-friendly appointment scheduling
  - [ ] Create loading states for appointment operations
  - [ ] Add professional appointment reminder interface
  - [ ] Preserve Austrian holiday integration and business logic
- **Success Criteria**:
  - Appointment interface is professional and intuitive
  - Austrian date/time formatting preserved
  - Mobile scheduling is touch-optimized
  - All existing appointment logic preserved
- **Files to Modify**:
  - `/apps/web/app/dashboard/appointments/page.tsx`
  - `/apps/web/app/dashboard/appointments/[id]/page.tsx`

---

## Phase 3: Mobile Optimization & Polish (Week 3 - 18 hours)

### Task 3.1: Responsive Breakpoint Implementation
- **Priority**: High
- **Effort**: 8 hours
- **Dependencies**: Phase 2 complete
- **Description**: Mobile-first layouts for all interfaces with therapy practice optimization
- **Deliverables**:
  - [ ] Implement mobile breakpoints (sm: 640px, md: 768px, lg: 1024px, xl: 1280px)
  - [ ] Create responsive dashboard with mobile-friendly Kleinunternehmer widget
  - [ ] Optimize client management for tablet/mobile usage
  - [ ] Design mobile-first appointment scheduling interface
  - [ ] Create touch-friendly form interfaces with proper spacing
  - [ ] Implement responsive tables and data displays
  - [ ] Add mobile-specific loading and error states
  - [ ] Test interface on common mobile devices (iPhone, Android tablets)
- **Success Criteria**:
  - Interface works seamlessly on mobile devices
  - Touch targets meet 44px minimum size requirement
  - Content is readable and accessible on small screens
  - Performance is acceptable on mobile networks
- **Files to Modify**:
  - All page and component files (add responsive classes)
  - Tailwind configuration for breakpoints

### Task 3.2: Mobile Navigation and Touch Optimization
- **Priority**: High
- **Effort**: 6 hours
- **Dependencies**: Task 3.1
- **Description**: Implement mobile-specific navigation and gesture-friendly interfaces
- **Deliverables**:
  - [ ] Create collapsible mobile sidebar with hamburger menu
  - [ ] Implement swipe gestures for mobile navigation
  - [ ] Add 44px minimum touch targets for all interactive elements
  - [ ] Create mobile-specific button sizes and spacing
  - [ ] Implement pull-to-refresh functionality where appropriate
  - [ ] Add haptic feedback for mobile interactions (iOS/Android)
  - [ ] Create mobile-friendly modal and overlay patterns
  - [ ] Test gesture interactions on actual devices
- **Success Criteria**:
  - Mobile navigation feels native and responsive
  - Touch interactions are reliable and intuitive
  - Interface passes mobile accessibility standards
  - Gestures work consistently across devices
- **Files to Modify**:
  - Navigation components
  - Interactive UI components
  - Modal and overlay components

### Task 3.3: Performance and Bundle Optimization
- **Priority**: Medium
- **Effort**: 4 hours
- **Dependencies**: Tasks 3.1, 3.2
- **Description**: CSS cleanup and bundle size optimization
- **Deliverables**:
  - [ ] Remove redundant CSS classes and conflicts
  - [ ] Optimize component bundle sizes through code splitting
  - [ ] Implement lazy loading for non-critical components
  - [ ] Optimize image assets and reduce bundle size
  - [ ] Remove unused CSS and JavaScript code
  - [ ] Implement CSS purging for production builds
  - [ ] Add performance monitoring and optimization
  - [ ] Test loading performance on slower connections
- **Success Criteria**:
  - Page load times improved by at least 20%
  - Bundle size reduced while maintaining functionality
  - Mobile performance meets acceptable standards
  - No CSS conflicts or redundancies
- **Files to Modify**:
  - All component files (cleanup)
  - Build configuration
  - Asset optimization

---

## Phase 4: Quality Assurance & Integration (Week 4 - 10 hours)

### Task 4.1: Austrian Business Logic Verification
- **Priority**: Critical
- **Effort**: 4 hours
- **Dependencies**: Phase 3 complete
- **Description**: Ensure zero breaking changes to Austrian compliance and business logic
- **Deliverables**:
  - [ ] Test Kleinunternehmer calculation accuracy (€55,000 threshold)
  - [ ] Verify VAT handling and rate calculations (20%, 10%, 0%)
  - [ ] Test invoice generation with Austrian legal requirements
  - [ ] Validate sequential invoice numbering (YYYY-NNN format)
  - [ ] Confirm GDPR compliance features are preserved
  - [ ] Test Austrian holiday integration in appointment scheduling
  - [ ] Verify therapist profile and compliance tracking
  - [ ] Test PDF generation with Austrian formatting
  - [ ] Validate all API endpoints return expected data
- **Success Criteria**:
  - All Austrian compliance calculations are 100% accurate
  - No breaking changes to business logic
  - Legal requirements are preserved
  - API responses match expected formats
- **Testing Files**:
  - All API routes under `/api/`
  - Invoice generation functionality
  - Tax calculation components

### Task 4.2: Cross-Device Testing & Browser Compatibility
- **Priority**: High
- **Effort**: 4 hours
- **Dependencies**: Task 4.1
- **Description**: Comprehensive testing across devices and browsers
- **Deliverables**:
  - [ ] Test on desktop browsers (Chrome, Firefox, Safari, Edge)
  - [ ] Test on mobile devices (iPhone iOS 15+, Android 10+)
  - [ ] Test on tablet devices (iPad, Android tablets)
  - [ ] Verify touch interactions work consistently
  - [ ] Test responsive design at various screen sizes
  - [ ] Validate form submissions across platforms
  - [ ] Test printing functionality for invoices
  - [ ] Verify keyboard navigation and accessibility
- **Success Criteria**:
  - Interface works consistently across all target devices
  - No browser-specific bugs or inconsistencies
  - Touch interactions are reliable
  - Accessibility standards are met
- **Testing Coverage**:
  - All major user workflows
  - Form submissions and validations
  - Navigation and interactive elements

### Task 4.3: User Experience Polish & Final Review
- **Priority**: Medium
- **Effort**: 2 hours
- **Dependencies**: Tasks 4.1, 4.2
- **Description**: Final UX improvements and professional polish
- **Deliverables**:
  - [ ] Refine loading state transitions and timing
  - [ ] Improve error message clarity and helpfulness
  - [ ] Add subtle micro-interactions and animations
  - [ ] Enhance visual hierarchy and information architecture
  - [ ] Polish Austrian medical software aesthetic
  - [ ] Review German translations for accuracy and professionalism
  - [ ] Optimize color contrast and readability
  - [ ] Final review against Figma specifications
- **Success Criteria**:
  - Interface feels polished and professional
  - User interactions are smooth and intuitive
  - Visual design matches Figma specifications exactly
  - Austrian medical context is preserved throughout

---

## Success Metrics & Acceptance Criteria

### Technical Success Metrics
- **Zero Breaking Changes**: All existing API functionality preserved
- **Performance Improvement**: Page load times improved by 20%+
- **Mobile Optimization**: 44px touch targets, responsive design
- **Code Quality**: TypeScript strict mode compliance, no CSS conflicts

### Business Success Metrics
- **Austrian Compliance Preserved**: 100% accuracy in tax calculations
- **Professional Appearance**: Interface matches medical software standards
- **Mobile Experience**: Therapy practice workflows optimized for mobile
- **User Experience**: Intuitive navigation and professional feel

### Quality Gates
- [ ] All existing tests pass without modification
- [ ] TypeScript compilation successful with strict mode
- [ ] No console errors in browser development tools
- [ ] Mobile performance acceptable on 3G connections
- [ ] Cross-browser compatibility verified
- [ ] Austrian business logic accuracy validated
- [ ] Figma design specifications matched exactly

---

## Risk Mitigation

### High-Risk Tasks
- **Task 1.5 (Core Component Rebuild)**: Risk of breaking existing functionality
  - *Mitigation*: Incremental component replacement with thorough testing
- **Task 2.1 (Dashboard Hero Widget)**: Risk of breaking Kleinunternehmer calculations
  - *Mitigation*: Preserve existing calculation logic, only change presentation
- **Task 4.1 (Business Logic Verification)**: Risk of compliance issues
  - *Mitigation*: Comprehensive testing against known tax scenarios

### Dependencies & Blockers
- **Figma Access**: Ensure design specifications are available and final
- **Testing Environment**: Set up proper testing environment for Austrian compliance
- **Mobile Testing**: Access to actual mobile devices for touch testing

### Rollback Plan
- Maintain existing components as backup during migration
- Implement feature flags for progressive rollout
- Keep detailed commit history for selective rollbacks if needed

---

**Total Project Effort**: 98 hours over 4 weeks
**Critical Path**: Phase 1 → Phase 2 (Foundation must be solid before interface rebuild)
**Success Definition**: Professional Austrian medical software interface with 100% preserved business logic