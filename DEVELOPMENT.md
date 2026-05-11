# Development Guide

**Last Updated:** October 4, 2025

## 🚀 Quick Start

### Prerequisites
```bash
node --version   # ≥ v20.0.0
pnpm --version   # ≥ v8.0.0
docker --version # Any recent version
```

### Setup in 5 Minutes

```bash
# 1. Clone and install
git clone https://github.com/Holodeck23/MyoFlow.git
cd MyoFlow && pnpm install

# 2. Environment setup
cp .env.example .env

# Generate required secrets
echo "ENCRYPTION_KEY_B64=$(openssl rand -base64 32)" >> .env
echo "INTAKE_TOKEN_SECRET=$(openssl rand -hex 32)" >> .env
echo "NEXTAUTH_SECRET=$(openssl rand -hex 32)" >> .env
echo "ADMIN_JWT_SECRET=$(openssl rand -hex 32)" >> .env

# 3. Start infrastructure
pnpm docker:up

# 4. Setup database
pnpm prisma:migrate:dev

# 5. (Optional) Seed test data
pnpm prisma:seed

# 6. Start development server
pnpm dev
```

**Quick Setup (All-in-One):**
```bash
pnpm setup
# This runs: install → docker:up → migrate → seed → ready!
```

🎉 **Ready!** Visit http://localhost:3000

### Access Points
- **Dashboard:** http://localhost:3000
- **Sign In:** http://localhost:3000/auth/sign-in
- **Prisma Studio:** `pnpm prisma:studio`

## 🛠️ Development Commands

### Core Commands
```bash
pnpm dev         # Start all servers
pnpm build       # Production build
pnpm typecheck   # Type checking
pnpm lint        # Code linting
```

### Database Commands
```bash
pnpm prisma:studio      # Database GUI
pnpm prisma:migrate:dev # Apply migrations
pnpm prisma:generate    # Regenerate client
pnpm prisma:seed        # Seed test data (opt-in)
```

**Note:** Seed data is now opt-in. Use `pnpm prisma:seed` to create test users and data when needed.

### Docker Commands
```bash
pnpm docker:up    # Start PostgreSQL
pnpm docker:down  # Stop containers
```

### Testing
```bash
pnpm --filter @myoflow/web test:e2e  # Run Playwright E2E tests
```

## 📁 Architecture

- **Monorepo:** Turborepo with packages (db, lib, ui, web)
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** NextAuth v5 with Google + credentials
- **Styling:** Tailwind CSS with Austrian medical theme
- **Encryption:** libsodium for client data
- **API:** Next.js API routes with Austrian compliance

## 🔐 Environment Variables

Required in `.env`:

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/myoflow

# Authentication
NEXTAUTH_SECRET=<generated-secret>
NEXTAUTH_URL=http://localhost:3000

# Encryption
ENCRYPTION_KEY_B64=<generated-base64-key>
INTAKE_TOKEN_SECRET=<generated-secret>

# Admin
ADMIN_JWT_SECRET=<generated-secret>

# OAuth (Optional)
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>

# Demo Mode (Development Only)
AUTH_ENABLE_DEMO=true  # Enables test users
```

### Demo Users (when AUTH_ENABLE_DEMO=true)
- Test user: `test@myoflow.at` — password via `E2E_DEMO_PASSWORD` env var
- Admin demo: `admin@myoflow.at` — password via `E2E_ADMIN_PASSWORD` / `ADMIN_DEMO_PASSWORD` env var

## ✅ Quality Gates

**Before every commit:**
```bash
pnpm typecheck && pnpm lint && pnpm build
```

All three must pass before merging to main.

## 🏗️ Development Workflow

See `COORDINATION.md` for multi-agent workflow and `docs/guides/git-workflow.md` for branching strategy.

### Sprint-Based Development
1. Create sprint branch from main
2. Implement sprint objectives
3. Pass quality gates
4. Create PR and merge to main
5. Update `CLAUDE.md` with progress

## 🔧 Troubleshooting

### Database Issues
```bash
pnpm docker:down && pnpm docker:up
pnpm prisma:generate
```

### Build Errors
```bash
pnpm install --frozen-lockfile
pnpm prisma:generate
```

### Port Conflicts
- PostgreSQL: 5432
- Next.js: 3000
- Playwright tests: 3001

## 📚 Additional Documentation

- **Project Status:** See `README.md`
- **Session Notes:** See `CLAUDE.md`
- **Decisions:** See `docs/decisions/decision-log.md`
- **Coordination:** See `COORDINATION.md`
- **Documentation Index:** See `DOCS_INDEX.md`