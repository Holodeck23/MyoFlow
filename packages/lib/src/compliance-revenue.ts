/**
 * Revenue Calculation and Kleinunternehmer Compliance Utilities
 * Tracks revenue against Austrian €55,000 Kleinunternehmer threshold
 */

import { formatAustrianCurrency } from './austrian-invoicing'

export const KLEINUNTERNEHMER_THRESHOLD_CENTS = 5500000 // €55,000
export const TOLERANCE_THRESHOLD_CENTS = 6050000 // €60,500 (10% tolerance)
export const WARNING_THRESHOLD_PERCENTAGE = 0.9 // 90%

export type RevenueStatus = 'SAFE' | 'WARNING' | 'EXCEEDED' | 'CRITICAL'

export interface RevenueStatusResult {
  currentRevenueCents: number
  thresholdCents: number
  toleranceThresholdCents: number
  percentageUsed: number
  remainingCents: number
  status: RevenueStatus
  alert: boolean
  message?: string
  isCached?: boolean
  formatted: {
    currentRevenue: string
    threshold: string
    remaining: string
    toleranceThreshold: string
  }
}

/**
 * Calculate revenue status against Kleinunternehmer threshold
 */
export function calculateRevenueStatus(
  currentRevenueCents: number,
  isCached: boolean = false
): RevenueStatusResult {
  const thresholdCents = KLEINUNTERNEHMER_THRESHOLD_CENTS
  const toleranceThresholdCents = TOLERANCE_THRESHOLD_CENTS
  const percentageUsed = (currentRevenueCents / thresholdCents) * 100
  const remainingCents = Math.max(0, thresholdCents - currentRevenueCents)

  let status: RevenueStatus
  let alert: boolean
  let message: string | undefined

  if (percentageUsed >= 110) {
    // Over 10% tolerance - CRITICAL
    status = 'CRITICAL'
    alert = true
    message =
      'Sie haben die 10%-Toleranzgrenze überschritten. Alle weiteren Rechnungen müssen Umsatzsteuer ausweisen.'
  } else if (percentageUsed >= 100) {
    // Over threshold but within tolerance - EXCEEDED
    status = 'EXCEEDED'
    alert = true
    message =
      'Sie haben die Kleinunternehmergrenze überschritten. Beratung durch einen Steuerberater empfohlen.'
  } else if (percentageUsed >= WARNING_THRESHOLD_PERCENTAGE * 100) {
    // Approaching threshold (90-100%) - WARNING
    status = 'WARNING'
    alert = true
    message = `Sie nähern sich der Kleinunternehmergrenze (${percentageUsed.toFixed(1)}%). Überwachen Sie Ihren Umsatz.`
  } else {
    // Safe - under 90%
    status = 'SAFE'
    alert = false
  }

  return {
    currentRevenueCents,
    thresholdCents,
    toleranceThresholdCents,
    percentageUsed: Math.round(percentageUsed * 10) / 10, // Round to 1 decimal
    remainingCents,
    status,
    alert,
    message,
    isCached,
    formatted: {
      currentRevenue: formatAustrianCurrency(currentRevenueCents),
      threshold: formatAustrianCurrency(thresholdCents),
      remaining: formatAustrianCurrency(remainingCents),
      toleranceThreshold: formatAustrianCurrency(toleranceThresholdCents),
    },
  }
}

/**
 * Check if revenue cache is fresh (< 24 hours old)
 */
export function isCacheFresh(cachedAt: Date | null): boolean {
  if (!cachedAt) return false

  const CACHE_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours
  const now = Date.now()
  const cacheAge = now - cachedAt.getTime()

  return cacheAge < CACHE_DURATION_MS
}

/**
 * Get current year date range for invoice filtering
 */
export function getCurrentYearDateRange(): { start: Date; end: Date } {
  const currentYear = new Date().getFullYear()
  const start = new Date(currentYear, 0, 1) // January 1
  const end = new Date(currentYear, 11, 31, 23, 59, 59, 999) // December 31

  return { start, end }
}

/**
 * Calculate revenue from invoice totals
 */
export function sumInvoiceRevenue(invoices: Array<{ totalGrossCents: number }>): number {
  return invoices.reduce((sum, invoice) => sum + invoice.totalGrossCents, 0)
}
