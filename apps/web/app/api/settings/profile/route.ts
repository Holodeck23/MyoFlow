import { NextRequest, NextResponse } from 'next/server'
import { prisma, TherapistDesignation, VatStatus } from '@myoflow/db'
import { z } from 'zod'
import {
  ensureTherapistAccount,
  handleAuthErrors,
  requireTherapist,
} from '@/lib/shared-helpers'
import {
  assertValidAustrianIban,
  isValidAustrianVatNumber,
  normalizeAustrianIban,
  normalizeVatNumber,
} from '@myoflow/lib'

export const dynamic = 'force-dynamic'

const PROFILE_SELECT = {
  id: true,
  businessName: true,
  businessAddress: true,
  businessEmail: true,
  businessPhone: true,
  businessWebsite: true,
  designation: true,
  chamberRegistration: true,
  certificates: true,
  vatStatus: true,
  uidNumber: true,
  businessType: true,
  businessRegistrationNumber: true,
  publicProfileSlug: true,
  publicProfileDescription: true,
  iban: true,
  taxValidationCompleted: true,
  taxValidatedAt: true,
  settingsLastUpdated: true,
  settingsVersion: true,
  createdAt: true,
  updatedAt: true,
} as const

const updateSchema = z
  .object({
    businessName: z
      .string()
      .trim()
      .min(1, 'Business name is required')
      .max(200, 'Business name must be 200 characters or fewer')
      .optional(),
    businessAddress: z
      .string()
      .trim()
      .max(500, 'Business address must be 500 characters or fewer')
      .nullable()
      .optional(),
    businessEmail: z
      .string()
      .trim()
      .email('Invalid business email address')
      .max(200, 'Business email must be 200 characters or fewer')
      .nullable()
      .optional(),
    businessPhone: z
      .string()
      .trim()
      .max(50, 'Business phone must be 50 characters or fewer')
      .nullable()
      .optional(),
    businessWebsite: z
      .string()
      .trim()
      .url('Business website must be a valid URL')
      .max(200, 'Business website must be 200 characters or fewer')
      .nullable()
      .optional(),
    designation: z.nativeEnum(TherapistDesignation).optional(),
    chamberRegistration: z
      .string()
      .trim()
      .max(100, 'Registration number must be 100 characters or fewer')
      .nullable()
      .optional(),
    certificates: z
      .array(
        z
          .string()
          .trim()
          .min(1, 'Certificate entry cannot be empty')
          .max(120, 'Certificate entry must be 120 characters or fewer'),
      )
      .max(25, 'A maximum of 25 certificates can be stored')
      .optional(),
    vatStatus: z.nativeEnum(VatStatus).optional(),
    uidNumber: z
      .string()
      .trim()
      .max(32, 'UID number must be 32 characters or fewer')
      .nullable()
      .optional(),
    publicProfileSlug: z
      .string()
      .trim()
      .regex(/^[a-z0-9\-]+$/i, 'Profile slug can only contain letters, numbers, and hyphens')
      .min(3, 'Profile slug must be at least 3 characters')
      .max(64, 'Profile slug must be 64 characters or fewer')
      .nullable()
      .optional(),
    publicProfileDescription: z
      .string()
      .trim()
      .max(1000, 'Profile description must be 1000 characters or fewer')
      .nullable()
      .optional(),
    businessType: z
      .string()
      .trim()
      .max(100, 'Business type must be 100 characters or fewer')
      .nullable()
      .optional(),
    businessRegistrationNumber: z
      .string()
      .trim()
      .max(100, 'Business registration number must be 100 characters or fewer')
      .nullable()
      .optional(),
    iban: z
      .string()
      .trim()
      .max(34, 'IBAN must be 34 characters or fewer')
      .nullable()
      .optional(),
  })
  .strict()

type UpdatePayload = z.infer<typeof updateSchema>

