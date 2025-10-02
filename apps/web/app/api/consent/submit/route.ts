import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@myoflow/db'
import { z } from 'zod'
import { verifyIntakeToken } from '@myoflow/lib/security'
import { encryptJson } from '@myoflow/lib'

const rateStore: Map<string, { count: number; reset: number }> =
  (globalThis as any).__consentRateStore || new Map()
;(globalThis as any).__consentRateStore = rateStore

const schema = z.object({
  token: z.string(),
  docVersion: z.string(),
  payload: z.any(),
})

function checkRate(ip: string): boolean {
  const now = Date.now()
  const rec = rateStore.get(ip)
  if (!rec || now > rec.reset) {
    rateStore.set(ip, { count: 1, reset: now + 60_000 })
    return true
  }
  if (rec.count >= 5) return false
  rec.count += 1
  return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || ''
  if (!checkRate(ip)) {
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
