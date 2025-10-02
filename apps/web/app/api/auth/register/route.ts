import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@myoflow/db'
import { validateEmail, validatePassword } from '../../../../lib/validation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, confirmPassword, firstName, lastName, practice } = body

    // Validation
    if (!email || !password || !confirmPassword || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      )
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: 'Password requirements not met', details: passwordValidation.errors },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Create user and therapist profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name: `${firstName} ${lastName}`,
          role: 'OWNER', // Default role for new signups
          trialStarted: new Date(),
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          subscriptionStatus: 'TRIAL',
        }
      })

      // Generate unique slug for therapist
      const baseSlug = `${firstName.toLowerCase()}-${lastName.toLowerCase()}`
      let slug = baseSlug
      let counter = 1

      while (await tx.therapist.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`
        counter++
      }

      // Create therapist profile
      const therapist = await tx.therapist.create({
        data: {
          userId: user.id,
          slug,
          designation: 'HEILMASSEUR', // Default designation
          vatStatus: 'KLEINUNTERNEHMER', // Default for Austria
          businessName: practice || `${firstName} ${lastName} - Therapie`,
          profileCompletionScore: 20, // Basic info provided
          // Set 30-day trial
          profileCompletedAt: new Date(),
        }
      })

      // Create default settings
      await Promise.all([
        // Tax compliance settings
        tx.taxComplianceSettings.create({
          data: {
            therapistId: therapist.id,
            kleinunternehmerActive: true,
            kleinunternehmerStart: new Date(),
            currentYearRevenueCents: 0,
          }
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
          }
        }),
        // User preferences
        tx.userPreferences.create({
          data: {
            therapistId: therapist.id,
            language: 'DE',
            timezone: 'Europe/Vienna',
            currency: 'EUR',
          }
        }),
        // Default export configuration
        tx.exportConfiguration.create({
          data: {
            therapistId: therapist.id,
            exportType: 'ACCOUNTING_EXPORT',
            targetSystem: 'CSV_GENERIC',
            configurationName: 'Standard Export',
            isDefault: true,
          }
        })
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
      }
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error during registration' },
      { status: 500 }
    )
  }
}