import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@myoflow/db'
import { z } from 'zod'
import {
  ensureTherapistAccount,
  handleAuthErrors,
  requireTherapist,
} from '@/lib/shared-helpers'

export const dynamic = 'force-dynamic'

const BRANDING_SELECT = {
  id: true,
  invoiceLogoUrl: true,
  invoiceDisplayPreference: true,
  invoiceThankYouMessage: true,
  brandColor: true,
  settingsLastUpdated: true,
  settingsVersion: true,
} as const

const InvoiceBrandingSchema = z
  .object({
    invoiceLogoUrl: z
      .string()
      .trim()
      .url('Invalid logo URL format')
      .nullable()
      .optional(),
    invoiceDisplayPreference: z
      .enum(['NAME', 'LOGO', 'BOTH'], {
        errorMap: () => ({ message: 'Display preference must be NAME, LOGO, or BOTH' }),
      })
      .optional(),
    invoiceThankYouMessage: z
      .string()
      .trim()
      .max(500, 'Thank you message must be 500 characters or fewer')
      .nullable()
      .optional(),
  })
  .strict()

function normalizeNullableString(value: string | null | undefined) {
  if (value === undefined) return undefined
  if (value === null) return null
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

function serializeBranding(branding: any) {
  return {
    id: branding.id,
    invoiceLogoUrl: branding.invoiceLogoUrl ?? null,
    invoiceDisplayPreference: branding.invoiceDisplayPreference ?? 'NAME',
    invoiceThankYouMessage: branding.invoiceThankYouMessage ?? null,
    brandColor: branding.brandColor ?? '#1F6FEB',
    settingsLastUpdated: branding.settingsLastUpdated
      ? branding.settingsLastUpdated.toISOString()
      : null,
    settingsVersion: branding.settingsVersion ?? 1,
  }
}

export async function GET(request: NextRequest) {
  return handleAuthErrors(async () => {
    const { therapist } = await requireTherapist()

    const branding = await prisma.therapist.findUnique({
      where: { id: therapist.id },
      select: BRANDING_SELECT,
    })

    if (!branding) {
      return NextResponse.json(
        { success: false, error: 'Therapist profile not found' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: serializeBranding(branding),
    })
  })
}

export async function PUT(request: NextRequest) {
  return handleAuthErrors(async () => {
    const { therapist } = await ensureTherapistAccount(request)
    const payload = (await request.json()) as Record<string, unknown>

    const validFields = ['invoiceLogoUrl', 'invoiceDisplayPreference', 'invoiceThankYouMessage']
    const hasFields = validFields.some((field) => Object.prototype.hasOwnProperty.call(payload, field))

    if (!hasFields) {
      return NextResponse.json(
        {
          success: false,
          error:
            'No fields to update. Provide at least one of: invoiceLogoUrl, invoiceDisplayPreference, invoiceThankYouMessage',
        },
        { status: 400 },
      )
    }

    const filteredBody = Object.fromEntries(
      Object.entries(payload).filter(([key]) => validFields.includes(key)),
    )

    const validation = InvoiceBrandingSchema.safeParse(filteredBody)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid branding settings',
          details: validation.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 },
      )
    }

    const updates = {
      invoiceLogoUrl: normalizeNullableString(validation.data.invoiceLogoUrl ?? undefined),
      invoiceDisplayPreference: validation.data.invoiceDisplayPreference,
      invoiceThankYouMessage: normalizeNullableString(
        validation.data.invoiceThankYouMessage ?? undefined,
      ),
    }

    const updatedBranding = await prisma.therapist.update({
      where: { id: therapist.id },
      data: {
        ...Object.fromEntries(
          Object.entries(updates).filter(([_key, value]) => value !== undefined),
        ),
        settingsLastUpdated: new Date(),
        settingsVersion: { increment: 1 },
      },
      select: BRANDING_SELECT,
    })

    return NextResponse.json({
      success: true,
      data: serializeBranding(updatedBranding),
      message: 'Invoice branding updated successfully',
    })
  })
}
