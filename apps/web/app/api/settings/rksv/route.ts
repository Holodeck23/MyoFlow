import { NextRequest, NextResponse } from 'next/server'
import { differenceInDays, addMonths, isAfter } from 'date-fns'
import { prisma } from '@myoflow/db'
import { z } from 'zod'
import { requireTherapist, ensureTherapistAccount } from '@/lib/shared-helpers'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'

const RKSV_THRESHOLD_CENTS = 1_500_000 // €15,000 annual revenue threshold

const updateSchema = z.object({
  enabled: z.boolean().optional(),
  cashRegisterId: z.string().max(100).optional().nullable(),
  signatureDeviceId: z.string().max(100).optional().nullable(),
  lastAuditAt: z.string().datetime().optional().nullable(),
  nextAuditDue: z.string().datetime().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
})

function calculateRksvComplianceDetails(revenue: number, taxSettings: any) {
  const rksvRequired = revenue >= RKSV_THRESHOLD_CENTS
  const rksvImplemented = taxSettings?.rksvEnabled || false

  // Calculate months until RKSV implementation deadline (4 months after crossing threshold)
  const monthsUntilDeadline = rksvRequired && !rksvImplemented ? 4 : null

  // Check audit status
  const lastAudit = taxSettings?.lastRksvAuditAt ? new Date(taxSettings.lastRksvAuditAt) : null
  const nextAuditDue = taxSettings?.nextRksvAuditDue ? new Date(taxSettings.nextRksvAuditDue) : null
  const isAuditOverdue = nextAuditDue ? isAfter(new Date(), nextAuditDue) : false
  const daysUntilAudit = nextAuditDue ? differenceInDays(nextAuditDue, new Date()) : null

  let status: 'not_required' | 'implementation_required' | 'compliant' | 'audit_overdue' = 'not_required'

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
    currentRevenue: revenue / 100,
    thresholdPercentage: (revenue / RKSV_THRESHOLD_CENTS) * 100,
    monthsUntilDeadline,
    lastAuditAt: lastAudit?.toISOString() || null,
    nextAuditDue: nextAuditDue?.toISOString() || null,
    daysUntilAudit,
    isAuditOverdue,
    cashRegisterId: taxSettings?.cashRegisterId || null,
    signatureDeviceId: taxSettings?.signatureDeviceId || null,
    notes: taxSettings?.rksvNotes || null,
  }
}

export async function GET(request: NextRequest) {
  try {
    const { therapist } = await requireTherapist()

    // Get tax compliance settings
    const taxSettings = await prisma.taxComplianceSettings.findUnique({
      where: { therapistId: therapist.id },
    })

    // Calculate current year revenue
    const currentYearRevenue = await prisma.invoice.aggregate({
      _sum: { totalGrossCents: true },
      where: {
        therapistId: therapist.id,
        status: { in: ['SENT', 'PAID'] },
        createdAt: {
          gte: new Date(new Date().getFullYear(), 0, 1), // Start of current year
        },
      },
    })

    const revenueCents = currentYearRevenue._sum.totalGrossCents ?? 0
    const complianceDetails = calculateRksvComplianceDetails(revenueCents, taxSettings)

    return NextResponse.json({
      ...complianceDetails,
      requirements: {
        annualRevenueThreshold: '€15,000',
        implementationDeadline: '4 months after crossing threshold',
        auditFrequency: 'Annual signature device audit required',
        penalties: 'Up to €5,000 for non-compliance',
        documentation: 'Receipt signatures, audit trail required',
      },
    })
  } catch (error) {
    if (error instanceof Response) {
      throw error
    }

    console.error('RKSV compliance fetch failed:', error)
    return NextResponse.json({ error: 'Failed to fetch RKSV compliance status' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { therapist } = await ensureTherapistAccount(request)
    const payload = await request.json()
    const parsed = updateSchema.parse(payload)

    // Ensure tax compliance settings exist
    const current = await prisma.taxComplianceSettings.upsert({
      where: { therapistId: therapist.id },
      update: {},
      create: {
        therapistId: therapist.id,
        kleinunternehmerActive: true,
        kleinunternehmerThresholdCents: 5_500_000,
        rksvEnabled: false,
      },
    })

    const updateData: any = {}

    if (parsed.enabled !== undefined) {
      updateData.rksvEnabled = parsed.enabled

      // If enabling RKSV for the first time, set up next audit date (1 year from now)
      if (parsed.enabled && !current.rksvEnabled) {
        updateData.nextRksvAuditDue = addMonths(new Date(), 12)
      }
    }

    if (parsed.cashRegisterId !== undefined) {
      updateData.cashRegisterId = parsed.cashRegisterId
    }

    if (parsed.signatureDeviceId !== undefined) {
      updateData.signatureDeviceId = parsed.signatureDeviceId
    }

    if (parsed.lastAuditAt !== undefined) {
      updateData.lastRksvAuditAt = parsed.lastAuditAt ? new Date(parsed.lastAuditAt) : null

      // If updating last audit, set next audit due date
      if (parsed.lastAuditAt) {
        updateData.nextRksvAuditDue = addMonths(new Date(parsed.lastAuditAt), 12)
      }
    }

    if (parsed.nextAuditDue !== undefined) {
      updateData.nextRksvAuditDue = parsed.nextAuditDue ? new Date(parsed.nextAuditDue) : null
    }

    if (parsed.notes !== undefined) {
      updateData.rksvNotes = parsed.notes
    }

    const updated = await prisma.taxComplianceSettings.update({
      where: { therapistId: therapist.id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    })

    // Update therapist settings timestamp
    await prisma.therapist.update({
      where: { id: therapist.id },
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

    console.error('RKSV settings update failed:', error)
    return NextResponse.json({ error: 'Failed to update RKSV settings' }, { status: 500 })
  }
}