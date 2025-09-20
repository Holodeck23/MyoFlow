import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@myoflow/db'
import { z } from 'zod'
import { assertValidVatNumber, normalizeVatNumber } from '@myoflow/lib'

const updateSchema = z.object({
  vatRegistered: z.boolean().optional(),
  vatNumber: z.string().trim().nullable().optional(),
  kleinunternehmerActive: z.boolean().optional(),
  kleinunternehmerThresholdCents: z
    .number()
    .int()
    .min(1000000)
    .max(20000000)
    .optional(),
  taxAdvisor: z
    .object({
      name: z.string().min(2).max(100).optional().nullable(),
      email: z.string().email().optional().nullable(),
      phone: z.string().max(50).optional().nullable(),
    })
    .optional(),
  rksv: z
    .object({
      enabled: z.boolean().optional(),
      cashRegisterId: z.string().max(100).optional().nullable(),
      signatureDeviceId: z.string().max(100).optional().nullable(),
      lastAuditAt: z.string().datetime().optional().nullable(),
      nextAuditDue: z.string().datetime().optional().nullable(),
      notes: z.string().max(1000).optional().nullable(),
    })
    .optional(),
})

async function authenticate(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    throw new Response('Unauthorized', { status: 401 })
  }

  const user = await prisma.user.upsert({
    where: { email: session.user.email },
    update: {
      name: session.user.name || session.user.email || 'Therapist',
    },
    create: {
      email: session.user.email,
      name: session.user.name || session.user.email || 'Therapist',
      role: 'OWNER',
    },
  })

  const therapist = await prisma.therapist.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      slug: session.user.email?.split('@')[0] || `therapist-${user.id}`,
      designation: 'HEILMASSEUR',
      vatStatus: 'KLEINUNTERNEHMER',
    },
  })

  return therapist.id
}

export async function GET(request: NextRequest) {
  try {
    const therapistId = await authenticate(request)

    const settings = await prisma.taxComplianceSettings.findUnique({
      where: { therapistId },
    })

    if (!settings) {
      const defaults = await prisma.taxComplianceSettings.create({
        data: {
          therapistId,
          kleinunternehmerActive: true,
          kleinunternehmerThresholdCents: 5_500_000,
        },
      })
      return NextResponse.json(defaults)
    }

    return NextResponse.json(settings)
  } catch (error) {
    if (error instanceof Response) {
      throw error
    }

    console.error('Tax compliance fetch failed:', error)
    return NextResponse.json({ error: 'Failed to fetch tax compliance settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const therapistId = await authenticate(request)
    const payload = await request.json()
    const parsed = updateSchema.parse(payload)
    if (parsed.vatNumber) {
      assertValidVatNumber(parsed.vatNumber)
    }

    const current = await prisma.taxComplianceSettings.upsert({
      where: { therapistId },
      update: {},
      create: {
        therapistId,
        kleinunternehmerActive: true,
        kleinunternehmerThresholdCents: 5_500_000,
      },
    })

    const updateData: any = {}

    if (parsed.vatRegistered !== undefined) {
      updateData.vatRegistered = parsed.vatRegistered
      if (!parsed.vatRegistered) {
        updateData.vatNumber = null
      } else {
        updateData.kleinunternehmerActive = false
      }
    }

    if (parsed.vatNumber !== undefined) {
      updateData.vatNumber = normalizeVatNumber(parsed.vatNumber)
    }

    if (parsed.kleinunternehmerActive !== undefined) {
      if (parsed.kleinunternehmerActive && (parsed.vatRegistered ?? current.vatRegistered)) {
        return NextResponse.json({
          error: 'VAT registration and Kleinunternehmer status are mutually exclusive',
        }, { status: 400 })
      }
      updateData.kleinunternehmerActive = parsed.kleinunternehmerActive
      if (parsed.kleinunternehmerActive) {
        updateData.vatRegistered = false
        updateData.vatNumber = null
      }
    }

    if (parsed.kleinunternehmerThresholdCents !== undefined) {
      updateData.kleinunternehmerThresholdCents = parsed.kleinunternehmerThresholdCents
    }

    if (parsed.taxAdvisor) {
      updateData.taxAdvisorName = parsed.taxAdvisor.name ?? null
      updateData.taxAdvisorEmail = parsed.taxAdvisor.email ?? null
      updateData.taxAdvisorPhone = parsed.taxAdvisor.phone ?? null
    }

    if (parsed.rksv) {
      updateData.rksvEnabled = parsed.rksv.enabled ?? current.rksvEnabled
      updateData.cashRegisterId = parsed.rksv.cashRegisterId ?? null
      updateData.signatureDeviceId = parsed.rksv.signatureDeviceId ?? null
      updateData.lastRksvAuditAt = parsed.rksv.lastAuditAt ? new Date(parsed.rksv.lastAuditAt) : null
      updateData.nextRksvAuditDue = parsed.rksv.nextAuditDue ? new Date(parsed.rksv.nextAuditDue) : null
      updateData.rksvNotes = parsed.rksv.notes ?? null
    }

    const updated = await prisma.taxComplianceSettings.update({
      where: { therapistId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    })

    await prisma.therapist.update({
      where: { id: therapistId },
      data: {
        settingsLastUpdated: new Date(),
        settingsVersion: { increment: 1 },
      },
    })

    return NextResponse.json({ success: true, settings: updated })
  } catch (error) {
    if (error instanceof Response) {
      throw error
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.error('Tax compliance update failed:', error)
    return NextResponse.json({ error: 'Failed to update tax compliance settings' }, { status: 500 })
  }
}
