# Development Guide

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Add your database URL and encryption keys

# Run database migrations
pnpm db:migrate

# Start development server
pnpm dev
```

## Quality Gates

Before committing:
```bash
pnpm typecheck && pnpm lint && pnpm build
```

## Architecture

- **Monorepo:** Turborepo with packages (db, lib, ui, web)
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** NextAuth v5 with Google + credentials
- **Styling:** Tailwind CSS with custom Austrian medical theme
- **Encryption:** libsodium for client data

## Key Commands

- `pnpm dev` - Start all packages in dev mode
- `pnpm build` - Production build
- `pnpm test` - Run test suite
- `pnpm db:push` - Push schema changes to database

## Environment Variables

Required in `.env.local`:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Authentication secret
- `ENCRYPTION_KEY_B64` - Base64 encryption key for client data
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - OAuth (optional)

## Current Status

See `docs/current/project-status.md` for latest development status and MVP completion details.