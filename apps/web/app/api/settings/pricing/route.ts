import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@myoflow/db'
import { z } from 'zod'
import { requireTherapist, ensureTherapistAccount } from '@/lib/shared-helpers'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'

const serviceRateSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.enum(['MASSAGE', 'YOGA', 'CONSULTING', 'OTHER']),
  durationMin: z.number().int().min(15).max(480),
  priceCents: z.number().int().min(500).max(50000),
  vatRate: z.enum(['KLEINUNTERNEHMER', 'UST_10', 'UST_13', 'UST_20']),
  description: z.string().max(500).nullable().optional(),
  isDefault: z.boolean().optional(),
  travelRateCents: z.number().int().min(0).max(10000).optional(),
  travelIncluded: z.boolean().optional(),
})


export async function GET(request: NextRequest) {
  try {
    const { therapist } = await requireTherapist()

    const serviceRates = await prisma.serviceRateTemplate.findMany({
      where: {
        therapistId: therapist.id,
        isActive: true
      },
      orderBy: [
        { category: 'asc' },
        { isDefault: 'desc' },
        { name: 'asc' }
      ]
    })

    // GET handler should not create missing data - return default structure instead
    if (serviceRates.length === 0) {
      return NextResponse.json([
        {
          id: null,
          therapistId: therapist.id,
          name: 'Klassische Massage 60min',
          category: 'MASSAGE',
          durationMin: 60,
          priceCents: 8000, // €80.00
          vatRate: 'KLEINUNTERNEHMER',
          description: 'Standard full-body massage treatment',
          isDefault: true,
          travelRateCents: 80, // €0.80/km
          travelIncluded: false,
          isActive: true,
          // Indicate this is default data, not persisted
          isDefaultData: true,
        },
        {
          id: null,
          therapistId: therapist.id,
          name: 'Entspannungsmassage 45min',
          category: 'MASSAGE',
          durationMin: 45,
          priceCents: 6500, // €65.00
          vatRate: 'KLEINUNTERNEHMER',
          description: 'Relaxation massage for stress relief',
          isDefault: false,
          travelRateCents: 80,
          travelIncluded: false,
          isActive: true,
          isDefaultData: true,
        },
        {
          id: null,
          therapistId: therapist.id,
          name: 'Triggerpunkt-Therapie 45min',
          category: 'MASSAGE',
          durationMin: 45,
          priceCents: 7500, // €75.00
          vatRate: 'KLEINUNTERNEHMER',
          description: 'Targeted trigger point therapy',
          isDefault: false,
          travelRateCents: 80,
          travelIncluded: false,
          isActive: true,
          isDefaultData: true,
        }
      ])
    }

    return NextResponse.json(serviceRates.map(rate => ({ ...rate, isDefaultData: false })))
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
    const { therapist } = await ensureTherapistAccount(request)
    const payload = await request.json()
    const parsed = serviceRateSchema.parse(payload)

    // If setting as default, unset other defaults in the same category
    if (parsed.isDefault) {
      await prisma.serviceRateTemplate.updateMany({
        where: {
          therapistId: therapist.id,
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
        therapistId: therapist.id,
        ...parsed,
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