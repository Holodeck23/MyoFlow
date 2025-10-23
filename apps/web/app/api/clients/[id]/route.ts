import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma, Role } from '@myoflow/db'
import { z } from 'zod'
import { encryptString, decryptString, requireRole } from '@myoflow/lib/security'
import { logAudit } from '@myoflow/db'
import { requireTherapist, ensureTherapistAccount } from '@/lib/shared-helpers'

const UpdateClientSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').optional(),
  email: z.string().email().trim().optional().or(z.literal('')),
  phone: z.string().trim().optional(),
  street: z.string().trim().min(1, 'Street is required').optional(),
  postalCode: z.string().trim().min(1, 'Postal code is required').optional(),
  city: z.string().trim().min(1, 'City is required').optional(),
  country: z.string().trim().min(1, 'Country is required').optional(),
  tags: z.array(z.string()).optional(),
  healthFlags: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { therapist, user, session } = await requireTherapist()
    const therapistId = therapist.id

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
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { therapist } = await ensureTherapistAccount(session.user.email, session.user.name || undefined)
    const therapistId = therapist.id

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
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { therapist } = await ensureTherapistAccount(session.user.email, session.user.name || undefined)
    const therapistId = therapist.id

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
