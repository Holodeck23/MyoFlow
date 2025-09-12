import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@myoflow/db'
import { z } from 'zod'
import { encrypt, decrypt } from '@myoflow/lib/security/crypto'

const UpdateClientSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  tags: z.array(z.string()).optional(),
  healthFlags: z.string().optional()
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const therapistId = await getTherapistId(session)
    const role = session?.user?.role

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
    if (role !== 'ACCOUNTANT') {
      if (client.healthFlagsEnc) {
        ;(client as any).healthFlags = await decrypt(client.healthFlagsEnc)
        delete (client as any).healthFlagsEnc
      }
      // Decrypt notes for therapists, transforming bodyEnc to body
      const decryptedNotes = await Promise.all(
        client.Notes.map(async note => {
          const { bodyEnc, ...rest } = note
          return { ...rest, body: await decrypt(bodyEnc) }
        })
      )
      ;(client as any).Notes = decryptedNotes
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
    const role = session?.user?.role

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
        ...(healthFlags !== undefined
          ? { healthFlagsEnc: healthFlags ? await encrypt(healthFlags) : null }
          : {})
      }
    })

    let healthFlagsPlain: string | null = null
    if (role !== 'ACCOUNTANT') {
      if (healthFlags !== undefined) {
        healthFlagsPlain = healthFlags || null
      } else if (updatedClient.healthFlagsEnc) {
        healthFlagsPlain = await decrypt(updatedClient.healthFlagsEnc)
      }
    }

    if (role === 'ACCOUNTANT') {
      return NextResponse.json(updatedClient)
    }

    const { healthFlagsEnc, ...restClient } = updatedClient
    return NextResponse.json({ ...restClient, healthFlags: healthFlagsPlain })
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