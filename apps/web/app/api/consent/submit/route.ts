import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@myoflow/db'
import { z } from 'zod'
import { verifyIntakeToken } from '@myoflow/lib/security'
import { encryptJson } from '@myoflow/lib'

const schema = z.object({
  token: z.string(),
  docVersion: z.string(),
  payload: z.any(),
})

/**
 * PostgreSQL-backed rate limiter for production scalability.
 * Allows 5 requests per minute per IP for consent submission.
 */
async function checkRate(ip: string): Promise<boolean> {
  const windowMs = 60_000 // 1 minute
  const limit = 5
  const now = new Date()
  const windowStart = new Date(now.getTime() - windowMs)

  // Clean up old rate limit records (older than 1 minute)
  await prisma.rateLimit.deleteMany({
    where: {
      key: `consent:${ip}`,
      createdAt: { lt: windowStart }
    }
  })

  // Count requests in current window
  const count = await prisma.rateLimit.count({
    where: {
      key: `consent:${ip}`,
      createdAt: { gte: windowStart }
    }
  })

  if (count >= limit) {
    return false
  }

  // Record this request
  await prisma.rateLimit.create({
    data: {
      key: `consent:${ip}`,
      createdAt: now
    }
  })

  return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || ''
  if (!(await checkRate(ip))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const tokenData = verifyIntakeToken(parsed.data.token)
  if (!tokenData) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }

  const cipher = await encryptJson(parsed.data.payload)
  const consent = await prisma.consent.create({
    data: {
      therapistId: tokenData.therapistId,
      clientId: tokenData.clientId,
      docVersion: parsed.data.docVersion,
      acceptedAt: new Date(),
      ip,
      payloadEnc: cipher,
    },
  })

  await prisma.auditLog.create({
    data: {
      therapistId: tokenData.therapistId,
      entity: 'Consent',
      entityId: consent.id,
      action: 'create',
      ip,
    },
  })

  return NextResponse.json({ ok: true })
}
