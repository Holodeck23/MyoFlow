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
  assertValidAustrianPostalCode,
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
  profileCompletionScore: true,
  travelSettingsDetail: {
    select: {
      baseAddressLine1: true,
      baseAddressLine2: true,
      baseCity: true,
      basePostalCode: true,
      baseCountry: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} as const

const DEFAULT_TRAVEL_BASE = {
  address: 'Hauptstraße 1',
  postalCode: '4020',
  city: 'Linz',
  country: 'Austria',
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
    businessCity: z
      .string()
      .trim()
      .min(1, 'Business city is required')
      .max(120, 'Business city must be 120 characters or fewer')
      .optional(),
    businessPostalCode: z
      .string()
      .trim()
      .regex(/^[1-9]\d{3}$/, 'Postal code must be a valid Austrian postal code (1xxx-9xxx)')
      .optional(),
    businessCountry: z
      .string()
      .trim()
      .min(2, 'Business country is required')
      .max(120, 'Business country must be 120 characters or fewer')
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
type CoreUpdatePayload = Omit<
  UpdatePayload,
  'businessCity' | 'businessPostalCode' | 'businessCountry'
>

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
    businessCity: profile.travelSettingsDetail?.baseCity ?? null,
    businessPostalCode: profile.travelSettingsDetail?.basePostalCode ?? null,
    businessCountry: profile.travelSettingsDetail?.baseCountry ?? null,
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
    profileCompletionScore: profile.profileCompletionScore ?? 0,
    travelSettings: profile.travelSettingsDetail
      ? {
          baseAddressLine1: profile.travelSettingsDetail.baseAddressLine1 ?? null,
          baseAddressLine2: profile.travelSettingsDetail.baseAddressLine2 ?? null,
          baseCity: profile.travelSettingsDetail.baseCity ?? null,
          basePostalCode: profile.travelSettingsDetail.basePostalCode ?? null,
          baseCountry: profile.travelSettingsDetail.baseCountry ?? null,
        }
      : null,
    createdAt: profile.createdAt?.toISOString?.() ?? null,
    updatedAt: profile.updatedAt?.toISOString?.() ?? null,
  }
}

