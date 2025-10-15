import { NextRequest, NextResponse } from 'next/server'
import { addMonths, differenceInDays, isAfter } from 'date-fns'
import { prisma } from '@myoflow/db'
import { z } from 'zod'
import {
  ensureTherapistAccount,
  handleAuthErrors,
  requireTherapist,
} from '@/lib/shared-helpers'

export const dynamic = 'force-dynamic'

const RKSV_THRESHOLD_CENTS = 1_500_000 // €15,000 annual revenue threshold

const updateSchema = z
  .object({
    enabled: z.boolean().optional(),
    cashRegisterId: z.string().trim().max(100).nullable().optional(),
    signatureDeviceId: z.string().trim().max(100).nullable().optional(),
    lastAuditAt: z.string().datetime().nullable().optional(),
    nextAuditDue: z.string().datetime().nullable().optional(),
    notes: z.string().trim().max(1000).nullable().optional(),
  })
  .strict()

type UpdatePayload = z.infer<typeof updateSchema>

interface RouteParams {
  params: {
    id?: string
  }
}

function normalizeNullableString(value: string | null | undefined) {
  if (value === undefined) return undefined
  if (value === null) return null
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

function calculateRksvComplianceDetails(revenueCents: number, taxSettings: any) {
  const rksvRequired = revenueCents >= RKSV_THRESHOLD_CENTS
  const rksvImplemented = Boolean(taxSettings?.rksvEnabled)

  const lastAudit = taxSettings?.lastRksvAuditAt ? new Date(taxSettings.lastRksvAuditAt) : null
  const nextAuditDue = taxSettings?.nextRksvAuditDue ? new Date(taxSettings.nextRksvAuditDue) : null
  const isAuditOverdue = nextAuditDue ? isAfter(new Date(), nextAuditDue) : false
  const daysUntilAudit = nextAuditDue ? differenceInDays(nextAuditDue, new Date()) : null

  let status: 'not_required' | 'implementation_required' | 'compliant' | 'audit_overdue' =
    'not_required'

  if (rksvRequired) {
    if (!rksvImplemented) {
      status = 'implementation_required'
    } else if (isAuditOverdue) {
      status = 'audit_overdue'
    } else {
      status = 'compliant'
    }
  }

  return {
    status,
    required: rksvRequired,
    implemented: rksvImplemented,
    revenueThreshold: RKSV_THRESHOLD_CENTS / 100,
    currentRevenue: revenueCents / 100,
    thresholdPercentage: (revenueCents / RKSV_THRESHOLD_CENTS) * 100,
    monthsUntilDeadline: rksvRequired && !rksvImplemented ? 4 : null,
    lastAuditAt: lastAudit ? lastAudit.toISOString() : null,
    nextAuditDue: nextAuditDue ? nextAuditDue.toISOString() : null,
    daysUntilAudit,
    isAuditOverdue,
    cashRegisterId: taxSettings?.cashRegisterId ?? null,
    signatureDeviceId: taxSettings?.signatureDeviceId ?? null,
    notes: taxSettings?.rksvNotes ?? null,
  }
}

async function getRksvSnapshot(therapistId: string) {
  const [taxSettings, revenueAggregation] = await Promise.all([
    prisma.taxComplianceSettings.findUnique({
      where: { therapistId },
    }),
    prisma.invoice.aggregate({
      _sum: { totalGrossCents: true },
      where: {
        therapistId,
        status: { in: ['SENT', 'PAID'] },
        createdAt: {
          gte: new Date(new Date().getFullYear(), 0, 1),
        },
      },
    }),
  ])

  const revenueCents = revenueAggregation._sum.totalGrossCents ?? 0
  const complianceDetails = calculateRksvComplianceDetails(revenueCents, taxSettings)

  return {
    ...complianceDetails,
    requirements: {
      annualRevenueThreshold: '€15,000',
      implementationDeadline: '4 months after crossing threshold',
      auditFrequency: 'Annual signature device audit required',
      penalties: 'Up to €5,000 for non-compliance',
      documentation: 'Receipt signatures, audit trail required',
    },
  }
}

function buildUpdateData(payload: UpdatePayload, current: any) {
  const updateData: Record<string, unknown> = {}

  if (payload.enabled !== undefined) {
    updateData.rksvEnabled = payload.enabled
    if (payload.enabled && !current?.rksvEnabled) {
      updateData.nextRksvAuditDue = addMonths(new Date(), 12)
    }
  }

  if (payload.cashRegisterId !== undefined) {
    updateData.cashRegisterId = normalizeNullableString(payload.cashRegisterId)
  }

  if (payload.signatureDeviceId !== undefined) {
    updateData.signatureDeviceId = normalizeNullableString(payload.signatureDeviceId)
  }

  if (payload.lastAuditAt !== undefined) {
    updateData.lastRksvAuditAt = payload.lastAuditAt ? new Date(payload.lastAuditAt) : null
    if (payload.lastAuditAt) {
      updateData.nextRksvAuditDue = addMonths(new Date(payload.lastAuditAt), 12)
    }
  }

  if (payload.nextAuditDue !== undefined) {
    updateData.nextRksvAuditDue = payload.nextAuditDue ? new Date(payload.nextAuditDue) : null
  }

  if (payload.notes !== undefined) {
    updateData.rksvNotes = normalizeNullableString(payload.notes)
  }

  return updateData
}

export async function GET(request: NextRequest, _context: RouteParams) {
  return handleAuthErrors(async () => {
    const { therapist } = await requireTherapist()
    const snapshot = await getRksvSnapshot(therapist.id)

    return NextResponse.json({
      success: true,
      data: snapshot,
    })
  })
}

export async function PUT(request: NextRequest, _context: RouteParams) {
  try {
    const { therapist } = await ensureTherapistAccount(request)
    const payload = (await request.json()) as unknown
    const parsed = updateSchema.parse(payload)

    const currentSettings = await prisma.taxComplianceSettings.upsert({
      where: { therapistId: therapist.id },
      update: {},
      create: {
        therapistId: therapist.id,
        kleinunternehmerActive: true,
        kleinunternehmerThresholdCents: 5_500_000,
        rksvEnabled: false,
      },
    })

    const updateData = buildUpdateData(parsed, currentSettings)

    await prisma.$transaction(async (tx) => {
      await tx.taxComplianceSettings.update({
        where: { therapistId: therapist.id },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
      })

      await tx.therapist.update({
        where: { id: therapist.id },
        data: {
          settingsLastUpdated: new Date(),
          settingsVersion: { increment: 1 },
        },
      })
    })

    const snapshot = await getRksvSnapshot(therapist.id)

    return NextResponse.json({
      success: true,
      data: snapshot,
      message: 'RKSV settings updated successfully',
    })
  } catch (error) {
    if (error instanceof Response) {
      throw error
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.flatten() },
        { status: 400 },
      )
    }

    console.error('RKSV settings update failed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update RKSV settings' },
      { status: 500 },
    )
  }
}
