import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@myoflow/db'
import { z } from 'zod'
import { validateEmail, validatePassword, normalizeEmail } from '../../../../lib/validation'

const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Invalid email format')
    .transform((value) => normalizeEmail(value)),
  password: z.string().min(1, 'Password is required'),
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
  firstName: z.string().min(1, 'First name is required').transform((value) => value.trim()),
  lastName: z.string().min(1, 'Last name is required').transform((value) => value.trim()),
  practice: z
    .string()
    .optional()
    .transform((value) => {
      if (typeof value !== 'string') {
        return undefined
      }
      const trimmed = value.trim()
      return trimmed.length > 0 ? trimmed : undefined
    }),
})

function createSlug(firstName: string, lastName: string) {
  const baseValue = `${firstName} ${lastName}`.trim()
  const normalized = baseValue
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()

  return normalized.length > 0 ? normalized : 'therapist'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message || 'Invalid registration data supplied'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const { email, password, confirmPassword, firstName, lastName, practice } = parsed.data

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 },
      )
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 },
      )
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: 'Password requirements not met', details: passwordValidation.errors },
        { status: 400 },
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 },
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 12)
    const fullName = `${firstName} ${lastName}`.trim()
    const baseSlug = createSlug(firstName, lastName)

    // Create user and therapist profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name: fullName,
          role: 'OWNER', // Default role for new signups
          trialStarted: new Date(),
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          subscriptionStatus: 'TRIAL',
        },
      })

      let slugCandidate = baseSlug
      let counter = 1

      while (await tx.therapist.findUnique({ where: { slug: slugCandidate } })) {
        slugCandidate = `${baseSlug}-${counter}`
        counter += 1
      }

      const therapist = await tx.therapist.create({
        data: {
          userId: user.id,
          slug: slugCandidate,
          designation: 'HEILMASSEUR', // Default designation
          vatStatus: 'KLEINUNTERNEHMER', // Default for Austria
          businessName: practice ?? `${fullName} - Therapie`,
          profileCompletionScore: 20, // Basic info provided
          // profileCompletedAt is null initially - will be set when profile reaches 70%+ completion
        },
      })

      await Promise.all([
        // Tax compliance settings
        tx.taxComplianceSettings.create({
          data: {
            therapistId: therapist.id,
            kleinunternehmerActive: true,
            kleinunternehmerStart: new Date(),
            currentYearRevenueCents: 0,
          },
        }),
        // Travel settings with default Austrian location (Linz)
        tx.travelSettings.create({
          data: {
            therapistId: therapist.id,
            baseAddressLine1: 'Hauptstraße 1',
            baseCity: 'Linz',
            basePostalCode: '4020',
            latitude: 48.3069,
            longitude: 14.2858,
            serviceRadiusKm: 20,
            ratePerKmCents: 42, // Austrian standard rate
          },
        }),
        // User preferences
        tx.userPreferences.create({
          data: {
            therapistId: therapist.id,
            language: 'DE',
            timezone: 'Europe/Vienna',
            currency: 'EUR',
          },
        }),
        // Default export configuration
        tx.exportConfiguration.create({
          data: {
            therapistId: therapist.id,
            exportType: 'ACCOUNTING_EXPORT',
            targetSystem: 'CSV_GENERIC',
            configurationName: 'Standard Export',
            isDefault: true,
          },
        }),
      ])

      return { user, therapist }
    })

    return NextResponse.json({
      success: true,
      message: 'Account created successfully! You can now sign in.',
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
      therapist: {
        id: result.therapist.id,
        slug: result.therapist.slug,
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error during registration' },
      { status: 500 },
    )
  }
}
