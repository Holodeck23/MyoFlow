import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@myoflow/db'
import { z } from 'zod'

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

    const therapist = await prisma.therapist.findUnique({
      where: { id: therapistId },
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

    if (!therapist) {
      return NextResponse.json({ error: 'Therapist profile not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      profile: therapist,
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
    const therapistId = await authenticate(request)
    const payload = await request.json()
    const parsed = updateSchema.parse(payload)

    const updated = await prisma.therapist.update({
      where: { id: therapistId },
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