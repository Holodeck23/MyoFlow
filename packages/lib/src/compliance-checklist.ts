/**
 * Compliance Checklist and Readiness Scoring
 * Evaluates therapist profile completeness and compliance status
 */

import { calculateRevenueStatus, type RevenueStatus } from './compliance-revenue'

export type ChecklistCategory = 'PROFILE' | 'TAX' | 'REVENUE'
export type ChecklistItemStatus = 'COMPLETE' | 'INCOMPLETE'

export interface ChecklistItem {
  category: ChecklistCategory
  item: string
  status: ChecklistItemStatus
  required: boolean
  description?: string
}

export interface TaxValidationStatus {
  completed: boolean
  validatedAt: string | null
  message: string
}

export interface CategoryScores {
  PROFILE: number
  TAX: number
  REVENUE: number
}

export interface ComplianceChecklistResult {
  overallScore: number
  profileComplete: boolean
  taxValidation: TaxValidationStatus
  revenueStatus: RevenueStatus
  revenuePercentage: number
  checklist: ChecklistItem[]
  categoryScores: CategoryScores
  alerts: string[]
  actionItems: string[]
}

export interface TherapistComplianceData {
  businessName: string | null
  businessAddress: string | null
  businessEmail: string | null
  businessPhone: string | null
  iban: string | null
  uidNumber: string | null
  taxValidationCompleted: boolean
  taxValidatedAt: Date | null
  annualGrossCents: number
  annualGrossCachedAt: Date | null
}

/**
 * Required profile fields for compliance
 */
const REQUIRED_PROFILE_FIELDS = [
  'businessName',
  'businessAddress',
  'businessEmail',
  'businessPhone',
] as const

/**
 * Optional but recommended fields
 */
const RECOMMENDED_FIELDS = ['iban', 'uidNumber'] as const

/**
 * Check if a therapist profile is complete
 */
export function isProfileComplete(therapist: TherapistComplianceData): boolean {
  return REQUIRED_PROFILE_FIELDS.every((field) => {
    const value = therapist[field]
    return value !== null && value !== ''
  })
}

/**
 * Generate profile checklist items
 */
export function generateProfileChecklist(
  therapist: TherapistComplianceData
): ChecklistItem[] {
  const items: ChecklistItem[] = []

  // Required fields
  items.push({
    category: 'PROFILE',
    item: 'Business name',
    status: therapist.businessName ? 'COMPLETE' : 'INCOMPLETE',
    required: true,
    description: 'Legal business name for invoices',
  })

  items.push({
    category: 'PROFILE',
    item: 'Business address',
    status: therapist.businessAddress ? 'COMPLETE' : 'INCOMPLETE',
    required: true,
    description: 'Complete business address for invoices',
  })

  items.push({
    category: 'PROFILE',
    item: 'Business email',
    status: therapist.businessEmail ? 'COMPLETE' : 'INCOMPLETE',
    required: true,
    description: 'Contact email for invoices',
  })

  items.push({
    category: 'PROFILE',
    item: 'Business phone',
    status: therapist.businessPhone ? 'COMPLETE' : 'INCOMPLETE',
    required: true,
    description: 'Contact phone number',
  })

  // Recommended fields
  items.push({
    category: 'PROFILE',
    item: 'IBAN',
    status: therapist.iban ? 'COMPLETE' : 'INCOMPLETE',
    required: false,
    description: 'Bank account for receiving payments',
  })

  items.push({
    category: 'PROFILE',
    item: 'UID number',
    status: therapist.uidNumber ? 'COMPLETE' : 'INCOMPLETE',
    required: false,
    description: 'Austrian tax identification number',
  })

  return items
}

/**
 * Generate tax validation checklist items
 */
export function generateTaxChecklist(
  therapist: TherapistComplianceData
): ChecklistItem[] {
  return [
    {
      category: 'TAX',
      item: 'Professional tax validation',
      status: therapist.taxValidationCompleted ? 'COMPLETE' : 'INCOMPLETE',
      required: true,
      description: 'Tax calculations validated by Austrian Steuerberater',
    },
  ]
}

/**
 * Generate revenue tracking checklist items
 */
export function generateRevenueChecklist(
  therapist: TherapistComplianceData
): ChecklistItem[] {
  const hasRevenueData =
    therapist.annualGrossCents > 0 || therapist.annualGrossCachedAt !== null

  return [
    {
      category: 'REVENUE',
      item: 'Revenue tracking active',
      status: hasRevenueData ? 'COMPLETE' : 'INCOMPLETE',
      required: false,
      description: 'Annual revenue calculation for Kleinunternehmer threshold',
    },
  ]
}

/**
 * Calculate category completion scores
 */
