import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { differenceInDays, startOfYear } from 'date-fns'
import { authOptions } from '@/lib/auth'
import { prisma, CredentialStatus } from '@myoflow/db'

const KLEINUNTERNEHMER_LIMIT_CENTS = 5_500_000

async function authenticateTherapist(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    throw new Response('Unauthorized', { status: 401 })
  }

  const user = await prisma.user.upsert({
    where: { email: session.user.email },
    update: {
      name: session.user.name || session.user.email || 'Therapist',
    },
    create: {
      email: session.user.email,
      name: session.user.name || session.user.email || 'Therapist',
      role: 'OWNER',
    },
  })

  const therapist = await prisma.therapist.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      slug: session.user.email?.split('@')[0] || `therapist-${user.id}`,
      designation: 'HEILMASSEUR',
      vatStatus: 'KLEINUNTERNEHMER',
    },
  })

  return therapist
}

async function ensureDefaultSettings(therapistId: string) {
  await Promise.all([
    prisma.taxComplianceSettings.upsert({
      where: { therapistId },
      update: {},
      create: {
        therapistId,
        kleinunternehmerActive: true,
        kleinunternehmerThresholdCents: KLEINUNTERNEHMER_LIMIT_CENTS,
      },
    }),
    prisma.travelSettings.upsert({
      where: { therapistId },
      update: {},
      create: {
        therapistId,
        baseAddressLine1: 'Hauptplatz 1',
        baseCity: 'Linz',
        basePostalCode: '4020',
        baseCountry: 'Austria',
        transportMethod: 'CAR',
        ratePerKmCents: 45,
        minimumTravelChargeCents: 700,
      },
    }),
    prisma.userPreferences.upsert({
      where: { therapistId },
      update: {},
      create: {
        therapistId,
        language: 'DE',
        timezone: 'Europe/Vienna',
        currency: 'EUR',
      },
    }),
  ])
}

function calculateProfileCompletion(therapist: any) {
  const requiredFields: Array<[string, string]> = [
    ['businessName', 'Business name'],
    ['businessAddress', 'Business address'],
    ['businessEmail', 'Business email'],
    ['businessPhone', 'Business phone'],
    ['uidNumber', 'Austrian VAT/UID'],
  ]

  const importantFields: Array<[string, string]> = [
    ['invoiceFooter', 'Invoice footer'],
    ['taxAdvisorName', 'Tax advisor name'],
    ['taxAdvisorEmail', 'Tax advisor email'],
    ['publicProfileDescription', 'Public profile description'],
  ]

  const completedRequired = requiredFields.filter(([field]) => {
    const value = therapist[field]
    return value && typeof value === 'string' ? value.trim().length > 0 : Boolean(value)
  })

  const completedImportant = importantFields.filter(([field]) => {
    const value = therapist[field]
    return value && typeof value === 'string' ? value.trim().length > 0 : Boolean(value)
  })

  const missingRequired = requiredFields
    .filter(([field]) => !completedRequired.find(([completedField]) => completedField === field))
    .map(([_, label]) => ({ category: 'profile', item: label, priority: 'high' as const }))

  const missingImportant = importantFields
    .filter(([field]) => !completedImportant.find(([completedField]) => completedField === field))
    .map(([_, label]) => ({ category: 'profile', item: label, priority: 'medium' as const }))

  const totalItems = requiredFields.length + importantFields.length
  const completedItems = completedRequired.length + completedImportant.length

  return {
    score: totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100),
    totalItems,
    completedItems,
    missingItems: [...missingRequired, ...missingImportant],
  }
}

