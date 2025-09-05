import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@myoflow/db'
import { verifyIntakeToken, encryptJSON, auditCreate } from '@myoflow/lib'
import { z } from 'zod'

const prisma = new PrismaClient()

// Rate limiting: simple in-memory store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes
const RATE_LIMIT_MAX = 5

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const key = `consent_${ip}`
  const current = rateLimitStore.get(key)
  
  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }
  
  if (current.count >= RATE_LIMIT_MAX) {
    return false
  }
  
  current.count++
  return true
}

const ConsentSchema = z.object({
  token: z.string(),
  consents: z.object({
    dataProcessing: z.boolean(),
    medicalTreatment: z.boolean(),
    marketing: z.boolean().optional(),
  }),
  signature: z.string().optional(),
  healthFlags: z.object({
    allergies: z.string().optional(),
    medications: z.string().optional(),
    conditions: z.string().optional(),
    other: z.string().optional(),
  }).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    
    // Rate limiting
    if (!checkRateLimit(ip)) {
      return new NextResponse('Too many requests', { status: 429 })
    }

    const body = await request.json()
    const { token, consents, signature, healthFlags } = ConsentSchema.parse(body)

    // Verify intake token
    let tokenPayload
    try {
      tokenPayload = verifyIntakeToken(token)
    } catch (error) {
      return new NextResponse('Invalid or expired token', { status: 400 })
    }

    // Prepare consent payload for encryption
    const consentPayload = {
      consents,
      signature,
      healthFlags,
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString(),
    }

    // Encrypt the payload
    const encryptedPayload = encryptJSON(consentPayload)

    // Save consent
    const consent = await prisma.consent.create({
      data: {
        therapistId: tokenPayload.therapistId,
        clientId: tokenPayload.clientId,
        docVersion: '1.0', // TODO-CLAUDE: Version from settings
        acceptedAt: new Date(),
        ip,
        payloadEnc: encryptedPayload,
      },
    })

    // Audit log
    await auditCreate(
      {
        therapistId: tokenPayload.therapistId,
        ip,
      },
      'Consent',
      consent.id,
      {
        clientId: tokenPayload.clientId,
        hasHealthFlags: !!healthFlags,
        hasSignature: !!signature,
      }
    )

    // Update client health flags if provided
    if (healthFlags && Object.values(healthFlags).some(Boolean)) {
      const encryptedHealthFlags = encryptJSON(healthFlags)
      
      await prisma.client.update({
        where: { id: tokenPayload.clientId },
        data: { healthFlagsEnc: encryptedHealthFlags },
      })

      await auditCreate(
        {
          therapistId: tokenPayload.therapistId,
          ip,
        },
        'Client',
        tokenPayload.clientId,
        { action: 'healthFlagsUpdated' }
      )
    }

    return new NextResponse(null, { status: 204 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse('Invalid data format', { status: 400 })
    }
    
    console.error('Consent submission error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}