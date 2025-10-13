import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@myoflow/db'
import { z } from 'zod'
import { assertValidVatNumber, normalizeVatNumber } from '@myoflow/lib'
import { requireTherapist, ensureTherapistAccount } from '@/lib/shared-helpers'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'

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
  taxValidationCompleted: z.boolean().optional(),
  taxValidatedAt: z.string().datetime().nullable().optional(),
})


export async function GET(request: NextRequest) {
  try {
    const { therapist } = await requireTherapist()

    const settings = await prisma.taxComplianceSettings.findUnique({
      where: { therapistId: therapist.id },
    })

    const therapistRecord = await prisma.therapist.findUnique({
      where: { id: therapist.id },
      select: {
        taxValidationCompleted: true,
        taxValidatedAt: true,
      },
    })

    // GET handler should not create missing data - return null structure instead
    if (!settings) {
      return NextResponse.json({
        id: null,
        therapistId: therapist.id,
        vatRegistered: false,
        kleinunternehmerActive: true,
        kleinunternehmerThresholdCents: 5_500_000,
        currentYearRevenueCents: 0,
        rksvEnabled: false,
        // Indicate this is default data, not persisted
        isDefault: true,
        taxValidationCompleted: therapistRecord?.taxValidationCompleted ?? false,
        taxValidatedAt: therapistRecord?.taxValidatedAt ?? null,
      })
    }

    return NextResponse.json({
      ...settings,
      isDefault: false,
      taxValidationCompleted: therapistRecord?.taxValidationCompleted ?? false,
      taxValidatedAt: therapistRecord?.taxValidatedAt ?? null,
    })
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
    const { therapist } = await ensureTherapistAccount(request)
    const payload = await request.json()
    const parsed = updateSchema.parse(payload)
    if (parsed.vatNumber) {
      assertValidVatNumber(parsed.vatNumber)
    }

    const current = await prisma.taxComplianceSettings.upsert({
      where: { therapistId: therapist.id },
      update: {},
      create: {
        therapistId: therapist.id,
        kleinunternehmerActive: true,
        kleinunternehmerThresholdCents: 5_500_000,
      },
    })

    const updateData: Record<string, any> = {}
    const therapistUpdateData: Record<string, any> = {
      settingsLastUpdated: new Date(),
      settingsVersion: { increment: 1 },
    }

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

    if (parsed.taxValidationCompleted !== undefined) {
      therapistUpdateData.taxValidationCompleted = parsed.taxValidationCompleted
      if (!parsed.taxValidationCompleted) {
        therapistUpdateData.taxValidatedAt = null
      }
    }

    if (parsed.taxValidatedAt !== undefined) {
      therapistUpdateData.taxValidatedAt = parsed.taxValidatedAt
        ? new Date(parsed.taxValidatedAt)
        : null
    }

    const updated = await prisma.taxComplianceSettings.update({
      where: { therapistId: therapist.id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    })

    await prisma.therapist.update({
      where: { id: therapist.id },
      data: therapistUpdateData,
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
