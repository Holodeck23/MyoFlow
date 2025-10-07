import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@myoflow/db'
import {
  calculateRevenueStatus,
  isCacheFresh,
  getCurrentYearDateRange,
  type RevenueStatusResult,
} from '@myoflow/lib'

export const dynamic = 'force-dynamic'

/**
 * GET /api/compliance/revenue-status
 *
 * Calculate therapist's current year revenue against Kleinunternehmer threshold (€55,000)
 *
 * Returns:
 * - Current revenue amount
 * - Percentage of threshold used
 * - Status: SAFE | WARNING | EXCEEDED | CRITICAL
 * - Alert flag for dashboard notifications
 * - Formatted currency strings
 *
 * Caching:
 * - Uses therapist.annualGrossCents if cached < 24 hours
 * - Otherwise recalculates from current year invoices
 * - Updates cache after recalculation
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
        Therapist: true,
      },
    })

    if (!user || !user.Therapist) {
      return NextResponse.json({ error: 'Therapist not found' }, { status: 404 })
    }

    const therapist = user.Therapist
    let currentRevenueCents: number
    let usedCache = false

    // Check if cache is fresh
    if (isCacheFresh(therapist.annualGrossCachedAt)) {
      // Use cached value
      currentRevenueCents = therapist.annualGrossCents
      usedCache = true
    } else {
      // Recalculate from invoices
      const { start, end } = getCurrentYearDateRange()

      const result = await prisma.invoice.aggregate({
        where: {
          therapistId: therapist.id,
          status: {
            in: ['PAID', 'SENT'], // Only count paid or sent invoices
          },
          createdAt: {
            gte: start,
            lte: end,
          },
        },
        _sum: {
          totalGrossCents: true,
        },
      })

      currentRevenueCents = result._sum.totalGrossCents || 0

      // Update cache
      await prisma.therapist.update({
        where: { id: therapist.id },
        data: {
          annualGrossCents: currentRevenueCents,
          annualGrossCachedAt: new Date(),
        },
      })

      usedCache = false
    }

    // Calculate status
    const revenueStatus: RevenueStatusResult = calculateRevenueStatus(
      currentRevenueCents,
      usedCache
    )

    return NextResponse.json(revenueStatus)
  } catch (error) {
    console.error('Error calculating revenue status:', error)
    return NextResponse.json(
      { error: 'Failed to calculate revenue status' },
      { status: 500 }
    )
  }
}
