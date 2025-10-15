import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@myoflow/db'
import { z } from 'zod'
import {
  ensureTherapistAccount,
  handleAuthErrors,
  requireTherapist,
} from '@/lib/shared-helpers'
import { assertValidVatNumber, normalizeVatNumber } from '@myoflow/lib'

export const dynamic = 'force-dynamic'

const DEFAULT_KLEINUNTERNEHMER_THRESHOLD = 5_500_000

const updateSchema = z
  .object({
    vatRegistered: z.boolean().optional(),
    vatNumber: z
      .string()
      .trim()
      .max(32, 'VAT number must be 32 characters or fewer')
      .nullable()
      .optional(),
    kleinunternehmerActive: z.boolean().optional(),
    kleinunternehmerThresholdCents: z
      .number()
      .int()
      .min(1_000_000, 'Kleinunternehmer threshold must be at least €10,000')
      .max(20_000_000, 'Kleinunternehmer threshold cannot exceed €200,000')
      .optional(),
    taxAdvisor: z
      .object({
        name: z
          .string()
          .trim()
          .min(2, 'Advisor name must be at least 2 characters')
          .max(100, 'Advisor name must be 100 characters or fewer')
          .nullable()
          .optional(),
        email: z
          .string()
          .trim()
          .email('Advisor email must be a valid address')
          .max(200, 'Advisor email must be 200 characters or fewer')
          .nullable()
          .optional(),
        phone: z
          .string()
          .trim()
          .max(50, 'Advisor phone must be 50 characters or fewer')
          .nullable()
          .optional(),
      })
      .optional(),
    rksv: z
      .object({
        enabled: z.boolean().optional(),
        cashRegisterId: z
          .string()
          .trim()
          .max(100, 'Cash register ID must be 100 characters or fewer')
          .nullable()
          .optional(),
        signatureDeviceId: z
          .string()
          .trim()
          .max(100, 'Signature device ID must be 100 characters or fewer')
          .nullable()
          .optional(),
        lastAuditAt: z.string().datetime().nullable().optional(),
        nextAuditDue: z.string().datetime().nullable().optional(),
        notes: z
          .string()
          .trim()
          .max(1000, 'RKSV notes must be 1000 characters or fewer')
          .nullable()
          .optional(),
      })
      .optional(),
    taxValidationCompleted: z.boolean().optional(),
    taxValidatedAt: z.string().datetime().nullable().optional(),
  })
  .strict()

type UpdatePayload = z.infer<typeof updateSchema>

