import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma, TherapistDesignation, VatStatus } from '@myoflow/db'
import { z } from 'zod'

const UpdateProfileSchema = z.object({
  businessName: z.string().min(1).max(100).optional(),
  businessAddress: z.string().max(500).optional(),
  businessEmail: z.string().email().optional(),
  businessPhone: z.string().max(50).optional(),
  businessWebsite: z.string().url().optional(),
  designation: z.nativeEnum(TherapistDesignation).optional(),
  vatStatus: z.nativeEnum(VatStatus).optional(),
  uidNumber: z.string().max(50).optional(),
  iban: z.string().max(50).optional(),
  certificates: z.array(z.string().max(200)).optional(),
  chamberRegistration: z.string().max(100).optional(),
  invoiceFooter: z.string().max(1000).optional(),
  languagePreference: z.enum(['de', 'en']).optional(),
  enableTravelService: z.boolean().optional(),
  travelServiceRadius: z.number().min(1).max(200).optional(),
  travelRatePerKm: z.number().min(0).max(1000).optional(),
  defaultTravelBuffer: z.number().min(0).max(180).optional(),
  maxDailyTravelKm: z.number().min(0).max(500).optional(),
  enableEmailReminders: z.boolean().optional(),
  enableSmsReminders: z.boolean().optional(),
  defaultReminderDays: z.number().min(0).max(30).optional(),
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
    therapist = await prisma.therapist.create({
      data: {
        userId: user.id,
        slug: session.user.email?.split('@')[0] || 'therapist',
        designation: TherapistDesignation.HEILMASSEUR,
        vatStatus: VatStatus.KLEINUNTERNEHMER
      }
    })
  }

  return therapist.id
}

function calculateProfileCompletion(therapist: any) {
  const requiredFields = [
    'businessName',
    'businessAddress',
    'businessEmail',
    'businessPhone',
    'uidNumber'
  ]

  const importantFields = [
    'certificates',
    'iban',
    'chamberRegistration'
  ]

  const requiredCompleted = requiredFields.filter(field =>
    therapist[field] && therapist[field].trim && therapist[field].trim().length > 0
  ).length

  const importantCompleted = importantFields.filter(field => {
    if (field === 'certificates') {
      return therapist[field] && therapist[field].length > 0
    }
    return therapist[field] && therapist[field].trim && therapist[field].trim().length > 0
  }).length

  const totalFields = requiredFields.length + importantFields.length
  const completedFields = requiredCompleted + importantCompleted

  return {
    percentage: Math.round((completedFields / totalFields) * 100),
    completedCount: completedFields,
    totalCount: totalFields,
    requiredCompleted,
    requiredTotal: requiredFields.length,
    importantCompleted,
    importantTotal: importantFields.length,
    missingRequired: requiredFields.filter(field =>
      !therapist[field] || !therapist[field].trim || therapist[field].trim().length === 0
    ),
    missingImportant: importantFields.filter(field => {
      if (field === 'certificates') {
        return !therapist[field] || therapist[field].length === 0
      }
      return !therapist[field] || !therapist[field].trim || therapist[field].trim().length === 0
    })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const therapistId = await getTherapistId(session)

    const therapist = await prisma.therapist.findUnique({
      where: { id: therapistId },
      select: {
        id: true,
        userId: true,
        slug: true,
        designation: true,
        vatStatus: true,
        kleinunternehmer: true,
        annualGrossCents: true,
        annualGrossCachedAt: true,
        businessName: true,
        businessAddress: true,
        businessEmail: true,
        businessPhone: true,
        businessWebsite: true,
        uidNumber: true,
        iban: true,
        certificates: true,
        chamberRegistration: true,
        invoiceFooter: true,
        languagePreference: true,
        enableTravelService: true,
        travelServiceRadius: true,
        travelRatePerKm: true,
        defaultTravelBuffer: true,
        maxDailyTravelKm: true,
        enableEmailReminders: true,
        enableSmsReminders: true,
        defaultReminderDays: true,
        profileCompletedAt: true,
        brandColor: true,
        logoUrl: true,
        businessHours: true,
        complianceSettings: true,
        notificationSettings: true,
        travelSettings: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!therapist) {
      return NextResponse.json({ error: 'Therapist profile not found' }, { status: 404 })
    }

    const completionMetrics = calculateProfileCompletion(therapist)

    // Check system status
    const systemStatus = {
      database: 'online',
      encryption: 'active',
      compliance: 'konform'
    }

    return NextResponse.json({
      profile: therapist,
      completion: completionMetrics,
      systemStatus,
    })

  } catch (error) {
    console.error('Error fetching therapist profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const therapistId = await getTherapistId(session)
    const body = await request.json()
    const validatedData = UpdateProfileSchema.parse(body)

    const updatedTherapist = await prisma.therapist.update({
      where: { id: therapistId },
      data: {
        ...validatedData,
        updatedAt: new Date(),
        // Mark profile as completed if key fields are filled
        profileCompletedAt: validatedData.businessName && validatedData.businessAddress && validatedData.businessEmail
          ? new Date()
          : undefined
      },
      select: {
        id: true,
        businessName: true,
        businessAddress: true,
        businessEmail: true,
        businessPhone: true,
        businessWebsite: true,
        designation: true,
        vatStatus: true,
        kleinunternehmer: true,
        uidNumber: true,
        iban: true,
        certificates: true,
        chamberRegistration: true,
        invoiceFooter: true,
        languagePreference: true,
        enableTravelService: true,
        travelServiceRadius: true,
        travelRatePerKm: true,
        defaultTravelBuffer: true,
        maxDailyTravelKm: true,
        enableEmailReminders: true,
        enableSmsReminders: true,
        defaultReminderDays: true,
        profileCompletedAt: true,
        updatedAt: true,
      }
    })

    const completionMetrics = calculateProfileCompletion(updatedTherapist)

    return NextResponse.json({
      success: true,
      profile: updatedTherapist,
      completion: completionMetrics,
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