function assessComplianceStatus(taxSettings: any, credentials: any[]) {
  const vatCompliance = taxSettings?.vatRegistered ? 'compliant' : 'warning'

  const thresholdPercentage = taxSettings?.currentYearRevenueCents
    ? (taxSettings.currentYearRevenueCents / (taxSettings.kleinunternehmerThresholdCents || KLEINUNTERNEHMER_LIMIT_CENTS)) * 100
    : 0

  let kleinunternehmerStatus: 'active' | 'threshold_warning' | 'exceeded' = 'active'
  if (thresholdPercentage >= 100) {
    kleinunternehmerStatus = 'exceeded'
  } else if (thresholdPercentage >= 80) {
    kleinunternehmerStatus = 'threshold_warning'
  }

  const hasExpiringCredential = credentials.some((credential) => credential.status === CredentialStatus.EXPIRING)
  const credentialsStatus: 'valid' | 'expiring' | 'expired' = credentials.some(
    (credential) => credential.status === CredentialStatus.EXPIRED
  )
    ? 'expired'
    : hasExpiringCredential
    ? 'expiring'
    : 'valid'

  return {
    vatCompliance,
    kleinunternehmerStatus,
    credentialsStatus,
  }
}

function getNextCredentialExpiryDays(credentials: any[]) {
  const upcoming = credentials
    .filter((credential) => credential.expirationDate)
    .map((credential) => new Date(credential.expirationDate as string))
    .filter((date) => date.getTime() > Date.now())
    .sort((a, b) => a.getTime() - b.getTime())

  if (upcoming.length === 0) {
    return null
  }

  return differenceInDays(upcoming[0], new Date())
}

export async function GET(request: NextRequest) {
  try {
    const therapist = await authenticateTherapist(request)
    await ensureDefaultSettings(therapist.id)

   const detailedTherapist = await prisma.therapist.findUnique({
      where: { id: therapist.id },
      include: {
        TaxComplianceSettings: true,
        travelSettingsDetail: true,
        Preferences: true,
        Credentials: {
          where: { status: { in: ['ACTIVE', 'EXPIRING'] } },
          orderBy: { expirationDate: 'asc' },
        },
      },
    })

    if (!detailedTherapist) {
      return NextResponse.json({ error: 'Therapist not found' }, { status: 404 })
    }

    const currentYearRevenue = await prisma.invoice.aggregate({
      _sum: { totalGrossCents: true },
      where: {
        therapistId: detailedTherapist.id,
        status: { in: ['SENT', 'PAID'] },
        createdAt: {
          gte: startOfYear(new Date()),
        },
      },
    })

    const revenueCents = currentYearRevenue._sum.totalGrossCents ?? 0

    if (detailedTherapist.TaxComplianceSettings) {
      await prisma.taxComplianceSettings.update({
        where: { therapistId: detailedTherapist.id },
        data: {
          currentYearRevenueCents: revenueCents,
          revenueYear: new Date().getFullYear(),
          revenueLastCalculatedAt: new Date(),
        },
      })
    }

    const updatedTaxSettings = detailedTherapist.TaxComplianceSettings
      ? { ...detailedTherapist.TaxComplianceSettings, currentYearRevenueCents: revenueCents }
      : null

    const profileCompletion = calculateProfileCompletion(detailedTherapist)
    const complianceStatus = assessComplianceStatus(
      updatedTaxSettings,
      detailedTherapist.Credentials || [],
    )

    const quickStats = {
      currentYearRevenue:
        revenueCents / 100,
      kleinunternehmerThreshold:
        (detailedTherapist.TaxComplianceSettings?.kleinunternehmerThresholdCents || KLEINUNTERNEHMER_LIMIT_CENTS) / 100,
      thresholdPercentage:
        (revenueCents /
          (detailedTherapist.TaxComplianceSettings?.kleinunternehmerThresholdCents || KLEINUNTERNEHMER_LIMIT_CENTS)) * 100,
      daysUntilCredentialExpiry: getNextCredentialExpiryDays(detailedTherapist.Credentials || []),
    }

    return NextResponse.json({
      profileCompletion,
      complianceStatus,
      quickStats,
      lastUpdated: detailedTherapist.settingsLastUpdated?.toISOString() ?? new Date().toISOString(),
    })
  } catch (error) {
    if (error instanceof Response) {
      throw error
    }

    console.error('Settings overview error:', error)
    return NextResponse.json({ error: 'Failed to load settings overview' }, { status: 500 })
  }
}
