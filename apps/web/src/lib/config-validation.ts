/**
 * Server configuration validation
 * This file validates required environment variables at boot time
 * to prevent the application from running with insecure defaults.
 */

export function validateServerConfig() {
  // Skip validation during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    console.log('⏭️  Skipping config validation during build')
    return
  }

  const errors: string[] = []

  // Validate ADMIN_JWT_SECRET
  const adminSecret = process.env.ADMIN_JWT_SECRET
  if (!adminSecret) {
    errors.push('ADMIN_JWT_SECRET is required but not set')
  } else if (adminSecret.length < 32) {
    errors.push('ADMIN_JWT_SECRET must be at least 32 characters for security')
  }

  // Validate AUTH_SECRET (NextAuth)
  const authSecret = process.env.AUTH_SECRET
  if (!authSecret) {
    errors.push('AUTH_SECRET is required but not set')
  } else if (authSecret.length < 32) {
    errors.push('AUTH_SECRET must be at least 32 characters for security')
  }

  // Validate ENCRYPTION_KEY (for health data)
  const encryptionKey = process.env.ENCRYPTION_KEY
  if (!encryptionKey) {
    errors.push('ENCRYPTION_KEY is required but not set')
  } else if (encryptionKey.length < 32) {
    errors.push('ENCRYPTION_KEY must be at least 32 characters for security')
  }

  // If any validation errors, throw and prevent boot
  if (errors.length > 0) {
    console.error('\n🚨 SERVER CONFIGURATION ERRORS:\n')
    errors.forEach(error => console.error(`  ❌ ${error}`))
    console.error('\n📝 Please set the required environment variables in your .env file\n')
    console.error('Example .env configuration:')
    console.error('  ADMIN_JWT_SECRET=your-secure-256-bit-secret-here')
    console.error('  AUTH_SECRET=your-nextauth-secret-here')
    console.error('  ENCRYPTION_KEY=your-encryption-key-here\n')

    throw new Error(`Server configuration validation failed: ${errors.join(', ')}`)
  }

  console.log('✅ Server configuration validated successfully')
}

/**
 * Get validated admin JWT secret
 * This function assumes validateServerConfig() has already been called at boot
 */
export function getAdminJwtSecret(): Uint8Array {
  const secret = process.env.ADMIN_JWT_SECRET

  // During build, use a dummy secret (validation happens at runtime)
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return new TextEncoder().encode('build-time-dummy-secret-min-32-chars')
  }

  if (!secret || secret.length < 32) {
    throw new Error('ADMIN_JWT_SECRET not properly configured')
  }
  return new TextEncoder().encode(secret)
}

/**
 * Get validated encryption key
 * This function assumes validateServerConfig() has already been called at boot
 */
export function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY
  if (!key || key.length < 32) {
    throw new Error('ENCRYPTION_KEY not properly configured')
  }
  return key
}
