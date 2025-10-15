import { NextRequest, NextResponse } from 'next/server'
import { prisma, Currency, Locale } from '@myoflow/db'
import { z } from 'zod'
import {
  ensureTherapistAccount,
  handleAuthErrors,
  requireTherapist,
} from '@/lib/shared-helpers'

export const dynamic = 'force-dynamic'

const DEFAULT_PREFERENCES = {
  language: 'DE' as Locale,
  timezone: 'Europe/Vienna',
  currency: 'EUR' as Currency,
  dateFormat: 'DD.MM.YYYY',
  appointmentReminderDays: 1,
  enableEmailNotifications: true,
  enableSmsNotifications: false,
  enableComplianceAlerts: true,
  enableTravelAlerts: true,
}

const updateSchema = z
  .object({
    language: z.nativeEnum(Locale).optional(),
    timezone: z.string().trim().max(50).optional(),
    currency: z.nativeEnum(Currency).optional(),
    dateFormat: z.enum(['DD.MM.YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']).optional(),
    appointmentReminderDays: z.number().int().min(0).max(30).optional(),
    enableEmailNotifications: z.boolean().optional(),
    enableSmsNotifications: z.boolean().optional(),
    enableComplianceAlerts: z.boolean().optional(),
    enableTravelAlerts: z.boolean().optional(),
  })
  .strict()

type UpdatePayload = z.infer<typeof updateSchema>

function serializePreferences(preferences: any, therapistId: string) {
  if (!preferences) {
    return {
      id: null,
      therapistId,
      ...DEFAULT_PREFERENCES,
      updatedAt: null,
      createdAt: null,
      isDefault: true,
    }
  }

  return {
    id: preferences.id,
    therapistId,
    language: preferences.language ?? DEFAULT_PREFERENCES.language,
    timezone: preferences.timezone ?? DEFAULT_PREFERENCES.timezone,
    currency: preferences.currency ?? DEFAULT_PREFERENCES.currency,
    dateFormat: preferences.dateFormat ?? DEFAULT_PREFERENCES.dateFormat,
    appointmentReminderDays:
      preferences.appointmentReminderDays ?? DEFAULT_PREFERENCES.appointmentReminderDays,
    enableEmailNotifications:
      preferences.enableEmailNotifications ?? DEFAULT_PREFERENCES.enableEmailNotifications,
    enableSmsNotifications:
      preferences.enableSmsNotifications ?? DEFAULT_PREFERENCES.enableSmsNotifications,
    enableComplianceAlerts:
      preferences.enableComplianceAlerts ?? DEFAULT_PREFERENCES.enableComplianceAlerts,
    enableTravelAlerts:
      preferences.enableTravelAlerts ?? DEFAULT_PREFERENCES.enableTravelAlerts,
    updatedAt: preferences.updatedAt ? preferences.updatedAt.toISOString() : null,
    createdAt: preferences.createdAt ? preferences.createdAt.toISOString() : null,
    isDefault: false,
  }
}

function buildUpdateData(payload: UpdatePayload) {
  const updateData: Record<string, unknown> = {}

  if (payload.language !== undefined) updateData.language = payload.language
  if (payload.timezone !== undefined) updateData.timezone = payload.timezone.trim()
  if (payload.currency !== undefined) updateData.currency = payload.currency
  if (payload.dateFormat !== undefined) updateData.dateFormat = payload.dateFormat
  if (payload.appointmentReminderDays !== undefined) {
    updateData.appointmentReminderDays = payload.appointmentReminderDays
  }
  if (payload.enableEmailNotifications !== undefined) {
    updateData.enableEmailNotifications = payload.enableEmailNotifications
  }
  if (payload.enableSmsNotifications !== undefined) {
    updateData.enableSmsNotifications = payload.enableSmsNotifications
  }
  if (payload.enableComplianceAlerts !== undefined) {
    updateData.enableComplianceAlerts = payload.enableComplianceAlerts
  }
  if (payload.enableTravelAlerts !== undefined) {
    updateData.enableTravelAlerts = payload.enableTravelAlerts
  }

  return updateData
}

export async function GET(request: NextRequest) {
  return handleAuthErrors(async () => {
    const { therapist } = await requireTherapist()
    const preferences = await prisma.userPreferences.findUnique({
      where: { therapistId: therapist.id },
    })

    return NextResponse.json({
      success: true,
      data: serializePreferences(preferences, therapist.id),
    })
  })
}

export async function PUT(request: NextRequest) {
  try {
    const { therapist } = await ensureTherapistAccount(request)
    const payload = (await request.json()) as unknown
    const parsed = updateSchema.parse(payload)

    await prisma.userPreferences.upsert({
      where: { therapistId: therapist.id },
      update: {},
      create: {
        therapistId: therapist.id,
        ...DEFAULT_PREFERENCES,
      },
    })

    const updateData = buildUpdateData(parsed)

    const updatedPreferences = await prisma.$transaction(async (tx) => {
      const prefs = await tx.userPreferences.update({
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

      return prefs
    })

    return NextResponse.json({
      success: true,
      data: serializePreferences(updatedPreferences, therapist.id),
      message: 'System preferences updated successfully',
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

    console.error('System settings update failed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update system settings' },
      { status: 500 },
    )
  }
}
