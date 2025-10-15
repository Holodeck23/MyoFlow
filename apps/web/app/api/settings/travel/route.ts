import { NextRequest, NextResponse } from 'next/server'
import { prisma, TransportMethod } from '@myoflow/db'
import { z } from 'zod'
import {
  ensureTherapistAccount,
  handleAuthErrors,
  requireTherapist,
} from '@/lib/shared-helpers'
import { assertValidAustrianPostalCode } from '@myoflow/lib'

export const dynamic = 'force-dynamic'

const updateSchema = z
  .object({
    baseAddressLine1: z.string().trim().min(1).max(200).optional(),
    baseAddressLine2: z.string().trim().max(200).nullable().optional(),
    baseCity: z.string().trim().min(1).max(100).optional(),
    basePostalCode: z.string().trim().max(20).optional(),
    baseCountry: z.string().trim().min(1).max(100).optional(),
    transportMethod: z.nativeEnum(TransportMethod).optional(),
    ratePerKmCents: z.number().int().min(0).max(10_000).optional(),
    minimumTravelChargeCents: z.number().int().min(0).max(100_000).optional(),
    maximumTravelDistanceKm: z.number().int().min(1).max(1_000).optional(),
    travelBufferMinutes: z.number().int().min(0).max(180).optional(),
  })
  .strict()

type UpdatePayload = z.infer<typeof updateSchema>

function normalizeNullableString(value: string | null | undefined) {
  if (value === undefined) return undefined
  if (value === null) return null
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

function serializeTravelSettings(settings: any, therapistId: string) {
  if (!settings) {
    return {
      id: null,
      therapistId,
      baseAddressLine1: 'Hauptplatz 1',
      baseAddressLine2: null,
      baseCity: 'Linz',
      basePostalCode: '4020',
      baseCountry: 'Austria',
      transportMethod: 'CAR',
      ratePerKmCents: 80,
      minimumTravelChargeCents: 700,
      maximumTravelDistanceKm: 50,
      travelBufferMinutes: 15,
      isDefault: true,
    }
  }

  return {
    id: settings.id,
    therapistId: settings.therapistId,
    baseAddressLine1: settings.baseAddressLine1 ?? null,
    baseAddressLine2: settings.baseAddressLine2 ?? null,
    baseCity: settings.baseCity ?? null,
    basePostalCode: settings.basePostalCode ?? null,
    baseCountry: settings.baseCountry ?? 'Austria',
    transportMethod: settings.transportMethod ?? 'CAR',
    ratePerKmCents: settings.ratePerKmCents ?? 80,
    minimumTravelChargeCents: settings.minimumTravelChargeCents ?? 700,
    maximumTravelDistanceKm: settings.maximumTravelDistanceKm ?? 50,
    travelBufferMinutes: settings.travelBufferMinutes ?? 15,
    isDefault: false,
  }
}

function buildUpdateData(payload: UpdatePayload) {
  const data: Record<string, unknown> = {}

  if (payload.baseAddressLine1 !== undefined) {
    data.baseAddressLine1 = payload.baseAddressLine1.trim()
  }

  if (payload.baseAddressLine2 !== undefined) {
    data.baseAddressLine2 = normalizeNullableString(payload.baseAddressLine2)
  }

  if (payload.baseCity !== undefined) {
    data.baseCity = payload.baseCity.trim()
  }

  if (payload.basePostalCode !== undefined) {
    const postal = payload.basePostalCode.trim()
    if (postal.length > 0) {
      assertValidAustrianPostalCode(postal)
      data.basePostalCode = postal
    } else {
      data.basePostalCode = null
    }
  }

  if (payload.baseCountry !== undefined) {
    data.baseCountry = payload.baseCountry.trim()
  }

  if (payload.transportMethod !== undefined) {
    data.transportMethod = payload.transportMethod
  }

  if (payload.ratePerKmCents !== undefined) {
    data.ratePerKmCents = payload.ratePerKmCents
  }

  if (payload.minimumTravelChargeCents !== undefined) {
    data.minimumTravelChargeCents = payload.minimumTravelChargeCents
  }

  if (payload.maximumTravelDistanceKm !== undefined) {
    data.maximumTravelDistanceKm = payload.maximumTravelDistanceKm
  }

  if (payload.travelBufferMinutes !== undefined) {
    data.travelBufferMinutes = payload.travelBufferMinutes
  }

  return data
}

export async function GET(request: NextRequest) {
  return handleAuthErrors(async () => {
    const { therapist } = await requireTherapist()

    const settings = await prisma.travelSettings.findUnique({
      where: { therapistId: therapist.id },
    })

    return NextResponse.json({
      success: true,
      data: serializeTravelSettings(settings, therapist.id),
    })
  })
}

export async function PUT(request: NextRequest) {
  try {
    const { therapist } = await ensureTherapistAccount(request)
    const payload = (await request.json()) as unknown
    const parsed = updateSchema.parse(payload)

    await prisma.travelSettings.upsert({
      where: { therapistId: therapist.id },
      update: {},
      create: {
        therapistId: therapist.id,
        baseAddressLine1: 'Hauptplatz 1',
        baseCity: 'Linz',
        basePostalCode: '4020',
        baseCountry: 'Austria',
        transportMethod: 'CAR',
        ratePerKmCents: 80,
        minimumTravelChargeCents: 700,
        maximumTravelDistanceKm: 50,
        travelBufferMinutes: 15,
      },
    })

    const updateData = buildUpdateData(parsed)

    const updatedSettings = await prisma.$transaction(async (tx) => {
      const record = await tx.travelSettings.update({
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

      return record
    })

    return NextResponse.json({
      success: true,
      data: serializeTravelSettings(updatedSettings, therapist.id),
      message: 'Travel settings updated successfully',
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

    console.error('Travel settings update failed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update travel settings' },
      { status: 500 },
    )
  }
}