export function calculateCategoryScores(
  checklist: ChecklistItem[]
): CategoryScores {
  const scores: CategoryScores = {
    PROFILE: 0,
    TAX: 0,
    REVENUE: 0,
  }

  const categories: ChecklistCategory[] = ['PROFILE', 'TAX', 'REVENUE']

  categories.forEach((category) => {
    const categoryItems = checklist.filter((item) => item.category === category)
    if (categoryItems.length === 0) {
      scores[category] = 100
      return
    }

    const completeItems = categoryItems.filter(
      (item) => item.status === 'COMPLETE'
    ).length

    scores[category] = Math.round((completeItems / categoryItems.length) * 100)
  })

  return scores
}

/**
 * Calculate overall compliance readiness score
 */
export function calculateComplianceScore(checklist: ChecklistItem[]): number {
  // Weighted scoring:
  // - Required items count more (weight: 2)
  // - Optional items count less (weight: 1)

  const requiredItems = checklist.filter((item) => item.required)
  const optionalItems = checklist.filter((item) => !item.required)

  const requiredComplete = requiredItems.filter(
    (item) => item.status === 'COMPLETE'
  ).length
  const optionalComplete = optionalItems.filter(
    (item) => item.status === 'COMPLETE'
  ).length

  const requiredWeight = 2
  const optionalWeight = 1

  const totalWeight =
    requiredItems.length * requiredWeight + optionalItems.length * optionalWeight
  const achievedWeight =
    requiredComplete * requiredWeight + optionalComplete * optionalWeight

  if (totalWeight === 0) return 100

  return Math.round((achievedWeight / totalWeight) * 100)
}

/**
 * Generate tax validation status message
 */
export function getTaxValidationStatus(
  therapist: TherapistComplianceData
): TaxValidationStatus {
  if (therapist.taxValidationCompleted && therapist.taxValidatedAt) {
    return {
      completed: true,
      validatedAt: therapist.taxValidatedAt.toISOString(),
      message: `Tax calculations professionally validated on ${therapist.taxValidatedAt.toLocaleDateString('de-AT')}`,
    }
  }

  return {
    completed: false,
    validatedAt: null,
    message:
      'Tax validation pending. Consider consulting an Austrian Steuerberater for professional validation.',
  }
}

/**
 * Generate alert messages based on compliance status
 */
export function generateAlerts(
  therapist: TherapistComplianceData,
  revenueStatus: RevenueStatus
): string[] {
  const alerts: string[] = []

  // Tax validation alert
  if (!therapist.taxValidationCompleted) {
    alerts.push(
      'Tax calculations have not been professionally validated. We recommend consulting an Austrian Steuerberater.'
    )
  }

  // Revenue threshold alerts
  if (revenueStatus === 'WARNING') {
    alerts.push(
      'You are approaching the Kleinunternehmer threshold (€55,000). Monitor your revenue closely.'
    )
  }

  if (revenueStatus === 'EXCEEDED') {
    alerts.push(
      'You have exceeded the Kleinunternehmer threshold. Consider consulting a tax advisor about VAT registration.'
    )
  }

  if (revenueStatus === 'CRITICAL') {
    alerts.push(
      'You have exceeded the 10% tolerance limit. All future invoices must include VAT. Consult a tax advisor immediately.'
    )
  }

  // Profile completeness alert
  const hasAllRequired = REQUIRED_PROFILE_FIELDS.every(
    (field) => therapist[field]
  )
  if (!hasAllRequired) {
    alerts.push(
      'Complete your business profile to generate professional invoices. Missing required information may cause invoice generation to fail.'
    )
  }

  return alerts
}

/**
 * Generate action items for incomplete checklist
 */
export function generateActionItems(checklist: ChecklistItem[]): string[] {
  return checklist
    .filter((item) => item.status === 'INCOMPLETE' && item.required)
    .map((item) => `${item.item}: ${item.description || 'Required for compliance'}`)
}

/**
 * Generate complete compliance checklist
 */
export function generateComplianceChecklist(
  therapist: TherapistComplianceData
): ComplianceChecklistResult {
  // Generate all checklist items
  const profileItems = generateProfileChecklist(therapist)
  const taxItems = generateTaxChecklist(therapist)
  const revenueItems = generateRevenueChecklist(therapist)

  const checklist = [...profileItems, ...taxItems, ...revenueItems]

  // Calculate scores
  const overallScore = calculateComplianceScore(checklist)
  const categoryScores = calculateCategoryScores(checklist)

  // Determine statuses
  const profileComplete = isProfileComplete(therapist)
  const taxValidation = getTaxValidationStatus(therapist)

  // Calculate revenue status
  const revenueStatusResult = calculateRevenueStatus(therapist.annualGrossCents)
  const revenueStatus = revenueStatusResult.status
  const revenuePercentage = revenueStatusResult.percentageUsed

  // Generate alerts and action items
  const alerts = generateAlerts(therapist, revenueStatus)
  const actionItems = generateActionItems(checklist)

  return {
    overallScore,
    profileComplete,
    taxValidation,
    revenueStatus,
    revenuePercentage,
    checklist,
    categoryScores,
    alerts,
    actionItems,
  }
}
