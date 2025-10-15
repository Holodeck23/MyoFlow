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
  credentialCreateSchema,
  serializeCredential,
} from './shared'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return handleAuthErrors(async () => {
    const { therapist } = await requireTherapist()

    const credentials = await prisma.therapistCredential.findMany({
      where: { therapistId: therapist.id },
      orderBy: [
        { status: 'asc' },
        { expirationDate: 'asc' },
        { title: 'asc' },
      ],
      select: CREDENTIAL_SELECT,
    })

    return NextResponse.json({
      success: true,
      data: credentials.map(serializeCredential),
    })
  })
}

export async function POST(request: NextRequest) {
  try {
    const { therapist } = await ensureTherapistAccount(request)
    const payload = (await request.json()) as unknown
    const parsed = credentialCreateSchema.parse(payload)

    const credential = await prisma.$transaction(async (tx) => {
      const optionalData = buildCredentialData(parsed)
      delete optionalData.issueDate

      const created = await tx.therapistCredential.create({
        data: {
          therapistId: therapist.id,
          credentialType: parsed.credentialType,
          title: parsed.title.trim(),
          issuingAuthority: parsed.issuingAuthority.trim(),
          issueDate: new Date(parsed.issueDate),
          renewalRequired: parsed.renewalRequired ?? false,
          status: parsed.status ?? 'ACTIVE',
          verificationStatus: parsed.verificationStatus ?? 'UNVERIFIED',
          ...optionalData,
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

      return created
    })

    return NextResponse.json({
      success: true,
      data: serializeCredential(credential),
      message: 'Credential added successfully',
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

    console.error('Credential creation failed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create credential' },
      { status: 500 },
    )
  }
}
