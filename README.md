# MyoFlow

MyoFlow is a secure, bilingual practice management platform designed for Austrian therapists, primarily focusing on massage therapy. It provides tools for client management, appointments, invoicing, and a public-facing mini-site for bookings and sales.

This is a single-tenant application per therapist, ensuring data isolation and security.

## Requirements

- Node.js (v20.x or later)
- pnpm (v8.x or later)  
- Docker and Docker Compose

## Local Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd myoflow
   ```

2. **Set up environment variables:**
   Copy the example environment file and fill in the required values:
   ```bash
   cp .env.example .env
   ```
   Generate required secrets:
   ```bash
   # Generate encryption key
   echo "ENCRYPTION_KEY_B64=$(openssl rand -base64 32)" >> .env
   
   # Generate intake token secret  
   echo "INTAKE_TOKEN_SECRET=$(openssl rand -hex 32)" >> .env
   
   # Generate NextAuth secret
   echo "NEXTAUTH_SECRET=$(openssl rand -hex 32)" >> .env
   ```

3. **Start infrastructure:**
   Run the local PostgreSQL and Redis instances using Docker:
   ```bash
   pnpm docker:up
   ```

4. **Install dependencies:**
   ```bash
   pnpm install
   ```

5. **Run database migrations:**
   Apply the Prisma schema to your local database and run the seed script:
   ```bash
   pnpm prisma:migrate:dev
   ```

6. **Start the development server:**
   ```bash
   pnpm dev
   ```

The application will be available at `http://localhost:3000`.

## Project Structure

```
.
├─ apps/
│  └─ web/                        # Next.js 14 application (dashboard + public mini-site)
├─ packages/
│  ├─ ui/                         # shadcn/ui components + Tailwind theme
│  ├─ db/                         # Prisma schema + migrations + seed
│  └─ lib/                        # Shared utilities (i18n, pdf, crypto, security)
├─ infra/
│  ├─ docker/docker-compose.yml   # PostgreSQL + Redis
│  └─ ci/ci.yml                   # GitHub Actions CI
└─ .github/workflows/ci.yml       # CI pipeline
```

## Security Baseline

MyoFlow is built with a strong security foundation:

- **Authentication:** Secure sessions via NextAuth.js with CSRF protection. Scaffolding for TOTP 2-Factor Authentication is included.
- **Encryption:** Sensitive client data (health flags, notes) and consent form payloads are encrypted at the field level using `libsodium`.
- **Auditing:** A comprehensive audit log tracks all read and write operations on sensitive resources.
- **Secure Headers:** Standard security headers (HSTS, CSP, Referrer-Policy, Permissions-Policy) are implemented in middleware.
- **Rate Limiting:** Basic rate limiting is in place for authentication and public form submission endpoints.
- **RBAC:** Role-based access control prevents ACCOUNTANT users from accessing encrypted health data.

## Internationalization (i18n)

The application is bilingual with German (DE) as the default language and English (EN) as the secondary language. Dictionaries are located in `packages/lib/i18n/dictionaries/`.

## Theming & Mini-Sites

- The UI is built with Tailwind CSS and shadcn/ui components
- Public mini-sites are available at `/s/[slug]` routes (path-based)
- Each therapist can customize their brand color and logo
- Mini-sites include: services, booking form, products, contact, and voucher sales

## Key Features

### Dashboard
- Revenue tracking (monthly/annual)
- Booking statistics
- Kleinunternehmer progress bar (55,000€ limit)
- Service mix analytics

### Client Management
- Encrypted health flags and notes
- Intake link generation with HMAC tokens
- Audit logging for all access

### Appointments & Scheduling
- Multi-location support
- Travel buffer enforcement between different locations
- Appointment status tracking

### Invoicing
- Austrian-compliant invoice generation
- Kleinunternehmer tax handling
- PDF generation with on-the-fly streaming
- Multiple VAT rates (10%, 13%, 20%)

### Public Mini-Site Features
- Service catalog with pricing
- Booking request forms
- Voucher sales and redemption
- Product sales (physical/digital)
- Affiliate tracking via ref codes

## Development Scripts

```bash
# Root level commands
pnpm dev              # Start all development servers
pnpm build            # Build all packages
pnpm lint             # Lint all packages  
pnpm typecheck        # Type check all packages
pnpm test             # Run tests (when implemented)

# Database commands
pnpm prisma:migrate:dev   # Run Prisma migrations
pnpm prisma:generate      # Generate Prisma client
pnpm prisma:studio        # Open Prisma Studio

# Docker commands  
pnpm docker:up        # Start PostgreSQL + Redis
pnpm docker:down      # Stop containers
```

## Environment Variables

See `.env.example` for the complete list of required environment variables including:

- Database and Redis URLs
- NextAuth configuration  
- Encryption keys
- Email/SMS provider settings
- Stripe payment configuration
- Optional PostHog analytics

## License

Private commercial software for Austrian therapy practices.

