import { NextRequest, NextResponse } from 'next/server'
import { differenceInDays, startOfYear } from 'date-fns'
import { prisma, CredentialStatus } from '@myoflow/db'
import { requireTherapist } from '@/lib/shared-helpers'
import { calculateProfileCompletion } from '../utils/profileCompletion'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'

const KLEINUNTERNEHMER_LIMIT_CENTS = 5_500_000
const RKSV_THRESHOLD_CENTS = 1_500_000 // €15,000 annual revenue threshold for RKSV requirement


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

  // RKSV (Registrierkassenpflicht) compliance assessment
  const currentRevenueCents = taxSettings?.currentYearRevenueCents || 0
  const rksvRequired = currentRevenueCents >= RKSV_THRESHOLD_CENTS
  const rksvImplemented = taxSettings?.rksvEnabled || false

  let rksvStatus: 'not_required' | 'required' | 'compliant' | 'overdue' = 'not_required'
  if (rksvRequired) {
    if (rksvImplemented) {
      // Check if signature device audit is due
      const nextAuditDue = taxSettings?.nextRksvAuditDue ? new Date(taxSettings.nextRksvAuditDue) : null
      const isAuditOverdue = nextAuditDue && nextAuditDue < new Date()
      rksvStatus = isAuditOverdue ? 'overdue' : 'compliant'
    } else {
      rksvStatus = 'required'
    }
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
    rksvStatus,
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
    const { therapist } = await requireTherapist()

   const detailedTherapist = await prisma.therapist.findUnique({
      where: { id: therapist.id },
      include: {
        travelSettingsDetail: true,
        Preferences: true,
        TaxComplianceSettings: true,
        Credentials: {
          where: { status: { in: ['ACTIVE', 'EXPIRING'] } },
          orderBy: { expirationDate: 'asc' },
        },
      },
    })

    // Extract tax settings from the include
    const taxSettings = detailedTherapist?.TaxComplianceSettings

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

    const profileCompletion = calculateProfileCompletion(detailedTherapist, taxSettings)
    const complianceStatus = assessComplianceStatus(
      { ...taxSettings, currentYearRevenueCents: displayRevenueCents },
      detailedTherapist.Credentials || [],
    )

    // Calculate days until next RKSV audit
    const nextRksvAuditDue = taxSettings?.nextRksvAuditDue ? new Date(taxSettings.nextRksvAuditDue) : null
    const daysUntilRksvAudit = nextRksvAuditDue
      ? Math.ceil((nextRksvAuditDue.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null

    const quickStats = {
      currentYearRevenue:
        displayRevenueCents / 100,
      kleinunternehmerThreshold:
        (taxSettings?.kleinunternehmerThresholdCents || KLEINUNTERNEHMER_LIMIT_CENTS) / 100,
      thresholdPercentage:
        (displayRevenueCents /
          (taxSettings?.kleinunternehmerThresholdCents || KLEINUNTERNEHMER_LIMIT_CENTS)) * 100,
      daysUntilCredentialExpiry: getNextCredentialExpiryDays(detailedTherapist.Credentials || []),
      rksvThreshold: RKSV_THRESHOLD_CENTS / 100, // €15,000
      rksvThresholdPercentage: (displayRevenueCents / RKSV_THRESHOLD_CENTS) * 100,
      daysUntilRksvAudit,
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
