import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@myoflow/db'
import { z } from 'zod'

// Austrian compliance validation schemas
const UidNumberSchema = z.string().regex(/^ATU[0-9]{8}$/, 'UID number must be in format ATU12345678').optional().or(z.literal(''))
const BusinessEmailSchema = z.string().email('Invalid email format').optional().or(z.literal(''))
const BusinessPhoneSchema = z.string().min(1, 'Phone number required').optional().or(z.literal(''))

const UpdateProfileSchema = z.object({
  // Business Information
  businessName: z.string().max(255, 'Business name too long').optional(),
  businessAddress: z.string().max(500, 'Address too long').optional(), 
  businessPhone: BusinessPhoneSchema,
  businessEmail: BusinessEmailSchema,
  businessWebsite: z.string().url('Invalid website URL').optional().or(z.literal('')),
  
  // Austrian Compliance
  uidNumber: UidNumberSchema,
  chamberRegistration: z.string().max(100, 'Chamber registration too long').optional(),
  invoiceFooter: z.string().max(1000, 'Invoice footer too long').optional(),
  
  // Therapist Details  
  designation: z.enum(['HEILMASSEUR', 'MEDIZINISCHER_MASSEUR', 'GEWERBLICHER_MASSEUR']).optional(),
  vatStatus: z.enum(['KLEINUNTERNEHMER', 'UST_10', 'UST_13', 'UST_20']).optional(),
  kleinunternehmer: z.boolean().optional(),
  
  // Branding
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  logoUrl: z.string().url('Invalid logo URL').optional().or(z.literal('')),
  iban: z.string().optional(),
  
  // Preferences
  defaultReminderDays: z.number().min(0).max(30, 'Reminder days must be 0-30').optional(),
  enableEmailReminders: z.boolean().optional(),
  enableSmsReminders: z.boolean().optional(),
})

async function getTherapistId(session: any): Promise<string> {
  if (!session?.user?.email) {
    throw new Error('Unauthorized')
  }

  const user = await prisma.user.upsert({
    where: { email: session.user.email },
    update: {
      name: session.user.name || session.user.email || 'Unknown User',
    },
    create: {
      email: session.user.email,
      name: session.user.name || session.user.email || 'Unknown User',
    },
  })

  let therapist = await prisma.therapist.findFirst({
    where: { userId: user.id }
  })

  if (!therapist) {
    // Create therapist with defaults
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

function calculateProfileCompletion(therapist: any): { percentage: number; missingFields: string[] } {
  const requiredFields = [
    { key: 'businessName', label: 'Business name' },
    { key: 'businessAddress', label: 'Business address' },
    { key: 'businessPhone', label: 'Business phone' },
    { key: 'businessEmail', label: 'Business email' },
    { key: 'uidNumber', label: 'UID number' },
    { key: 'designation', label: 'Professional designation' },
    { key: 'vatStatus', label: 'VAT status' },
  ]

  const optionalFields = [
    { key: 'businessWebsite', label: 'Business website' },
    { key: 'chamberRegistration', label: 'Chamber registration' },
    { key: 'invoiceFooter', label: 'Invoice footer' },
    { key: 'brandColor', label: 'Brand color' },
    { key: 'logoUrl', label: 'Logo' },
    { key: 'iban', label: 'IBAN' },
  ]

  const allFields = [...requiredFields, ...optionalFields]
  
  const completedCount = allFields.filter(field => {
    const value = therapist[field.key]
    return value && value.toString().trim() !== ''
  }).length

  const missingRequired = requiredFields.filter(field => {
    const value = therapist[field.key]
    return !value || value.toString().trim() === ''
  }).map(field => field.label)

  const percentage = Math.round((completedCount / allFields.length) * 100)

  return { percentage, missingFields: missingRequired }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const therapistId = await getTherapistId(session)
    
    const therapist = await prisma.therapist.findUnique({
      where: { id: therapistId },
      select: {
        id: true,
        designation: true,
        vatStatus: true,
        kleinunternehmer: true,
        annualGrossCents: true,
        iban: true,
        brandColor: true,
        logoUrl: true,
        businessName: true,
        businessAddress: true,
        businessPhone: true,
        businessEmail: true,
        businessWebsite: true,
        uidNumber: true,
        chamberRegistration: true,
        invoiceFooter: true,
        defaultReminderDays: true,
        enableEmailReminders: true,
        enableSmsReminders: true,
        profileCompletedAt: true,
        updatedAt: true,
      }
    })

    if (!therapist) {
      return NextResponse.json({ error: 'Therapist not found' }, { status: 404 })
    }

    const completion = calculateProfileCompletion(therapist)

    return NextResponse.json({
      therapist,
      completionPercentage: completion.percentage,
      missingFields: completion.missingFields,
    })

  } catch (error) {
    console.error('Error fetching therapist profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const therapistId = await getTherapistId(session)
    const body = await request.json()
    
    // Validate input data
    const validatedData = UpdateProfileSchema.parse(body)
    
    // Check for VAT status consistency
    if (validatedData.vatStatus && validatedData.kleinunternehmer !== undefined) {
      const isKleinunternehmer = validatedData.vatStatus === 'KLEINUNTERNEHMER'
      if (isKleinunternehmer !== validatedData.kleinunternehmer) {
        return NextResponse.json({ 
          error: 'VAT status and Kleinunternehmer flag must be consistent' 
        }, { status: 400 })
      }
    }

    // Update therapist profile
    const updatedTherapist = await prisma.therapist.update({
      where: { id: therapistId },
      data: {
        ...validatedData,
        // Set profile completion timestamp if this is the first complete profile
        profileCompletedAt: validatedData.businessName && validatedData.businessAddress && validatedData.uidNumber 
          ? new Date() 
          : undefined,
      },
      select: {
        id: true,
        designation: true,
        vatStatus: true,
        kleinunternehmer: true,
        annualGrossCents: true,
        iban: true,
        brandColor: true,
        logoUrl: true,
        businessName: true,
        businessAddress: true,
        businessPhone: true,
        businessEmail: true,
        businessWebsite: true,
        uidNumber: true,
        chamberRegistration: true,
        invoiceFooter: true,
        defaultReminderDays: true,
        enableEmailReminders: true,
        enableSmsReminders: true,
        profileCompletedAt: true,
        updatedAt: true,
      }
    })

    const completion = calculateProfileCompletion(updatedTherapist)

    return NextResponse.json({
      success: true,
      therapist: updatedTherapist,
      completionPercentage: completion.percentage,
      missingFields: completion.missingFields,
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 })
    }
    
    console.error('Error updating therapist profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}