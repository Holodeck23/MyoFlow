import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@myoflow/db'
import { z } from 'zod'
import {
  ensureTherapistAccount,
  handleAuthErrors,
  requireTherapist,
} from '@/lib/shared-helpers'
import {
  CREDENTIAL_SELECT,
  buildCredentialData,
  credentialUpdateSchema,
  serializeCredential,
} from '../shared'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return handleAuthErrors(async () => {
    const { therapist } = await requireTherapist()

    const credential = await prisma.therapistCredential.findFirst({
      where: { id: params.id, therapistId: therapist.id },
      select: CREDENTIAL_SELECT,
    })

    if (!credential) {
      return NextResponse.json(
        { success: false, error: 'Credential not found' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: serializeCredential(credential),
    })
  })
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { therapist } = await ensureTherapistAccount(request)
    const payload = (await request.json()) as unknown
    const parsed = credentialUpdateSchema.parse(payload)

    const credential = await prisma.therapistCredential.findFirst({
      where: { id: params.id, therapistId: therapist.id },
    })

    if (!credential) {
      return NextResponse.json(
        { success: false, error: 'Credential not found' },
        { status: 404 },
      )
    }

    const updateData = buildCredentialData(parsed)
    if (parsed.credentialType !== undefined) {
      updateData.credentialType = parsed.credentialType
    }
    if (parsed.title !== undefined) {
      updateData.title = parsed.title.trim()
    }
    if (parsed.issuingAuthority !== undefined) {
      updateData.issuingAuthority = parsed.issuingAuthority.trim()
    }
    if (parsed.issueDate !== undefined) {
      updateData.issueDate = parsed.issueDate ? new Date(parsed.issueDate) : null
    }
    if (parsed.renewalRequired !== undefined) {
      updateData.renewalRequired = parsed.renewalRequired
    }
    if (parsed.status !== undefined) {
      updateData.status = parsed.status
    }
    if (parsed.verificationStatus !== undefined) {
      updateData.verificationStatus = parsed.verificationStatus
    }

    const updatedCredential = await prisma.$transaction(async (tx) => {
      const updated = await tx.therapistCredential.update({
        where: { id: credential.id },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
        select: CREDENTIAL_SELECT,
      })

      await tx.therapist.update({
        where: { id: therapist.id },
        data: {
          settingsLastUpdated: new Date(),
          settingsVersion: { increment: 1 },
        },
      })

      return updated
    })

    return NextResponse.json({
      success: true,
      data: serializeCredential(updatedCredential),
      message: 'Credential updated successfully',
    })
  } catch (error) {
    if (error instanceof Response) {
      throw error
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.flatten() },
        { status: 400 },
      )
    }

    console.error('Credential update failed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update credential' },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { therapist } = await ensureTherapistAccount(request)

    const credential = await prisma.therapistCredential.findFirst({
      where: { id: params.id, therapistId: therapist.id },
    })

    if (!credential) {
      return NextResponse.json(
        { success: false, error: 'Credential not found' },
        { status: 404 },
      )
    }

    await prisma.$transaction(async (tx) => {
      await tx.therapistCredential.delete({
        where: { id: credential.id },
      })

      await tx.therapist.update({
        where: { id: therapist.id },
        data: {
          settingsLastUpdated: new Date(),
          settingsVersion: { increment: 1 },
        },
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Credential removed successfully',
    })
  } catch (error) {
    if (error instanceof Response) {
      throw error
    }

    console.error('Credential deletion failed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete credential' },
      { status: 500 },
    )
  }
}
