import { NextRequest, NextResponse } from 'next/server'
import { differenceInDays, startOfYear } from 'date-fns'
import { prisma, CredentialStatus } from '@myoflow/db'
import { requireTherapist } from '@/lib/shared-helpers'

const KLEINUNTERNEHMER_LIMIT_CENTS = 5_500_000


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
    const { therapist } = await requireTherapist(request)

   const detailedTherapist = await prisma.therapist.findUnique({
      where: { id: therapist.id },
      include: {
        travelSettingsDetail: true,
        Preferences: true,
        Credentials: {
          where: { status: { in: ['ACTIVE', 'EXPIRING'] } },
          orderBy: { expirationDate: 'asc' },
        },
      },
    })

    // Fetch TaxComplianceSettings separately with error handling
    let taxSettings = null
    try {
      taxSettings = await prisma.taxComplianceSettings.findUnique({
        where: { therapistId: therapist.id },
      })
    } catch (error) {
      console.warn('TaxComplianceSettings query failed, continuing without:', error)
    }

    if (!detailedTherapist) {
      return NextResponse.json({ error: 'Therapist not found' }, { status: 404 })
    }

    // Read current year revenue without performing writes
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

    // Use cached revenue from tax settings if available and recent, otherwise use live calculation
    const isCacheRecent = taxSettings?.revenueLastCalculatedAt &&
      (Date.now() - taxSettings.revenueLastCalculatedAt.getTime()) < 24 * 60 * 60 * 1000 // 24 hours

    const displayRevenueCents = (isCacheRecent && taxSettings?.currentYearRevenueCents)
      ? taxSettings.currentYearRevenueCents
      : revenueCents

    const profileCompletion = calculateProfileCompletion(detailedTherapist)
    const complianceStatus = assessComplianceStatus(
      { ...taxSettings, currentYearRevenueCents: displayRevenueCents },
      detailedTherapist.Credentials || [],
    )

    const quickStats = {
      currentYearRevenue:
        displayRevenueCents / 100,
      kleinunternehmerThreshold:
        (taxSettings?.kleinunternehmerThresholdCents || KLEINUNTERNEHMER_LIMIT_CENTS) / 100,
      thresholdPercentage:
        (displayRevenueCents /
          (taxSettings?.kleinunternehmerThresholdCents || KLEINUNTERNEHMER_LIMIT_CENTS)) * 100,
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
