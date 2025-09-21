import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@myoflow/db'
import { z } from 'zod'
import { requireTherapist, ensureTherapistAccount } from '@/lib/shared-helpers'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'

const updateSchema = z.object({
  baseAddressLine1: z.string().min(1).max(200).optional(),
  baseAddressLine2: z.string().max(200).optional().nullable(),
  baseCity: z.string().min(1).max(100).optional(),
  basePostalCode: z.string().min(1).max(20).optional(),
  baseCountry: z.string().min(1).max(100).optional(),
  transportMethod: z.enum(['CAR', 'BICYCLE', 'PUBLIC_TRANSPORT', 'WALKING', 'MOTORCYCLE']).optional(),
  ratePerKmCents: z.number().int().min(0).max(10000).optional(),
  minimumTravelChargeCents: z.number().int().min(0).max(100000).optional(),
  maximumTravelDistanceKm: z.number().int().min(1).max(1000).optional(),
  travelBufferMinutes: z.number().int().min(0).max(120).optional(),
})


export async function GET(request: NextRequest) {
  try {
    const { therapist } = await requireTherapist(request)

    const settings = await prisma.travelSettings.findUnique({
      where: { therapistId: therapist.id },
    })

    // GET handler should not create missing data - return default structure instead
    if (!settings) {
      return NextResponse.json({
        id: null,
        therapistId: therapist.id,
        baseAddressLine1: 'Hauptplatz 1',
        baseCity: 'Linz',
        basePostalCode: '4020',
        baseCountry: 'Austria',
        transportMethod: 'CAR',
        ratePerKmCents: 80, // €0.80 per km (Austrian standard)
        minimumTravelChargeCents: 700, // €7.00 minimum
        maximumTravelDistanceKm: 50,
        travelBufferMinutes: 15,
        // Indicate this is default data, not persisted
        isDefault: true,
      })
    }

    return NextResponse.json({ ...settings, isDefault: false })
  } catch (error) {
    if (error instanceof Response) {
      throw error
    }

    console.error('Travel settings fetch failed:', error)
    return NextResponse.json({ error: 'Failed to fetch travel settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { therapist } = await ensureTherapistAccount(request)
    const payload = await request.json()
    const parsed = updateSchema.parse(payload)

    // Ensure travel settings exist
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

    const updated = await prisma.travelSettings.update({
      where: { therapistId: therapist.id },
      data: {
        ...parsed,
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

    console.error('Travel settings update failed:', error)
    return NextResponse.json({ error: 'Failed to update travel settings' }, { status: 500 })
  }
}