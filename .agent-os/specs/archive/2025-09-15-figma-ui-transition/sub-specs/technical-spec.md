# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-09-15-figma-ui-transition/spec.md

> Created: 2025-09-15
> Version: 1.0.0

## Technical Requirements

- **Design System Implementation**: Replace broken CSS gradient system with clean Figma-based design tokens using Tailwind CSS custom configuration
- **Component Library Rebuild**: Reconstruct all UI components using shadcn/ui foundation with Austrian medical styling overrides
- **Icon System Standardization**: Fix Heroicons/Lucide React conflicts by standardizing on Lucide React throughout application
- **Responsive Architecture**: Implement mobile-first design patterns with breakpoint-specific layouts optimized for therapy practice workflows
- **Typography System**: Implement professional medical software typography hierarchy using Inter font with Austrian German terminology
- **Dashboard Reconstruction**: Rebuild dashboard layout to prominently feature Kleinunternehmer tracking widget as hero element
- **Navigation System Overhaul**: Replace current broken DashboardNav with professional sidebar navigation matching Figma specifications
- **Loading State Enhancement**: Implement skeleton loading patterns and professional loading UX throughout application
- **Form Component Standardization**: Rebuild all form interfaces with consistent styling while preserving existing Zod validation schemas
- **Austrian Localization Enhancement**: Improve existing i18n system with professional medical terminology and Austrian cultural elements
- **Mobile Touch Optimization**: Implement 44px minimum touch targets and gesture-friendly interfaces for tablet/mobile usage
- **Performance Optimization**: Reduce CSS conflicts and improve bundle size through clean component architecture

## Approach

### Phase 1: Foundation (Week 1)
1. **Design System Setup** - Implement Figma design tokens in Tailwind config
2. **Component Library Foundation** - Rebuild core UI components (Button, Card, Input, etc.)
3. **Icon System Migration** - Complete transition to Lucide React icons
4. **Typography Implementation** - Professional font hierarchy and Austrian terminology

### Phase 2: Core Interface Rebuild (Week 2)
1. **Dashboard Reconstruction** - Hero Kleinunternehmer widget and professional layout
2. **Navigation System** - Professional sidebar with clean German translations
3. **Form Components** - Standardized form styling with existing validation
4. **Loading States** - Professional skeleton patterns throughout

### Phase 3: Mobile Optimization (Week 3)
1. **Responsive Breakpoints** - Mobile-first layouts for all interfaces
2. **Touch Optimization** - 44px targets and gesture-friendly controls
3. **Mobile Navigation** - Collapsible sidebar and mobile-specific patterns
4. **Performance Tuning** - Bundle optimization and CSS cleanup

## API Integration Preservation

- **Zero Breaking Changes**: Maintain 100% compatibility with existing API routes (/api/clients/*, /api/appointments/*, /api/invoices/*)
- **Form Data Contracts**: Preserve all existing request/response schemas while updating form component presentation layer
- **Authentication Flow**: No changes to NextAuth.js session handling or middleware configuration
- **Austrian Business Logic**: Maintain exact Kleinunternehmer calculations, VAT handling, and GDPR compliance implementations

## External Dependencies

- **Figma Design System**: Professional Austrian medical software design tokens and component specifications
- **shadcn/ui**: Foundation component library for consistent React component patterns
- **Lucide React**: Standardized icon system replacing current Heroicons conflicts
- **Tailwind CSS**: Custom configuration for Figma design token implementation
- **Inter Font**: Professional typography system for medical software aesthetic