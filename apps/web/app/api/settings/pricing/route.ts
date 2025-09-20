import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@myoflow/db'
import { z } from 'zod'

const serviceRateSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.enum(['MASSAGE', 'YOGA', 'CONSULTING', 'OTHER']),
  durationMin: z.number().int().min(15).max(480),
  priceCents: z.number().int().min(500).max(50000),
  vatRate: z.enum(['KLEINUNTERNEHMER', 'UST_10', 'UST_13', 'UST_20']),
  description: z.string().max(500).optional(),
  isDefault: z.boolean().optional(),
  travelRateCents: z.number().int().min(0).max(10000).optional(),
  travelIncluded: z.boolean().optional(),
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

    const serviceRates = await prisma.serviceRateTemplate.findMany({
      where: {
        therapistId,
        isActive: true
      },
      orderBy: [
        { category: 'asc' },
        { isDefault: 'desc' },
        { name: 'asc' }
      ]
    })

    // If no service rates exist, create some defaults
    if (serviceRates.length === 0) {
      const defaultRates = [
        {
          therapistId,
          name: 'Klassische Massage 60min',
          category: 'MASSAGE' as const,
          durationMin: 60,
          priceCents: 8000, // €80.00
          vatRate: 'KLEINUNTERNEHMER' as const,
          description: 'Standard full-body massage treatment',
          isDefault: true,
          travelRateCents: 80, // €0.80/km
          travelIncluded: false,
        },
        {
          therapistId,
          name: 'Entspannungsmassage 45min',
          category: 'MASSAGE' as const,
          durationMin: 45,
          priceCents: 6500, // €65.00
          vatRate: 'KLEINUNTERNEHMER' as const,
          description: 'Relaxation massage for stress relief',
          isDefault: false,
          travelRateCents: 80,
          travelIncluded: false,
        },
        {
          therapistId,
          name: 'Triggerpunkt-Therapie 45min',
          category: 'MASSAGE' as const,
          durationMin: 45,
          priceCents: 7500, // €75.00
          vatRate: 'KLEINUNTERNEHMER' as const,
          description: 'Targeted trigger point therapy',
          isDefault: false,
          travelRateCents: 80,
          travelIncluded: false,
        }
      ]

      const created = await Promise.all(
        defaultRates.map(rate =>
          prisma.serviceRateTemplate.create({ data: rate })
        )
      )

      return NextResponse.json(created)
    }

    return NextResponse.json(serviceRates)
  } catch (error) {
    if (error instanceof Response) {
      throw error
    }

    console.error('Service rates fetch failed:', error)
    return NextResponse.json({ error: 'Failed to fetch service rates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const therapistId = await authenticate(request)
    const payload = await request.json()
    const parsed = serviceRateSchema.parse(payload)

    // If setting as default, unset other defaults in the same category
    if (parsed.isDefault) {
      await prisma.serviceRateTemplate.updateMany({
        where: {
          therapistId,
          category: parsed.category,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      })
    }

    const serviceRate = await prisma.serviceRateTemplate.create({
      data: {
        therapistId,
        ...parsed,
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

    return NextResponse.json({ success: true, serviceRate })
  } catch (error) {
    if (error instanceof Response) {
      throw error
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.error('Service rate creation failed:', error)
    return NextResponse.json({ error: 'Failed to create service rate' }, { status: 500 })
  }
}