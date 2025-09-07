# Technical Stack

## Application Framework
- **Next.js 14** with App Router
- **TypeScript** strict mode for type safety
- **Turborepo** monorepo architecture with pnpm workspaces

## Database System
- **PostgreSQL** primary database
- **Prisma ORM** for type-safe database operations
- **Redis** for session management and caching

## JavaScript Framework
- **React 18** with server components
- **Next.js 14** App Router for routing and API routes
- **Zod** for runtime validation and schema definition

## Import Strategy
- **Node.js modules** with ES modules support
- **TypeScript paths** for clean imports
- **Turborepo** workspace dependency resolution

## CSS Framework
- **Tailwind CSS 3.4** for utility-first styling
- **CSS Custom Properties** for theme variables
- **Responsive Design** with mobile-first approach

## UI Component Library
- **Radix UI** for accessible, unstyled components
- **React Hook Form** with Zod validation
- **Lucide Icons** for consistent iconography

## Fonts Provider
- **Inter** from Google Fonts as primary typeface
- **System fonts** fallback stack for performance

## Icon Library
- **Lucide React** for consistent SVG icons
- **Custom SVG icons** for Austrian-specific elements

## Application Hosting
- **Vercel** (recommended deployment platform)
- **Docker** support for alternative hosting
- **Edge Runtime** for API routes where possible

## Database Hosting
- **PostgreSQL** on cloud providers (Vercel Postgres, Supabase, or Railway)
- **Connection pooling** with PgBouncer for production
- **Backup automation** with daily snapshots

## Asset Hosting
- **Vercel** static asset serving
- **CDN** distribution for global performance
- **Image optimization** with Next.js Image component

## Deployment Solution
- **Vercel** with Git integration
- **GitHub Actions** for CI/CD pipeline
- **Environment-based deployments** (preview/production)

## Code Repository URL
- **GitHub** repository with branch protection rules
- **Feature branch workflow** with PR requirements
- **Automated testing** before merge approval

## Security & Compliance
- **libsodium** for field-level encryption of health data
- **NextAuth.js** with email + Google OAuth providers
- **CSRF protection** with Next.js built-ins
- **Content Security Policy** headers for XSS protection

## Testing Framework
- **Playwright** for end-to-end testing
- **Jest** for unit testing (when needed)
- **TypeScript** compiler for type checking
- **ESLint + Prettier** for code quality

## Additional Tools
- **Puppeteer** for PDF generation (Austrian invoice compliance)
- **Date-fns** for date manipulation and Austrian locale support
- **BullMQ** for background job processing (future email automation)
- **Stripe** for subscription billing and payment processing

## Development Standards

**Core MyoFlow Rules:** See @.agent-os/standards/myoflow-development-rules.md for complete development standards

### Key Principles
- **Surgical precision** - targeted edits only, no bulk file replacements
- **One branch = one purpose** - no scope creep or unrelated changes
- **Mandatory testing** - typecheck + lint + build must pass before commit
- **Austrian compliance first** - German UX, GDPR Article 9, VAT handling
- **TypeScript strict mode** - no `any` types unless justified
- **Security defaults** - libsodium encryption, CSP headers, secure logging

### Quality Gates
- **Pre-commit testing:** `pnpm --filter @myoflow/web typecheck lint build`
- **Feature branch workflow** - `feature/<spec-key>-<slug>` naming convention
- **Factual documentation** - no cheerleading language, focus on technical facts
- **Austrian business validation** - UID format, therapist designations, VAT rules

## Austrian Compliance Features
- **GDPR Article 9** health data encryption with libsodium
- **Kleinunternehmerregelung** VAT handling and legal disclaimers
- **RKSV awareness** for cash register thresholds and reporting
- **Austrian holiday system** supporting all 9 Bundesländer variations
- **German language localization** for all user-facing content
- **BMD/RZL/DATEV** accounting software export compatibility
- **Winston** for structured logging (production)
- **Stripe** for subscription billing (future implementation)