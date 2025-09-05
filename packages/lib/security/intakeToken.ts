import { createHmac, timingSafeEqual } from 'crypto'

const INTAKE_TOKEN_SECRET = process.env.INTAKE_TOKEN_SECRET

if (!INTAKE_TOKEN_SECRET) {
  throw new Error('INTAKE_TOKEN_SECRET environment variable is required')
}

export interface IntakeTokenPayload {
  therapistId: string
  clientId: string
  exp: number
}

export function signIntakeToken(payload: IntakeTokenPayload): string {
  const data = JSON.stringify(payload)
  const signature = createHmac('sha256', INTAKE_TOKEN_SECRET!)
    .update(data)
    .digest('base64url')
  
  return Buffer.from(data).toString('base64url') + '.' + signature
}

export function verifyIntakeToken(token: string): IntakeTokenPayload {
  const [payloadB64, signature] = token.split('.')
  
  if (!payloadB64 || !signature) {
    throw new Error('Invalid token format')
  }
  
  const data = Buffer.from(payloadB64, 'base64url').toString()
  const expectedSignature = createHmac('sha256', INTAKE_TOKEN_SECRET!)
    .update(data)
    .digest('base64url')
  
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    throw new Error('Invalid token signature')
  }
  
  const payload = JSON.parse(data) as IntakeTokenPayload
  
  if (Date.now() > payload.exp) {
    throw new Error('Token expired')
  }
  
  return payload
}

export function generateIntakeLink(therapistId: string, clientId: string, baseUrl: string): string {
  const exp = Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
  const token = signIntakeToken({ therapistId, clientId, exp })
  
  return `${baseUrl}/intake/${token}`
}