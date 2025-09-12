import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@myoflow/db'
import { z } from 'zod'
import { encrypt, decrypt } from '@myoflow/lib/security/crypto'

const CreateNoteSchema = z.object({
  body: z.string().min(1, 'Note content is required'),
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
    const role = session?.user?.role

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

    const notes = await prisma.note.findMany({
      where: {
        clientId: params.id,
        therapistId
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const result =
      role === 'ACCOUNTANT'
        ? notes
        : await Promise.all(
            notes.map(async n => {
              const { bodyEnc, ...rest } = n
              return { ...rest, body: await decrypt(bodyEnc) }
            })
          )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching notes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    )
  }
}

export async function POST(
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
      }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = CreateNoteSchema.parse(body)

    const note = await prisma.note.create({
      data: {
        bodyEnc: await encrypt(validatedData.body),
        clientId: params.id,
        therapistId
      }
    })

    if (role === 'ACCOUNTANT') {
      return NextResponse.json(note, { status: 201 })
    }

    const { bodyEnc, ...rest } = note
    return NextResponse.json({ ...rest, body: validatedData.body }, { status: 201 })
  } catch (error) {
    console.error('Error creating note:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    )
  }
}