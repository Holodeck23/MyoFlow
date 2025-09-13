import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma, Role } from '@myoflow/db'
import { z } from 'zod'
import { encryptString, decryptString, logAudit } from '@myoflow/lib'

const CreateClientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  street: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  tags: z.array(z.string()).optional(),
  healthFlags: z.string().optional(),
})

async function getTherapistId(session: any): Promise<string> {
  if (!session?.user?.email) {
    throw new Error('Not authenticated')
  }

  // Find existing user by email (the reliable identifier)
  let user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })

  if (!user) {
    throw new Error('User not found in database')
  }

  // Find or create therapist profile
  const therapist = await prisma.therapist.upsert({
    where: { userId: user.id },
    update: {}, // Don't overwrite existing data
    create: {
      userId: user.id,
      slug: session.user.email?.split('@')[0] || 'therapist',
      designation: 'HEILMASSEUR',
      vatStatus: 'KLEINUNTERNEHMER'
    }
  })

  return therapist.id
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const therapistId = await getTherapistId(session)

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const tag = searchParams.get('tag') || ''

    const clients = await prisma.client.findMany({
      where: {
        therapistId,
        AND: [
          search
            ? {
                name: {
                  contains: search,
                  mode: 'insensitive'
                }
              }
            : {},
          tag
            ? {
                tags: {
                  has: tag
                }
              }
            : {}
        ]
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    const safeClients = await Promise.all(
      clients.map(async ({ healthFlagsEnc, ...rest }) => ({
        ...rest,
        healthFlags: healthFlagsEnc ? await decryptString(healthFlagsEnc) : null
      }))
    )

    await logAudit({
      actorUserId: session.user.id,
      therapistId,
      entity: 'client',
      entityId: 'list',
      action: 'read',
      ip: request.ip ?? undefined
    })

    return NextResponse.json(safeClients)
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const therapistId = await getTherapistId(session)

    const body = await request.json()
    const validatedData = CreateClientSchema.parse(body)
    const { healthFlags, ...rest } = validatedData

    const client = await prisma.client.create({
      data: {
        ...rest,
        therapistId,
        email: rest.email || null,
        tags: rest.tags || [],
        street: rest.street || null,
        postalCode: rest.postalCode || null,
        city: rest.city || null,
        country: rest.country || null,
        healthFlagsEnc: healthFlags ? await encryptString(healthFlags) : null
      }
    })

    await logAudit({
      actorUserId: session.user.id,
      therapistId,
      entity: 'client',
      entityId: client.id,
      action: 'create',
      ip: request.ip ?? undefined
    })

    const { healthFlagsEnc: createdHealth, ...createdRest } = client
    return NextResponse.json(
      {
        ...createdRest,
        healthFlags: healthFlags || null
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating client:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    )
  }
}
