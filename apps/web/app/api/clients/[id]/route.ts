import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@myoflow/db'
import { z } from 'zod'

const UpdateClientSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const therapistId = await getTherapistId(session)

    const client = await prisma.client.findFirst({
      where: {
        id: params.id,
        therapistId
      },
      include: {
        Notes: {
          orderBy: { createdAt: 'desc' }
        },
        Appointments: {
          orderBy: { start: 'desc' },
          take: 10,
          include: {
            Service: true,
            Location: true
          }
        }
      }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('Error fetching client:', error)
    return NextResponse.json(
      { error: 'Failed to fetch client' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const therapistId = await getTherapistId(session)

    const body = await request.json()
    const validatedData = UpdateClientSchema.parse(body)

    const client = await prisma.client.findFirst({
      where: {
        id: params.id,
        therapistId
      }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    const updatedClient = await prisma.client.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        email: validatedData.email || null
      }
    })

    return NextResponse.json(updatedClient)
  } catch (error) {
    console.error('Error updating client:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const therapistId = await getTherapistId(session)

    const client = await prisma.client.findFirst({
      where: {
        id: params.id,
        therapistId
      }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    await prisma.client.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    )
  }
}