import crypto from 'crypto'

function getSecret(): string {
  const secret = process.env.INTAKE_TOKEN_SECRET
  if (!secret) {
    throw new Error('INTAKE_TOKEN_SECRET not set')
  }
  return secret
}

/**
 * Generic token creator with expiration support
 */
export function createIntakeToken(payload: Record<string, any>): string {
  const data = JSON.stringify(payload)
  const signature = crypto.createHmac('sha256', getSecret()).update(data).digest('hex')
  const body = Buffer.from(data).toString('base64url')
  return `${body}.${signature}`
}

/**
 * Generic token verifier with expiration check
 */
export function verifyIntakeToken(token: string): Record<string, any> | null {
  const [body, signature] = token.split('.')
  if (!body || !signature) return null
  const data = Buffer.from(body, 'base64url').toString()
  const expected = crypto.createHmac('sha256', getSecret()).update(data).digest('hex')
  const sigBuf = Buffer.from(signature, 'hex')
  const expBuf = Buffer.from(expected, 'hex')
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null
  }
  const payload = JSON.parse(data)
  // Check expiration if present
  if (payload.exp && typeof payload.exp === 'number' && Date.now() > payload.exp) {
    return null
  }
  return payload
}

/**
 * Create a public invoice access token with expiration
 */
export function createPublicInvoiceToken(
  invoiceId: string,
  therapistId: string,
  expiresInMs: number = 7 * 24 * 60 * 60 * 1000
): string {
  return createIntakeToken({
    invoiceId,
    therapistId,
    exp: Date.now() + expiresInMs
  })
}

/**
 * Verify a public invoice access token
 */
export function verifyPublicInvoiceToken(token: string): { invoiceId: string; therapistId: string; exp: number } | null {
  const payload = verifyIntakeToken(token)
  if (!payload || !payload.invoiceId || !payload.therapistId) {
    return null
  }
  return payload as { invoiceId: string; therapistId: string; exp: number }
}
