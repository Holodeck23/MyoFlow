import { createHmac, timingSafeEqual } from 'crypto';

const getSecret = (): Buffer => {
  const secret = process.env.INTAKE_TOKEN_SECRET;
  if (!secret) {
    throw new Error('INTAKE_TOKEN_SECRET is not set.');
  }
  return Buffer.from(secret, 'hex');
};

/**
 * Signs a payload to create a secure token for intake links.
 */
export function signIntakeToken(payload: object): string {
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const hmac = createHmac('sha256', getSecret());
  hmac.update(payloadB64);
  const signature = hmac.digest('base64url');

  return `${payloadB64}.${signature}`;
}

/**
 * Verifies an intake token and returns the payload if valid.
 * Throws an error if the token is invalid or expired.
 */
export function verifyIntakeToken<T>(token: string): T & { exp: number } {
  const [payloadB64, signature] = token.split('.');
  if (!payloadB64 || !signature) {
    throw new Error('Invalid token format');
  }

  const hmac = createHmac('sha256', getSecret());
  hmac.update(payloadB64);
  const expectedSignature = hmac.digest('base64url');

  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    throw new Error('Invalid signature');
  }

  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));

  if (payload.exp && Date.now() / 1000 > payload.exp) {
    throw new Error('Token expired');
  }

  return payload;
}

