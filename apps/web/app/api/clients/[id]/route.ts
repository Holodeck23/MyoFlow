import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma, Role } from '@myoflow/db'
import { z } from 'zod'
import { encryptString, decryptString, logAudit, requireRole } from '@myoflow/lib'

const UpdateClientSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  tags: z.array(z.string()).optional(),
  healthFlags: z.string().optional(),
})

async function getTherapistId(session: any): Promise<string> {
  if (!session?.user?.email) {
    throw new Error('Unauthorized')
  }

  // Find or create user using email as unique identifier
  const user = await prisma.user.upsert({
    where: { email: session.user.email },
    update: {
      name: session.user.name || session.user.email || 'Unknown User',
    },
    create: {
      email: session.user.email,
      name: session.user.name || session.user.email || 'Unknown User',
    },
  })

  let therapist = await prisma.therapist.findFirst({
    where: { userId: user.id }
  })

  if (!therapist) {

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
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
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

    const { healthFlagsEnc, Notes, ...clientRest } = client
    const safeClient = {
      ...clientRest,
      healthFlags: healthFlagsEnc
        ? await decryptString(healthFlagsEnc)
        : null,
      Notes: await Promise.all(
        Notes.map(async ({ bodyEnc, ...rest }) => ({
          ...rest,
          body: bodyEnc ? await decryptString(bodyEnc) : null
        }))
      )
    }

    await logAudit({
      actorUserId: session.user.id,
      therapistId,
      entity: 'client',
      entityId: params.id,
      action: 'read',
      ip: request.ip ?? undefined
    })

    return NextResponse.json(safeClient)
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
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const therapistId = await getTherapistId(session)

    const body = await request.json()
    const validatedData = UpdateClientSchema.parse(body)
    const { healthFlags, ...rest } = validatedData

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
        ...rest,
        email: rest.email || null,
        healthFlagsEnc:
          typeof healthFlags === 'string'
            ? await encryptString(healthFlags)
            : client.healthFlagsEnc
      }
    })

    await logAudit({
      actorUserId: session.user.id,
      therapistId,
      entity: 'client',
      entityId: params.id,
      action: 'update',
      ip: request.ip ?? undefined
    })

    const { healthFlagsEnc: updatedHealth, ...updatedRest } = updatedClient
    return NextResponse.json({
      ...updatedRest,
      healthFlags:
        healthFlags ??
        (updatedHealth ? await decryptString(updatedHealth) : null)
    })
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
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
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

    await logAudit({
      actorUserId: session.user.id,
      therapistId,
      entity: 'client',
      entityId: params.id,
      action: 'delete',
      ip: request.ip ?? undefined
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
