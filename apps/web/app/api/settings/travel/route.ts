import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@myoflow/db'
import { z } from 'zod'

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

    const settings = await prisma.travelSettings.findUnique({
      where: { therapistId },
    })

    if (!settings) {
      // Create default travel settings
      const defaults = await prisma.travelSettings.create({
        data: {
          therapistId,
          baseAddressLine1: 'Hauptplatz 1',
          baseCity: 'Linz',
          basePostalCode: '4020',
          baseCountry: 'Austria',
          transportMethod: 'CAR',
          ratePerKmCents: 80, // €0.80 per km (Austrian standard)
          minimumTravelChargeCents: 700, // €7.00 minimum
          maximumTravelDistanceKm: 50,
          travelBufferMinutes: 15,
        },
      })
      return NextResponse.json(defaults)
    }

    return NextResponse.json(settings)
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
    const therapistId = await authenticate(request)
    const payload = await request.json()
    const parsed = updateSchema.parse(payload)

    // Ensure travel settings exist
    await prisma.travelSettings.upsert({
      where: { therapistId },
      update: {},
      create: {
        therapistId,
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
      where: { therapistId },
      data: {
        ...parsed,
        updatedAt: new Date(),
      },
    })

    // Update therapist settings timestamp
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

    console.error('Travel settings update failed:', error)
    return NextResponse.json({ error: 'Failed to update travel settings' }, { status: 500 })
  }
}