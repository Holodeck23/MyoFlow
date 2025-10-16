import { describe, expect, it, beforeEach, vi } from 'vitest'
import { buildUpgradeChecklist } from '../../app/api/settings/account/upgrade/route'

const mockTherapistFindUnique = vi.hoisted(() => vi.fn())
const mockTaxSettingsFindUnique = vi.hoisted(() => vi.fn())
const mockRequireTherapist = vi.hoisted(() => vi.fn())

vi.mock('@myoflow/db', () => ({
  prisma: {
    therapist: {
      findUnique: mockTherapistFindUnique,
    },
    taxComplianceSettings: {
      findUnique: mockTaxSettingsFindUnique,
    },
  },
}))

vi.mock('@/lib/shared-helpers', () => ({
  requireTherapist: mockRequireTherapist,
  ensureTherapistAccount: vi.fn(),
}))

describe('account upgrade checklist', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('marks items incomplete when prerequisites are missing', async () => {
    mockTherapistFindUnique.mockResolvedValue({
      businessName: '',
      businessAddress: null,
      businessEmail: '',
      businessPhone: '',
      vatStatus: 'KLEINUNTERNEHMER',
      kleinunternehmer: true,
      uidNumber: null,
      invoiceFooter: '',
      invoiceThankYouMessage: '',
      iban: null,
      invoiceLogoUrl: null,
    })
    mockTaxSettingsFindUnique.mockResolvedValue(null)

    const result = await buildUpgradeChecklist('therapist-1')

    expect(result.canUpgrade).toBe(false)
    expect(result.checklist).toHaveLength(4)
    expect(result.checklist.every((item) => item.complete)).toBe(false)
  })

  it('marks all items complete when prerequisites satisfied', async () => {
    mockTherapistFindUnique.mockResolvedValue({
      businessName: 'Praxis Müller',
      businessAddress: 'Hauptstraße 1',
      businessEmail: 'kontakt@praxis.at',
      businessPhone: '+43 660 1234567',
      vatStatus: 'UST_20',
      kleinunternehmer: false,
      uidNumber: 'ATU12345678',
      invoiceFooter: '',
      invoiceThankYouMessage: 'Vielen Dank!',
      iban: 'AT483200000012345864',
      invoiceLogoUrl: 'https://cdn.example.com/logo.png',
    })
    mockTaxSettingsFindUnique.mockResolvedValue({
      vatRegistered: true,
      kleinunternehmerActive: false,
      vatNumber: 'ATU12345678',
      taxAdvisorName: 'Mag. Steuer',
      taxAdvisorEmail: 'steuer@advisor.at',
    })

    const result = await buildUpgradeChecklist('therapist-1')

    expect(result.canUpgrade).toBe(true)
    expect(result.checklist.every((item) => item.complete)).toBe(true)
    expect(result.profileScore).toBeGreaterThanOrEqual(100)
  })
})
