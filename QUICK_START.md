# MyoFlow - Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Prerequisites
```bash
# Check versions
node --version   # ≥ v20.0.0
pnpm --version   # ≥ v8.0.0
docker --version # Any recent version
```

### Setup & Run
```bash
# 1. Clone and enter directory
git clone https://github.com/your-org/MyoFlow.git
cd MyoFlow

# 2. Install dependencies
pnpm install

# 3. Setup environment
cp .env.example .env

# Generate required secrets
echo "ENCRYPTION_KEY_B64=$(openssl rand -base64 32)" >> .env
echo "INTAKE_TOKEN_SECRET=$(openssl rand -hex 32)" >> .env
echo "NEXTAUTH_SECRET=$(openssl rand -hex 32)" >> .env

# 4. Start infrastructure
pnpm docker:up

# 5. Setup database
pnpm prisma:migrate:dev

# 6. Start development server
pnpm dev
```

### 🎯 Access Points
- **Dashboard:** http://localhost:3000
- **Sign In:** http://localhost:3000/auth/sign-in
- **Mini-Site Example:** http://localhost:3000/s/dev-therapist
- **Prisma Studio:** `pnpm prisma:studio`

### 🔐 Test Login
The seed creates a test user: `dev@myoflow.local`

### 🏗️ Development Commands
```bash
pnpm dev         # Start all servers
pnpm build       # Build everything
pnpm typecheck   # Type checking
pnpm lint        # Code linting
pnpm test        # Run tests (when available)

# Database
pnpm prisma:studio      # Database GUI
pnpm prisma:migrate:dev # Apply migrations

# Docker
pnpm docker:up    # Start PostgreSQL + Redis
pnpm docker:down  # Stop containers
```

### 🛡️ Security Features Active
- ✅ Field-level encryption (libsodium)
- ✅ Audit logging for sensitive operations
- ✅ RBAC with role-based data access
- ✅ Security headers (HSTS, CSP, etc.)
- ✅ Rate limiting on auth endpoints
- ✅ HMAC-signed intake tokens

### 🇦🇹 Austrian Compliance Ready
- ✅ Kleinunternehmer regulation (55k€ limit)
- ✅ Multiple VAT rates (10%, 13%, 20%)
- ✅ Therapist designations
- ✅ Invoice PDF generation
- ✅ Real-time tax threshold tracking

### 📱 What's Included
- **Dashboard:** Revenue tracking, booking stats, KPIs
- **Client Management:** Encrypted health data, intake forms
- **Appointment System:** Multi-location scheduling
- **Invoice System:** Austrian-compliant PDF generation
- **Mini-Sites:** Public booking pages at `/s/[slug]`
- **Security:** Comprehensive audit trails

### 🔧 Troubleshooting

**Database connection issues:**
```bash
pnpm docker:down && pnpm docker:up
```

**Build errors:**
```bash
pnpm install --frozen-lockfile
pnpm prisma:generate
```

**Port conflicts:**
- PostgreSQL: 5432
- Redis: 6379
- Next.js: 3000

---

**Ready to develop!** Check `DEVELOPMENT.md` for branching workflow and feature priorities.