function buildUpdateData(payload: CoreUpdatePayload) {
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
    data.certificates = payload.certificates
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
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

function isMeaningfulString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function calculateProfileScore(profile: {
  businessAddress?: string | null
  designation?: string | null
  vatStatus?: string | null
  chamberRegistration?: string | null
  certificates?: string[] | null
  iban?: string | null
  travelSettingsDetail?: {
    baseAddressLine1?: string | null
    baseCity?: string | null
    basePostalCode?: string | null
    baseCountry?: string | null
  } | null
}) {
  let score = 20

  const addressLine =
    profile.travelSettingsDetail?.baseAddressLine1 ??
    profile.businessAddress ??
    DEFAULT_TRAVEL_BASE.address
  const city = profile.travelSettingsDetail?.baseCity ?? DEFAULT_TRAVEL_BASE.city
  const postalCode =
    profile.travelSettingsDetail?.basePostalCode ?? DEFAULT_TRAVEL_BASE.postalCode
  const country =
    profile.travelSettingsDetail?.baseCountry ?? DEFAULT_TRAVEL_BASE.country

  const hasCustomAddress =
    isMeaningfulString(addressLine) &&
    addressLine.trim() !== DEFAULT_TRAVEL_BASE.address &&
    isMeaningfulString(city) &&
    isMeaningfulString(country)

  const postalValid = isMeaningfulString(postalCode) && /^[1-9]\d{3}$/.test(postalCode.trim())

  if (hasCustomAddress && postalValid) {
    score += 30
  }

  if (isMeaningfulString(profile.designation) && isMeaningfulString(profile.vatStatus)) {
    score += 20
  }

  if (isMeaningfulString(profile.chamberRegistration)) {
    score += 10
  }

  if (Array.isArray(profile.certificates) && profile.certificates.length > 0) {
    score += 10
  }

  if (isMeaningfulString(profile.iban)) {
    score += 10
  }

  return Math.min(score, 100)
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

    const normalizedCity =
      typeof parsed.businessCity === 'string' ? parsed.businessCity.trim() : undefined
    const normalizedPostalCode =
      typeof parsed.businessPostalCode === 'string'
        ? parsed.businessPostalCode.trim()
        : undefined
    const normalizedCountry =
      typeof parsed.businessCountry === 'string' ? parsed.businessCountry.trim() : undefined

    if (normalizedPostalCode !== undefined) {
      assertValidAustrianPostalCode(normalizedPostalCode)
    }

    const corePayload = { ...parsed } as Record<string, unknown>
    delete corePayload.businessCity
    delete corePayload.businessPostalCode
    delete corePayload.businessCountry

    const updateData = buildUpdateData(corePayload as CoreUpdatePayload)
    const businessAddressValue = updateData['businessAddress']
    const hasTravelUpdates =
      normalizedCity !== undefined ||
      normalizedPostalCode !== undefined ||
      normalizedCountry !== undefined ||
      typeof businessAddressValue === 'string'

    if (Object.keys(updateData).length === 0 && !hasTravelUpdates) {
      return NextResponse.json(
        {
          success: false,
          error: 'No valid fields provided. Supply at least one profile field to update.',
        },
        { status: 400 },
      )
    }

    const updatedProfile = await prisma.$transaction(async (tx) => {
      const currentProfile = await tx.therapist.findUnique({
        where: { id: therapist.id },
        select: PROFILE_SELECT,
      })

      if (!currentProfile) {
        throw new Error('Therapist profile not found')
      }

      const travelSettingsUpdate: Record<string, string> = {}

      if (typeof businessAddressValue === 'string') {
        travelSettingsUpdate.baseAddressLine1 = businessAddressValue
      }

      if (normalizedCity !== undefined) {
        travelSettingsUpdate.baseCity = normalizedCity
      }

      if (normalizedPostalCode !== undefined) {
        travelSettingsUpdate.basePostalCode = normalizedPostalCode
      }

      if (normalizedCountry !== undefined) {
        travelSettingsUpdate.baseCountry = normalizedCountry
      }

      const mergedTravel = {
        baseAddressLine1:
          travelSettingsUpdate.baseAddressLine1 ??
          currentProfile.travelSettingsDetail?.baseAddressLine1 ??
          (typeof businessAddressValue === 'string'
            ? businessAddressValue
            : currentProfile.businessAddress ?? DEFAULT_TRAVEL_BASE.address),
        baseCity:
          travelSettingsUpdate.baseCity ??
          currentProfile.travelSettingsDetail?.baseCity ??
          DEFAULT_TRAVEL_BASE.city,
        basePostalCode:
          travelSettingsUpdate.basePostalCode ??
          currentProfile.travelSettingsDetail?.basePostalCode ??
          DEFAULT_TRAVEL_BASE.postalCode,
        baseCountry:
          travelSettingsUpdate.baseCountry ??
          currentProfile.travelSettingsDetail?.baseCountry ??
          DEFAULT_TRAVEL_BASE.country,
      }

      const mergedProfileForScore = {
        ...currentProfile,
        ...updateData,
        travelSettingsDetail: {
          ...currentProfile.travelSettingsDetail,
          ...mergedTravel,
        },
      }

      const score = calculateProfileScore(mergedProfileForScore)

      if (Object.keys(travelSettingsUpdate).length > 0) {
        await tx.travelSettings.upsert({
          where: { therapistId: therapist.id },
          update: {
            ...travelSettingsUpdate,
            updatedAt: new Date(),
          },
          create: {
            therapistId: therapist.id,
            baseAddressLine1: mergedTravel.baseAddressLine1,
            baseCity: mergedTravel.baseCity,
            basePostalCode: mergedTravel.basePostalCode,
            baseCountry: mergedTravel.baseCountry,
          },
        })
      }

      const record = await tx.therapist.update({
        where: { id: therapist.id },
        data: {
          ...updateData,
          profileCompletionScore: score,
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

    if (error instanceof Error && error.message === 'Therapist profile not found') {
      return NextResponse.json(
        { success: false, error: 'Therapist profile not found' },
        { status: 404 },
      )
    }

    console.error('Profile update failed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 },
    )
  }
}
