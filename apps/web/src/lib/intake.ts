import crypto from 'crypto'

interface IntakeTokenPayload {
  therapistId: string
  clientId: string
  exp: number
}

interface PublicInvoiceTokenPayload {
  invoiceId: string
  therapistId: string
  exp: number
}

/**
 * Create a public invoice access token with expiration
 */
export function createPublicInvoiceToken(invoiceId: string, therapistId: string, expiresInMs: number = 7 * 24 * 60 * 60 * 1000): string {
  const secret = process.env.INTAKE_TOKEN_SECRET
  if (!secret) {
    throw new Error('INTAKE_TOKEN_SECRET missing')
  }

  const payload: PublicInvoiceTokenPayload = {
    invoiceId,
    therapistId,
    exp: Date.now() + expiresInMs
  }

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64')
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('hex')

  return `${payloadB64}.${signature}`
}

/**
 * Verify a public invoice access token
 */
export function verifyPublicInvoiceToken(token: string): PublicInvoiceTokenPayload | null {
  const secret = process.env.INTAKE_TOKEN_SECRET
  if (!secret) {
    throw new Error('INTAKE_TOKEN_SECRET missing')
  }

  const [payloadB64, signature] = token.split('.')
  if (!payloadB64 || !signature) return null

  const expected = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('hex')
  const sigBuf = Buffer.from(signature)
  const expBuf = Buffer.from(expected)

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null
  }

  try {
    const json = Buffer.from(payloadB64, 'base64').toString('utf8')
    const payload = JSON.parse(json) as PublicInvoiceTokenPayload
    if (typeof payload.exp !== 'number' || Date.now() > payload.exp) {
      return null
    }
    return payload
  } catch {
    return null
  }
}

/**
 * Verify an intake token signed with HMAC.
 * Token format: base64url(payload).hex(hmac)
 */
export function verifyIntakeToken(token: string): IntakeTokenPayload | null {
  const secret = process.env.INTAKE_TOKEN_SECRET
  if (!secret) {
    throw new Error('INTAKE_TOKEN_SECRET missing')
  }
  const [payloadB64, signature] = token.split('.')
  if (!payloadB64 || !signature) return null
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('hex')
  const sigBuf = Buffer.from(signature)
  const expBuf = Buffer.from(expected)
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null
  }
  try {
    const json = Buffer.from(payloadB64, 'base64').toString('utf8')
    const payload = JSON.parse(json) as IntakeTokenPayload
    if (typeof payload.exp !== 'number' || Date.now() > payload.exp) {
      return null
    }
    return payload
  } catch {
    return null
  }
}