function normalizeNullableString(value: string | null | undefined) {
  if (value === undefined) {
    return undefined
  }
  if (value === null) {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

function serializeProfile(profile: any) {
  return {
    id: profile.id,
    businessName: profile.businessName ?? null,
    businessAddress: profile.businessAddress ?? null,
    businessEmail: profile.businessEmail ?? null,
    businessPhone: profile.businessPhone ?? null,
    businessWebsite: profile.businessWebsite ?? null,
    designation: profile.designation ?? null,
    chamberRegistration: profile.chamberRegistration ?? null,
    certificates: profile.certificates ?? [],
    vatStatus: profile.vatStatus ?? null,
    uidNumber: profile.uidNumber ?? null,
    businessType: profile.businessType ?? null,
    businessRegistrationNumber: profile.businessRegistrationNumber ?? null,
    publicProfileSlug: profile.publicProfileSlug ?? null,
    publicProfileDescription: profile.publicProfileDescription ?? null,
    iban: profile.iban ?? null,
    taxValidationCompleted: Boolean(profile.taxValidationCompleted),
    taxValidatedAt: profile.taxValidatedAt ? profile.taxValidatedAt.toISOString() : null,
    settingsLastUpdated: profile.settingsLastUpdated
      ? profile.settingsLastUpdated.toISOString()
      : null,
    settingsVersion: profile.settingsVersion ?? 1,
    createdAt: profile.createdAt?.toISOString?.() ?? null,
    updatedAt: profile.updatedAt?.toISOString?.() ?? null,
  }
}

function buildUpdateData(payload: UpdatePayload) {
  const data: Record<string, unknown> = {}

  if (payload.businessName !== undefined) {
    data.businessName = payload.businessName.trim()
  }

  if (payload.businessAddress !== undefined) {
    data.businessAddress = normalizeNullableString(payload.businessAddress)
  }

  if (payload.businessEmail !== undefined) {
    data.businessEmail = normalizeNullableString(payload.businessEmail)
  }

  if (payload.businessPhone !== undefined) {
    data.businessPhone = normalizeNullableString(payload.businessPhone)
  }

  if (payload.businessWebsite !== undefined) {
    data.businessWebsite = normalizeNullableString(payload.businessWebsite)
  }

  if (payload.designation !== undefined) {
    data.designation = payload.designation
  }

  if (payload.chamberRegistration !== undefined) {
    data.chamberRegistration = normalizeNullableString(payload.chamberRegistration)
  }

  if (payload.certificates !== undefined) {
    data.certificates = payload.certificates.map((entry) => entry.trim())
  }

  if (payload.vatStatus !== undefined) {
    data.vatStatus = payload.vatStatus
  }

  if (payload.uidNumber !== undefined) {
    data.uidNumber = payload.uidNumber
  }

  if (payload.publicProfileSlug !== undefined) {
    const value = normalizeNullableString(payload.publicProfileSlug)
    data.publicProfileSlug = value ? value.toLowerCase() : null
  }

  if (payload.publicProfileDescription !== undefined) {
    data.publicProfileDescription = normalizeNullableString(payload.publicProfileDescription)
  }

  if (payload.businessType !== undefined) {
    data.businessType = normalizeNullableString(payload.businessType)
  }

  if (payload.businessRegistrationNumber !== undefined) {
    data.businessRegistrationNumber = normalizeNullableString(payload.businessRegistrationNumber)
  }

  if (payload.iban !== undefined) {
    data.iban = payload.iban
  }

  return data
}

export async function GET(request: NextRequest) {
  return handleAuthErrors(async () => {
    const { therapist } = await requireTherapist()

    const profile = await prisma.therapist.findUnique({
      where: { id: therapist.id },
      select: PROFILE_SELECT,
    })

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Therapist profile not found' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: serializeProfile(profile),
    })
  })
}

export async function PUT(request: NextRequest) {
  try {
    const { therapist } = await ensureTherapistAccount(request)
    const payload = (await request.json()) as unknown
    const parsed = updateSchema.parse(payload)

    if (parsed.uidNumber !== undefined) {
      const normalizedUid = normalizeNullableString(parsed.uidNumber)
      if (normalizedUid) {
        const vatNormalized = normalizeVatNumber(normalizedUid)
        if (!isValidAustrianVatNumber(vatNormalized)) {
          return NextResponse.json(
            {
              success: false,
              error: 'UID number must follow Austrian VAT format (ATU########)',
            },
            { status: 400 },
          )
        }
        parsed.uidNumber = vatNormalized
      } else {
        parsed.uidNumber = null
      }
    }

    if (parsed.iban !== undefined) {
      const normalizedIban = normalizeAustrianIban(parsed.iban)
      if (normalizedIban) {
        assertValidAustrianIban(normalizedIban)
        parsed.iban = normalizedIban
      } else {
        parsed.iban = null
      }
    }

    const updateData = buildUpdateData(parsed)

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No valid fields provided. Supply at least one profile field to update.',
        },
        { status: 400 },
      )
    }

    const updatedProfile = await prisma.$transaction(async (tx) => {
      const record = await tx.therapist.update({
        where: { id: therapist.id },
        data: {
          ...updateData,
          settingsLastUpdated: new Date(),
          settingsVersion: { increment: 1 },
        },
        select: PROFILE_SELECT,
      })

      return record
    })

    return NextResponse.json({
      success: true,
      data: serializeProfile(updatedProfile),
      message: 'Profile updated successfully',
    })
  } catch (error) {
    if (error instanceof Response) {
      throw error
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.flatten(),
        },
        { status: 400 },
      )
    }

    console.error('Profile update failed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 },
    )
  }
}
