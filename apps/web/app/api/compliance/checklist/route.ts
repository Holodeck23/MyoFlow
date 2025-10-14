import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@myoflow/db'
import { generateComplianceChecklist, type ComplianceChecklistResult } from '@myoflow/lib'

export const dynamic = 'force-dynamic'

/**
 * GET /api/compliance/checklist
 *
 * Generate comprehensive compliance checklist for authenticated therapist
 *
 * Returns:
 * - overallScore: 0-100% compliance readiness score
 * - profileComplete: Boolean indicating all required fields present
 * - taxValidation: Status of professional tax validation
 * - revenueStatus: Current revenue vs Kleinunternehmer threshold
 * - checklist: Detailed list of compliance items by category
 * - categoryScores: Completion percentage per category (PROFILE, TAX, REVENUE)
 * - alerts: Important warnings requiring attention
 * - actionItems: Specific tasks to complete for full compliance
 *
 * Categories:
 * - PROFILE: Business information completeness
 * - TAX: Professional validation status
 * - REVENUE: Kleinunternehmer threshold tracking
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find therapist with compliance-relevant fields
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        Therapist: {
          select: {
            id: true,
            businessName: true,
            businessAddress: true,
            businessEmail: true,
            businessPhone: true,
            iban: true,
            uidNumber: true,
            taxValidationCompleted: true,
            taxValidatedAt: true,
            annualGrossCents: true,
            annualGrossCachedAt: true,
          },
        },
      },
    })

    if (!user || !user.Therapist) {
      return NextResponse.json({ error: 'Therapist not found' }, { status: 404 })
    }

    // Generate compliance checklist
    const checklistResult: ComplianceChecklistResult = generateComplianceChecklist({
      businessName: user.Therapist.businessName,
      businessAddress: user.Therapist.businessAddress,
      businessEmail: user.Therapist.businessEmail,
      businessPhone: user.Therapist.businessPhone,
      iban: user.Therapist.iban,
      uidNumber: user.Therapist.uidNumber,
      taxValidationCompleted: user.Therapist.taxValidationCompleted,
      taxValidatedAt: user.Therapist.taxValidatedAt,
      annualGrossCents: user.Therapist.annualGrossCents,
      annualGrossCachedAt: user.Therapist.annualGrossCachedAt,
    })

    return NextResponse.json(checklistResult)
  } catch (error) {
    console.error('Error generating compliance checklist:', error)
    return NextResponse.json(
      { error: 'Failed to generate compliance checklist' },
      { status: 500 }
    )
  }
}
