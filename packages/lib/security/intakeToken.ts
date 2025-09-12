import crypto from 'crypto'

function getSecret(): string {
  const secret = process.env.INTAKE_TOKEN_SECRET
  if (!secret) {
    throw new Error('INTAKE_TOKEN_SECRET not set')
  }
  return secret
}

export function createIntakeToken(payload: Record<string, any>): string {
  const data = JSON.stringify(payload)
  const signature = crypto.createHmac('sha256', getSecret()).update(data).digest('hex')
  const body = Buffer.from(data).toString('base64url')
  return `${body}.${signature}`
}

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
  return JSON.parse(data)
}
