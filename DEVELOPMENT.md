# MyoFlow Development Guide

## Branching Strategy

### Branch Types
- `main` - Production-ready code, always deployable
- `feature/[feature-name]` - New features (e.g., `feature/client-crud`, `feature/booking-system`)
- `fix/[issue-description]` - Bug fixes (e.g., `fix/invoice-pdf-generation`)
- `refactor/[component]` - Code refactoring (e.g., `refactor/auth-middleware`)

### Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

2. **Development**
   - Make changes in small, focused commits
   - Test thoroughly before committing
   - Follow existing code patterns and conventions

3. **Pre-commit Testing**
   ```bash
   # Always run before committing
   pnpm typecheck    # Type checking
   pnpm lint         # Linting
   pnpm build        # Build test
   
   # Run tests when available
   pnpm test         # Unit tests (when implemented)
   pnpm test:e2e     # E2E tests (when implemented)
   ```

4. **Commit with Conventional Commits**
   ```bash
   git add .
   git commit -m "feat: add client CRUD operations with encryption
   
   - Implement secure client creation with health flags encryption
   - Add client listing with proper RBAC permissions
   - Include audit logging for all client operations
   - Add intake link generation with HMAC tokens
   
   🤖 Generated with [Claude Code](https://claude.ai/code)
   
   Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

5. **Create Pull Request**
   ```bash
   git push origin feature/your-feature-name
   # Then create PR via GitHub UI
   ```

### Commit Message Format

Use conventional commits with detailed descriptions:

```
<type>: <brief description>

<detailed description>
- List key changes
- Include any breaking changes
- Note security considerations

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types:**
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Build process or auxiliary tool changes

## Next Development Priorities

### Phase 1: Core CRUD Operations
1. **Client Management** (`feature/client-crud`)
   - Client creation/editing forms
   - Client listing with search/filter
   - Encrypted notes management
   - Intake link generation UI

2. **Service Management** (`feature/service-crud`)
   - Service creation/editing forms
   - Category management
   - Pricing and VAT configuration

3. **Location Management** (`feature/location-crud`)
   - Location setup forms
   - Travel buffer configuration
   - Address management

### Phase 2: Scheduling System
1. **Appointment Management** (`feature/appointment-crud`)
   - Appointment creation/editing
   - Calendar view (week/day)
   - Travel buffer enforcement
   - Status management

2. **Booking System** (`feature/booking-system`)
   - Public booking form for mini-sites
   - Availability checking
   - Email notifications

### Phase 3: Financial Operations
1. **Invoice System** (`feature/invoice-crud`)
   - Invoice creation from appointments
   - Line item editor
   - PDF generation improvements
   - Email delivery

2. **Payment Processing** (`feature/payment-integration`)
   - Stripe integration
   - Payment tracking
   - Subscription handling

### Phase 4: Enhanced Features
1. **Analytics Dashboard** (`feature/analytics`)
   - Advanced KPIs
   - Revenue charts
   - Client retention metrics

2. **Settings Management** (`feature/settings`)
   - Profile management
   - Legal text configuration
   - 2FA implementation

## Testing Requirements

### Before Every Commit
1. **Type Safety**
   ```bash
   pnpm typecheck
   ```

2. **Code Quality**
   ```bash
   pnpm lint
   ```

3. **Build Verification**
   ```bash
   pnpm build
   ```

4. **Manual Testing**
   - Test the specific feature/fix
   - Verify no regressions in related areas
   - Check responsive design
   - Test error states

### Test Implementation Priorities
1. **Unit Tests** - Crypto functions, tax calculations, token verification
2. **API Tests** - Route handlers, middleware, authentication
3. **E2E Tests** - Critical user flows (sign-in, create client, generate invoice)

## Security Checklist

Before committing any feature:

- [ ] **No secrets in code** - Use environment variables
- [ ] **Input validation** - Zod schemas for all inputs
- [ ] **Authorization checks** - Verify user permissions
- [ ] **Audit logging** - Log sensitive operations
- [ ] **Encryption** - Use for sensitive data (health flags, notes)
- [ ] **Rate limiting** - Apply to sensitive endpoints
- [ ] **HTTPS only** - No sensitive data over HTTP

## Code Quality Standards

### TypeScript
- Strict mode enabled
- No `any` types except in legacy code
- Proper error handling with typed exceptions

### React/Next.js
- Server Components by default
- Client Components only when needed
- Proper error boundaries
- SEO-friendly routing

### Database
- All queries through Prisma
- Proper indexing for performance
- Audit trails for sensitive operations
- No raw SQL except for complex analytics

### Security
- Field-level encryption for sensitive data
- Role-based access control
- Comprehensive audit logging
- Security headers on all responses

## Local Development Setup

1. **Prerequisites**
   ```bash
   node --version  # v20.x or later
   pnpm --version  # v8.x or later
   docker --version
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   echo "ENCRYPTION_KEY_B64=$(openssl rand -base64 32)" >> .env
   echo "INTAKE_TOKEN_SECRET=$(openssl rand -hex 32)" >> .env
   echo "NEXTAUTH_SECRET=$(openssl rand -hex 32)" >> .env
   ```

3. **Start Development**
   ```bash
   pnpm install
   pnpm docker:up
   pnpm prisma:migrate:dev
   pnpm dev
   ```

## Ready for Feature Development! 🚀

The foundation is complete. Start with Phase 1 features, creating individual branches for each component.