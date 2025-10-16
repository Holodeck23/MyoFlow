import type { Prisma } from '@prisma/client'

type TherapistWithOptional = Prisma.TherapistGetPayload<{
  select: {
    businessName: true
    businessAddress: true
    businessEmail: true
    businessPhone: true
    vatStatus: true
    kleinunternehmer: true
    uidNumber: true
    invoiceFooter: true
    invoiceThankYouMessage: true
    iban: true
  }
}> &
  Record<string, unknown>

type TaxSettingsLike = {
  kleinunternehmerActive?: boolean | null
  vatRegistered?: boolean | null
  vatNumber?: string | null
  taxAdvisorName?: string | null
  taxAdvisorEmail?: string | null
}

export interface ProfileCompletionSummary {
  score: number
  totalItems: number
  completedItems: number
  missingItems: Array<{
    category: 'profile' | 'compliance' | string
    item: string
    priority: 'high' | 'medium'
  }>
}

/**
 * Shared profile completion calculation used across overview endpoints and upgrade flow.
 */
export function calculateProfileCompletion(
  therapist: TherapistWithOptional | null | undefined,
  taxSettings?: TaxSettingsLike | null
): ProfileCompletionSummary {
  if (!therapist) {
    return {
      score: 0,
      totalItems: 0,
      completedItems: 0,
      missingItems: [],
    }
  }

  const isKleinunternehmer = Boolean(
    taxSettings?.kleinunternehmerActive ??
      therapist.kleinunternehmer ??
      (therapist as any)?.vatStatus === 'KLEINUNTERNEHMER'
  )

  const requiredFields: Array<[string, string, (t: any, ts?: any) => boolean]> = [
    ['businessName', 'Business name', (t) => !!t?.businessName && t.businessName.trim().length > 0],
    ['businessAddress', 'Business address', (t) => !!t?.businessAddress && t.businessAddress.trim().length > 0],
    ['businessEmail', 'Business email', (t) => !!t?.businessEmail && t.businessEmail.trim().length > 0],
    ['businessPhone', 'Business phone', (t) => !!t?.businessPhone && t.businessPhone.trim().length > 0],
  ]

  if (!isKleinunternehmer) {
    requiredFields.push([
      'uidNumber',
      'Austrian VAT/UID',
      (t) => !!t?.uidNumber && typeof t.uidNumber === 'string' && t.uidNumber.trim().length > 0,
    ])
  }

  const importantFields: Array<[string, string, (t: any, ts?: any) => boolean]> = [
    [
      'iban',
      'Austrian IBAN',
      (t) => !!t?.iban && t.iban.trim().length > 0,
    ],
    [
      'invoiceFooter',
      'Invoice thank you message',
      (t) => {
        const footer = t?.invoiceFooter
        const thanks = t?.invoiceThankYouMessage
        const value =
          typeof footer === 'string' && footer.trim().length > 0
            ? footer
            : typeof thanks === 'string' && thanks.trim().length > 0
            ? thanks
            : ''
        return value.length > 0
      },
    ],
    [
      'taxAdvisorName',
      'Tax advisor contact',
      (_t, ts) => !!(ts?.taxAdvisorName && ts.taxAdvisorName.trim().length > 0),
    ],
    [
      'taxAdvisorEmail',
      'Tax advisor email',
      (_t, ts) => !!(ts?.taxAdvisorEmail && ts.taxAdvisorEmail.trim().length > 0),
    ],
  ]

  const completedRequired = requiredFields.filter(([_field, _label, predicate]) => {
    try {
      return predicate(therapist, taxSettings)
    } catch {
      return false
    }
  })

  const completedImportant = importantFields.filter(([_field, _label, predicate]) => {
    try {
      return predicate(therapist, taxSettings)
    } catch {
      return false
    }
  })

  const missingRequired = requiredFields
    .filter(([field]) => !completedRequired.find(([completedField]) => completedField === field))
    .map(([_field, label]) => ({ category: 'profile' as const, item: label, priority: 'high' as const }))

  const missingImportant = importantFields
    .filter(([field]) => !completedImportant.find(([completedField]) => completedField === field))
    .map(([_field, label]) => ({ category: 'profile' as const, item: label, priority: 'medium' as const }))

  const totalItems = requiredFields.length + importantFields.length
  const completedItems = completedRequired.length + completedImportant.length

  return {
    score: totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100),
    totalItems,
    completedItems,
    missingItems: [...missingRequired, ...missingImportant],
  }
}
