/**
 * Next.js Instrumentation Hook
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 *
 * This file runs once when the server starts, allowing us to validate
 * critical configuration before any requests are processed.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only run on Node.js runtime (not Edge)
    const { validateServerConfig } = await import('./src/lib/config-validation')

    // Validate all critical secrets at boot time
    // This will throw and prevent server start if any are missing/invalid
    validateServerConfig()
  }
}
