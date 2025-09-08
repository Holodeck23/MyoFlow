import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@myoflow/db'
import { z } from 'zod'

const CreateClientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  street: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

async function getTherapistId(session: any): Promise<string> {
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  let therapist = await prisma.therapist.findFirst({
    where: { userId: session.user.id }
  })

  if (!therapist) {
    // Upsert user to handle potential duplicates
    const user = await prisma.user.upsert({
      where: { id: session.user.id },
      update: {}, // Don't update if exists
      create: {
        id: session.user.id,
        email: session.user.email || 'unknown@example.com',
        name: session.user.name || session.user.email || 'Unknown User'
      }
    })

    // Now create the therapist
    therapist = await prisma.therapist.create({
      data: {
        userId: user.id,
        slug: session.user.email?.split('@')[0] || 'therapist',
        designation: 'HEILMASSEUR',
        vatStatus: 'KLEINUNTERNEHMER'
      }
    })
  }

  return therapist.id
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const therapistId = await getTherapistId(session)

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const tag = searchParams.get('tag') || ''

    const clients = await prisma.client.findMany({
      where: {
        therapistId,
        AND: [
          search ? {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          } : {},
          tag ? {
            tags: {
              has: tag
            }
          } : {}
        ]
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json(clients)
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
    const therapistId = await getTherapistId(session)

    const body = await request.json()
    const validatedData = CreateClientSchema.parse(body)

    const client = await prisma.client.create({
      data: {
        ...validatedData,
        therapistId,
        email: validatedData.email || null,
        tags: validatedData.tags || [],
        street: validatedData.street || null,
        postalCode: validatedData.postalCode || null,
        city: validatedData.city || null,
        country: validatedData.country || null,
      }
    })

    return NextResponse.json(client, { status: 201 })
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