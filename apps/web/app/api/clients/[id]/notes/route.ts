import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@myoflow/db'
import { z } from 'zod'
import { encryptString, decryptString } from '@myoflow/lib/security'
import { logAudit } from '@myoflow/db'
import { requireTherapist, ensureTherapistAccount } from '@/lib/shared-helpers'

const CreateNoteSchema = z.object({
  body: z.string().min(1, 'Note content is required'),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { therapist } = await requireTherapist()
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

    const notes = await prisma.note.findMany({
      where: {
        clientId: params.id,
        therapistId
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const safeNotes = await Promise.all(
      notes.map(async ({ bodyEnc, ...rest }) => ({
        ...rest,
        body: bodyEnc ? await decryptString(bodyEnc) : null
      }))
    )

    await logAudit({
      actorUserId: session.user.id,
      therapistId,
      entity: 'note',
      entityId: params.id,
      action: 'list',
      ip: request.ip ?? undefined
    })

    return NextResponse.json(safeNotes)
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

    const body = await request.json()
    const { body: plain } = CreateNoteSchema.parse(body)

    const note = await prisma.note.create({
      data: {
        bodyEnc: await encryptString(plain),
        clientId: params.id,
        therapistId
      }
    })

    await logAudit({
      actorUserId: session.user.id,
      therapistId,
      entity: 'note',
      entityId: note.id,
      action: 'create',
      ip: request.ip ?? undefined
    })

    return NextResponse.json(
      { ...note, body: plain },
      { status: 201 }
    )
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
