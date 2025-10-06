import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@myoflow/db'
import { z } from 'zod'

// Validation schema for branding settings
const InvoiceBrandingSchema = z.object({
  invoiceLogoUrl: z.string().url('Invalid logo URL format').nullable().optional(),
  invoiceDisplayPreference: z
    .enum(['NAME', 'LOGO', 'BOTH'], {
      errorMap: () => ({ message: 'Invalid display preference. Must be NAME, LOGO, or BOTH' }),
    })
    .optional(),
  invoiceThankYouMessage: z
    .string()
    .max(500, 'Thank you message must be 500 characters or less')
    .nullable()
    .optional(),
})

/**
 * GET /api/settings/invoice-branding
 *
 * Retrieve current invoice branding settings for authenticated therapist
 *
 * Returns:
 * - invoiceLogoUrl: URL to therapist's logo
 * - invoiceDisplayPreference: How to display branding (NAME | LOGO | BOTH)
 * - invoiceThankYouMessage: Custom message for invoice footer
 * - brandColor: Primary brand color (hex)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find therapist
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        Therapist: {
          select: {
            id: true,
            invoiceLogoUrl: true,
            invoiceDisplayPreference: true,
            invoiceThankYouMessage: true,
            brandColor: true,
          },
        },
      },
    })

    if (!user || !user.Therapist) {
      return NextResponse.json({ error: 'Therapist not found' }, { status: 404 })
    }

    return NextResponse.json(user.Therapist)
  } catch (error) {
    console.error('Error fetching invoice branding settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch branding settings' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/settings/invoice-branding
 *
 * Update invoice branding settings for authenticated therapist
 *
 * Request body:
 * - invoiceLogoUrl?: string | null - URL to therapist logo
 * - invoiceDisplayPreference?: "NAME" | "LOGO" | "BOTH" - Display mode
 * - invoiceThankYouMessage?: string | null - Custom footer message (max 500 chars)
 *
 * Validation:
 * - Logo URL must be valid URL format
 * - Display preference must be one of: NAME, LOGO, BOTH
 * - Thank you message max 500 characters
 * - At least one field required
 */
export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find therapist
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        Therapist: true,
      },
    })

    if (!user || !user.Therapist) {
      return NextResponse.json({ error: 'Therapist not found' }, { status: 404 })
    }

    // Parse and validate request body
    const body = await request.json()

    // Check if at least one field provided
    const validFields = ['invoiceLogoUrl', 'invoiceDisplayPreference', 'invoiceThankYouMessage']
    const hasValidField = validFields.some((field) => field in body)

    if (!hasValidField) {
      return NextResponse.json(
        { error: 'No fields to update. Provide at least one of: invoiceLogoUrl, invoiceDisplayPreference, invoiceThankYouMessage' },
        { status: 400 }
      )
    }

    // Filter out unknown fields
    const filteredBody = Object.fromEntries(
      Object.entries(body).filter(([key]) => validFields.includes(key))
    )

    // Validate with Zod
    const validation = InvoiceBrandingSchema.safeParse(filteredBody)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid branding settings',
          details: validation.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      )
    }

    // Update therapist settings
    const updatedTherapist = await prisma.therapist.update({
      where: { id: user.Therapist.id },
      data: validation.data,
      select: {
        id: true,
        invoiceLogoUrl: true,
        invoiceDisplayPreference: true,
        invoiceThankYouMessage: true,
        brandColor: true,
      },
    })

    return NextResponse.json(updatedTherapist)
  } catch (error) {
    console.error('Error updating invoice branding settings:', error)
    return NextResponse.json(
      { error: 'Failed to update branding settings' },
      { status: 500 }
    )
  }
}
