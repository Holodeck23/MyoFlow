import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@myoflow/db'
import { z } from 'zod'
import { requireTherapist, ensureTherapistAccount } from '@/lib/shared-helpers'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'

const updateSchema = z.object({
  businessName: z.string().min(1).max(200).optional(),
  businessAddress: z.string().min(1).max(500).optional(),
  businessEmail: z.string().email().optional(),
  businessPhone: z.string().max(50).optional().nullable(),
  businessWebsite: z.string().max(200).optional().nullable(),
  designation: z.enum(['HEILMASSEUR', 'MEDIZINISCHER_MASSEUR', 'GEWERBLICHER_MASSEUR']).optional(),
  chamberRegistration: z.string().max(100).optional().nullable(),
  certificates: z.array(z.string()).optional(),
  vatStatus: z.enum(['KLEINUNTERNEHMER', 'UST_10', 'UST_13', 'UST_20']).optional(),
})


export async function GET(request: NextRequest) {
  try {
    const { therapist } = await requireTherapist(request)

    const therapistProfile = await prisma.therapist.findUnique({
      where: { id: therapist.id },
      select: {
        businessName: true,
        businessAddress: true,
        businessEmail: true,
        businessPhone: true,
        businessWebsite: true,
        designation: true,
        chamberRegistration: true,
        certificates: true,
        vatStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!therapistProfile) {
      return NextResponse.json({ error: 'Therapist profile not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      profile: therapistProfile,
    })
  } catch (error) {
    if (error instanceof Response) {
      throw error
    }

    console.error('Profile fetch failed:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { therapist } = await ensureTherapistAccount(request)
    const payload = await request.json()
    const parsed = updateSchema.parse(payload)

    const updated = await prisma.therapist.update({
      where: { id: therapist.id },
      data: {
        ...parsed,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      profile: updated,
      message: 'Profile updated successfully'
    })
  } catch (error) {
    if (error instanceof Response) {
      throw error
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 })
    }

    console.error('Profile update failed:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}