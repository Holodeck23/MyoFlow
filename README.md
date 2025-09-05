# MyoFlow

MyoFlow is a secure, bilingual practice management platform designed for Austrian therapists, primarily focusing on massage therapy. It provides tools for client management, appointments, invoicing, and a public-facing mini-site for bookings and sales.

This is a single-tenant application per therapist, ensuring data isolation and security.

## Requirements

- Node.js (v20.x or later)
- pnpm (v8.x or later)
- Docker and Docker Compose

## Local Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd myoflow
    ```

2.  **Set up environment variables:**
    Copy the example environment file and fill in the required values.
    ```bash
    cp .env.example .env
    ```
    You will need to generate a secret for `ENCRYPTION_KEY_B64` by running: `openssl rand -base64 32`.

3.  **Start infrastructure:**
    Run the local PostgreSQL and Redis instances using Docker.
    ```bash
    docker compose -f infra/docker/docker-compose.yml up -d
    ```

4.  **Install dependencies:**
    ```bash
    pnpm install
    ```

5.  **Run database migrations:**
    Apply the Prisma schema to your local database and run the seed script.
    ```bash
    pnpm -w prisma migrate dev
    ```

6.  **Start the development server:**
    ```bash
    pnpm dev
    ```

The application will be available at `http://localhost:3000`.

## Security Baseline

MyoFlow is built with a strong security foundation:
- **Authentication:** Secure sessions via NextAuth.js with CSRF protection. Scaffolding for TOTP 2-Factor Authentication is included.
- **Encryption:** Sensitive client data (health flags, notes) and consent form payloads are encrypted at the field level using `libsodium`.
- **Auditing:** A comprehensive audit log tracks all read and write operations on sensitive resources.
- **Secure Headers:** Standard security headers (HSTS, CSP, etc.) are implemented in the middleware.
- **Rate Limiting:** Basic rate limiting is in place for authentication and public form submission endpoints.

## Internationalization (i18n)

The application is bilingual with German (DE) as the default language and English (EN) as the secondary language. Dictionaries are located in `apps/web/app/(dictionaries)`.

## Theming

The UI is built with Tailwind CSS and shadcn/ui. The public mini-site's theme (brand color, logo) can be customized by the therapist in the settings panel.