function normalizeNullableString(value: string | null | undefined) {
  if (value === undefined) return undefined
  if (value === null) return null
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

function serializeCompliance(settings: any, therapist: any) {
  return {
    id: settings?.id ?? null,
    therapistId: settings?.therapistId ?? therapist?.id ?? null,
    vatRegistered: Boolean(settings?.vatRegistered),
    vatNumber: settings?.vatNumber ?? null,
    kleinunternehmerActive:
      settings?.kleinunternehmerActive !== undefined ? settings.kleinunternehmerActive : true,
    kleinunternehmerThresholdCents:
      settings?.kleinunternehmerThresholdCents ?? DEFAULT_KLEINUNTERNEHMER_THRESHOLD,
    currentYearRevenueCents: settings?.currentYearRevenueCents ?? 0,
    taxAdvisor: {
      name: settings?.taxAdvisorName ?? null,
      email: settings?.taxAdvisorEmail ?? null,
      phone: settings?.taxAdvisorPhone ?? null,
    },
    rksv: {
      enabled: Boolean(settings?.rksvEnabled),
      cashRegisterId: settings?.cashRegisterId ?? null,
      signatureDeviceId: settings?.signatureDeviceId ?? null,
      lastAuditAt: settings?.lastRksvAuditAt ? settings.lastRksvAuditAt.toISOString() : null,
      nextAuditDue: settings?.nextRksvAuditDue ? settings.nextRksvAuditDue.toISOString() : null,
      notes: settings?.rksvNotes ?? null,
    },
    taxValidationCompleted: Boolean(therapist?.taxValidationCompleted),
    taxValidatedAt: therapist?.taxValidatedAt ? therapist.taxValidatedAt.toISOString() : null,
    updatedAt: settings?.updatedAt ? settings.updatedAt.toISOString() : null,
    createdAt: settings?.createdAt ? settings.createdAt.toISOString() : null,
    isDefault: !settings,
  }
}

function buildUpdateData(payload: UpdatePayload, current: any) {
  const updateData: Record<string, unknown> = {}

  if (payload.vatRegistered !== undefined) {
    updateData.vatRegistered = payload.vatRegistered
    if (!payload.vatRegistered) {
      updateData.vatNumber = null
    } else {
      updateData.kleinunternehmerActive = false
    }
  }

  if (payload.vatNumber !== undefined) {
    updateData.vatNumber = normalizeNullableString(
      payload.vatNumber ? normalizeVatNumber(payload.vatNumber) : null,
    )
  }

  if (payload.kleinunternehmerActive !== undefined) {
    updateData.kleinunternehmerActive = payload.kleinunternehmerActive
    if (payload.kleinunternehmerActive) {
      updateData.vatRegistered = false
      updateData.vatNumber = null
    }
  }

  if (payload.kleinunternehmerThresholdCents !== undefined) {
    updateData.kleinunternehmerThresholdCents = payload.kleinunternehmerThresholdCents
  }

  if (payload.taxAdvisor !== undefined) {
    updateData.taxAdvisorName = normalizeNullableString(payload.taxAdvisor?.name ?? null)
    updateData.taxAdvisorEmail = normalizeNullableString(payload.taxAdvisor?.email ?? null)
    updateData.taxAdvisorPhone = normalizeNullableString(payload.taxAdvisor?.phone ?? null)
  }

  if (payload.rksv !== undefined) {
    updateData.rksvEnabled = payload.rksv?.enabled ?? current?.rksvEnabled ?? false
    updateData.cashRegisterId = normalizeNullableString(payload.rksv?.cashRegisterId ?? null)
    updateData.signatureDeviceId = normalizeNullableString(payload.rksv?.signatureDeviceId ?? null)
    updateData.lastRksvAuditAt = payload.rksv?.lastAuditAt
      ? new Date(payload.rksv.lastAuditAt)
      : null
    updateData.nextRksvAuditDue = payload.rksv?.nextAuditDue
      ? new Date(payload.rksv.nextAuditDue)
      : null
    updateData.rksvNotes = normalizeNullableString(payload.rksv?.notes ?? null)
  }

  return updateData
}

export async function GET(request: NextRequest) {
  return handleAuthErrors(async () => {
    const { therapist } = await requireTherapist()

    const [settings, therapistRecord] = await Promise.all([
      prisma.taxComplianceSettings.findUnique({
        where: { therapistId: therapist.id },
      }),
      prisma.therapist.findUnique({
        where: { id: therapist.id },
        select: {
          id: true,
          taxValidationCompleted: true,
          taxValidatedAt: true,
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: serializeCompliance(settings, therapistRecord),
    })
  })
}

export async function PUT(request: NextRequest) {
  try {
    const { therapist } = await ensureTherapistAccount(request)
    const payload = (await request.json()) as unknown
    const parsed = updateSchema.parse(payload)

    if (parsed.vatNumber) {
      try {
        assertValidVatNumber(parsed.vatNumber)
      } catch {
        return NextResponse.json(
          { success: false, error: 'Invalid VAT/UID number (must follow ATU######## format)' },
          { status: 400 },
        )
      }
    }

    const current = await prisma.taxComplianceSettings.upsert({
      where: { therapistId: therapist.id },
      update: {},
      create: {
        therapistId: therapist.id,
        kleinunternehmerActive: true,
        kleinunternehmerThresholdCents: DEFAULT_KLEINUNTERNEHMER_THRESHOLD,
      },
    })

    if (
      parsed.kleinunternehmerActive &&
      (parsed.vatRegistered ?? current.vatRegistered ?? false)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'VAT registration and Kleinunternehmer status are mutually exclusive',
        },
        { status: 400 },
      )
    }

    const updateData = buildUpdateData(parsed, current)
    const therapistUpdateData: Record<string, unknown> = {
      settingsLastUpdated: new Date(),
      settingsVersion: { increment: 1 },
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

    const updated = await prisma.$transaction(async (tx) => {
      const compliance = await tx.taxComplianceSettings.update({
        where: { therapistId: therapist.id },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
      })

      await tx.therapist.update({
        where: { id: therapist.id },
        data: therapistUpdateData,
      })

      return compliance
    })

    const therapistRecord = await prisma.therapist.findUnique({
      where: { id: therapist.id },
      select: {
        id: true,
        taxValidationCompleted: true,
        taxValidatedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: serializeCompliance(updated, therapistRecord),
      message: 'Tax compliance settings saved successfully',
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

    console.error('Tax compliance update failed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update tax compliance settings' },
      { status: 500 },
    )
  }
}
