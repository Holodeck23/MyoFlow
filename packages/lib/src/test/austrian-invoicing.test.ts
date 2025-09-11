import { describe, it, expect, beforeEach } from 'vitest'
import {
  generateInvoiceNumber,
  createInvoiceLineFromService,
  calculateInvoiceTotals,
  formatAustrianCurrency,
  formatInvoiceDate,
  getKleinunternehmerNotice,
  getTherapyServiceNotice,
  validateInvoiceData,
  getVatRateDecimal,
  calculateVatBreakdown,
  calculateVAT,
  VAT_RATES,
  // New functions
  computeInvoiceDisplay,
  validatePerformanceDate,
  formatPerformanceDate,
  determineServiceVatRate,
  calculateInvoiceComplianceData,
  type InvoiceLine,
  type AustrianInvoiceData,
  type VatRate,
  type DatabaseInvoiceData,
  type InvoiceDisplayData
} from '../austrian-invoicing'

describe('Austrian Invoice System', () => {
  describe('Invoice Number Generation', () => {
    it('should generate correct format YYYY-NNN', () => {
      expect(generateInvoiceNumber(2024, 1)).toBe('2024-001')
      expect(generateInvoiceNumber(2024, 52)).toBe('2024-052')  
      expect(generateInvoiceNumber(2025, 123)).toBe('2025-123')
    })

    it('should pad sequence numbers with leading zeros', () => {
      expect(generateInvoiceNumber(2024, 1)).toBe('2024-001')
      expect(generateInvoiceNumber(2024, 10)).toBe('2024-010')
      expect(generateInvoiceNumber(2024, 100)).toBe('2024-100')
    })

    it('should handle large sequence numbers', () => {
      expect(generateInvoiceNumber(2024, 9999)).toBe('2024-9999')
    })
  })

  describe('VAT Rate Calculations', () => {
    it('should return correct VAT rates as decimals', () => {
      expect(getVatRateDecimal('KLEINUNTERNEHMER')).toBe(0)
      expect(getVatRateDecimal('UST_10')).toBe(0.10)
      expect(getVatRateDecimal('UST_13')).toBe(0.13)
      expect(getVatRateDecimal('UST_20')).toBe(0.20)
    })

    it('should have correct VAT constants', () => {
      expect(VAT_RATES.KLEINUNTERNEHMER).toBe(0)
      expect(VAT_RATES.STANDARD).toBe(20)
      expect(VAT_RATES.REDUCED_10).toBe(10)
      expect(VAT_RATES.REDUCED_13).toBe(13)
    })

    it('should calculate VAT amounts correctly', () => {
      // 20% VAT on €100
      const result20 = calculateVAT(10000, 0.20) // 10000 cents = €100
      expect(result20.vatAmount).toBe(20) // €20
      expect(result20.total).toBe(10020) // €100.20

      // 10% VAT on €50
      const result10 = calculateVAT(5000, 0.10)
      expect(result10.vatAmount).toBe(5) // €5
      expect(result10.total).toBe(5005) // €50.05
    })
  })

  describe('Invoice Line Creation', () => {
    it('should create Kleinunternehmer service line correctly', () => {
      const line = createInvoiceLineFromService('Klassische Massage', 8000, 'KLEINUNTERNEHMER')
      
      expect(line).toEqual({
        description: 'Klassische Massage',
        quantity: 1,
        unitPriceCents: 8000,
        vatRate: 'KLEINUNTERNEHMER',
        totalCents: 8000
      })
    })

    it('should create regular VAT service line correctly', () => {
      const line = createInvoiceLineFromService('Beratungsgespräch', 5000, 'UST_20', 2)
      
      expect(line).toEqual({
        description: 'Beratungsgespräch',
        quantity: 2,
        unitPriceCents: 5000,
        vatRate: 'UST_20',
        totalCents: 10000 // 5000 * 2
      })
    })

    it('should handle different quantities', () => {
      const line = createInvoiceLineFromService('Massage 30min', 4000, 'UST_20', 3)
      expect(line.totalCents).toBe(12000) // 4000 * 3
      expect(line.quantity).toBe(3)
    })
  })

  describe('VAT Breakdown Calculation', () => {
    it('should calculate correct VAT breakdown for Kleinunternehmer', () => {
      const lines: InvoiceLine[] = [
        createInvoiceLineFromService('Massage 60min', 8000, 'KLEINUNTERNEHMER'),
        createInvoiceLineFromService('Massage 45min', 6500, 'KLEINUNTERNEHMER')
      ]

      const breakdown = calculateVatBreakdown(lines)
      expect(breakdown).toHaveLength(1)
      expect(breakdown[0]).toEqual({
        netCents: 14500,
        vatCents: 0,
        grossCents: 14500,
        vatRate: 0
      })
    })

    it('should calculate correct VAT breakdown for 20% VAT', () => {
      const lines: InvoiceLine[] = [
        createInvoiceLineFromService('Massage 60min', 9600, 'UST_20'), // €96 gross = €80 net + €16 VAT
        createInvoiceLineFromService('Beratung 30min', 6000, 'UST_20')  // €60 gross = €50 net + €10 VAT
      ]

      const breakdown = calculateVatBreakdown(lines)
      expect(breakdown).toHaveLength(1)
      
      // Should have 20% VAT rate
      const vat20 = breakdown.find(b => b.vatRate === 20)
      expect(vat20).toBeDefined()
      expect(vat20!.netCents).toBe(13000) // €130 net
      expect(vat20!.vatCents).toBe(2600)  // €26 VAT  
      expect(vat20!.grossCents).toBe(15600) // €156 gross
    })

    it('should handle mixed VAT rates correctly', () => {
      const lines: InvoiceLine[] = [
        createInvoiceLineFromService('Service 20%', 12000, 'UST_20'), // €120 gross
        createInvoiceLineFromService('Service 10%', 5500, 'UST_10'),  // €55 gross
        createInvoiceLineFromService('KU Service', 3000, 'KLEINUNTERNEHMER') // €30 gross
      ]

      const breakdown = calculateVatBreakdown(lines)
      expect(breakdown).toHaveLength(3) // Three different VAT rates
      
      const rates = breakdown.map(b => b.vatRate).sort()
      expect(rates).toEqual([0, 10, 20])
    })
  })

  describe('Invoice Totals Calculation', () => {
    it('should calculate Kleinunternehmer totals correctly', () => {
      const lines: InvoiceLine[] = [
        createInvoiceLineFromService('Massage 60min', 8000, 'KLEINUNTERNEHMER'),
        createInvoiceLineFromService('Massage 45min', 6500, 'KLEINUNTERNEHMER')
      ]

      const totals = calculateInvoiceTotals(lines)
      expect(totals.totalNetCents).toBe(14500)
      expect(totals.totalVatCents).toBe(0)
      expect(totals.totalGrossCents).toBe(14500)
      expect(totals.vatBreakdown).toHaveLength(1)
    })

    it('should calculate regular VAT totals correctly', () => {
      const lines: InvoiceLine[] = [
        createInvoiceLineFromService('Massage 60min', 9600, 'UST_20'),
        createInvoiceLineFromService('Beratung 30min', 6000, 'UST_20')
      ]

      const totals = calculateInvoiceTotals(lines)
      expect(totals.totalGrossCents).toBe(15600) // €156
      expect(totals.totalNetCents).toBe(13000)   // €130 net
      expect(totals.totalVatCents).toBe(2600)    // €26 VAT
    })
  })

  describe('Austrian Formatting', () => {
    it('should format Austrian currency correctly', () => {
      // The exact format may vary by locale, but should be Austrian format
      expect(formatAustrianCurrency(8000)).toContain('80')
      expect(formatAustrianCurrency(8000)).toContain(',00')
      expect(formatAustrianCurrency(8000)).toMatch(/€.*80.*,00/)
      
      expect(formatAustrianCurrency(12345)).toContain('123')
      expect(formatAustrianCurrency(12345)).toContain(',45')
    })

    it('should format Austrian dates correctly', () => {
      const testDate = new Date('2024-03-15T10:00:00Z')
      const formatted = formatInvoiceDate(testDate)
      // Should be in DD.MM.YYYY format for Austrian locale
      expect(formatted).toMatch(/^\d{2}\.\d{2}\.\d{4}$/)
    })
  })

  describe('Legal Notices', () => {
    it('should provide correct Kleinunternehmer notice', () => {
      const notice = getKleinunternehmerNotice()
      expect(notice).toBe('Kein Ausweis der Umsatzsteuer nach § 6 Abs. 1 Z 27 UStG')
    })

    it('should provide therapy service notice', () => {
      const notice = getTherapyServiceNotice()
      expect(notice).toContain('Dienstleistungen im Bereich der Gesundheitsförderung')
      expect(notice).toContain('Kein Heilversprechen')
    })
  })

  describe('Invoice Validation', () => {
    let validInvoice: AustrianInvoiceData

    beforeEach(() => {
      const lines = [
        createInvoiceLineFromService('Massage', 8000, 'KLEINUNTERNEHMER')
      ]
      const totals = calculateInvoiceTotals(lines)

      validInvoice = {
        number: '2024-001',
        date: new Date(),
        therapist: {
          name: 'Dr. Sarah Müller',
          address: 'Mariahilfer Straße 123, 1060 Wien',
          kleinunternehmer: true
        },
        client: {
          name: 'Maria Schmidt',
          email: 'maria@example.com'
        },
        lines: lines,
        totalNetCents: totals.totalNetCents,
        totalVatCents: totals.totalVatCents,
        totalGrossCents: totals.totalGrossCents,
        vatBreakdown: totals.vatBreakdown,
        kleinunternehmer: true
      }
    })

    it('should validate correct invoice', () => {
      const result = validateInvoiceData(validInvoice)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invoice without number', () => {
      validInvoice.number = ''
      const result = validateInvoiceData(validInvoice)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Invoice number is required')
    })

    it('should reject invalid invoice number format', () => {
      validInvoice.number = '2024-1' // Should be 2024-001
      const result = validateInvoiceData(validInvoice)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Invoice number must be in format YYYY-NNN')
    })

    it('should reject Kleinunternehmer invoice with VAT', () => {
      validInvoice.lines = [
        createInvoiceLineFromService('Service', 8000, 'UST_20')
      ]
      const result = validateInvoiceData(validInvoice)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Kleinunternehmer invoices cannot include VAT')
    })

    it('should reject invoice with mismatched totals', () => {
      validInvoice.totalGrossCents = 99999 // Wrong total
      const result = validateInvoiceData(validInvoice)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Invoice total does not match calculated total')
    })
  })

  describe('Austrian Business Logic Edge Cases', () => {
    it('should handle zero amounts correctly', () => {
      const line = createInvoiceLineFromService('Free consultation', 0, 'KLEINUNTERNEHMER')
      expect(line.totalCents).toBe(0)
      expect(line.unitPriceCents).toBe(0)
    })

    it('should handle large amounts correctly', () => {
      const line = createInvoiceLineFromService('Premium service', 50000, 'UST_20') // €500
      expect(line.totalCents).toBe(50000)
      
      const breakdown = calculateVatBreakdown([line])
      expect(breakdown[0].grossCents).toBe(50000)
      expect(breakdown[0].netCents).toBeCloseTo(41667) // €500 / 1.20
      expect(breakdown[0].vatCents).toBeCloseTo(8333)  // €500 - €416.67
    })

    it('should handle rounding correctly for VAT calculations', () => {
      // Test case that might cause rounding issues
      const line = createInvoiceLineFromService('Service', 3333, 'UST_20') // €33.33
      const breakdown = calculateVatBreakdown([line])
      
      // Total should always equal net + VAT
      const vat = breakdown[0]
      expect(vat.grossCents).toBe(vat.netCents + vat.vatCents)
    })
  })

  describe('Database Invoice Display (computeInvoiceDisplay)', () => {
    let kuInvoice: DatabaseInvoiceData
    let vatInvoice: DatabaseInvoiceData

    beforeEach(() => {
      const baseDate = new Date('2024-03-15T10:00:00Z')
      const performanceDate = new Date('2024-03-14T14:30:00Z')

      kuInvoice = {
        id: 'inv_ku_123',
        therapistId: 'therapist_1',
        clientId: 'client_1',
        appointmentId: 'apt_1',
        number: '2024-001',
        status: 'PAID',
        lines: [{ description: 'Massage', totalCents: 8000 }],
        totalGrossCents: 8000,
        vatBreakdown: [],
        kleinunternehmer: true,
        performanceDate,
        vatRate: null,
        netCents: null,
        vatCents: null,
        tender: 'Barzahlung',
        pdfUrl: null,
        createdAt: baseDate,
        updatedAt: baseDate
      }

      vatInvoice = {
        id: 'inv_vat_123',
        therapistId: 'therapist_2', 
        clientId: 'client_2',
        appointmentId: 'apt_2',
        number: '2024-002',
        status: 'SENT',
        lines: [{ description: 'Beratung', totalCents: 12000 }],
        totalGrossCents: 12000,
        vatBreakdown: [{ vatRate: 20, netCents: 10000, vatCents: 2000 }],
        kleinunternehmer: false,
        performanceDate,
        vatRate: 0.2,
        netCents: 10000,
        vatCents: 2000,
        tender: 'Überweisung',
        pdfUrl: null,
        createdAt: baseDate,
        updatedAt: baseDate
      }
    })

    it('should format Kleinunternehmer invoice display correctly', () => {
      const display = computeInvoiceDisplay(kuInvoice)

      expect(display.id).toBe('inv_ku_123')
      expect(display.number).toBe('2024-001')
      expect(display.status).toBe('PAID')
      expect(display.invoiceDate).toBe('15.03.2024')
      expect(display.performanceDate).toBe('14.03.2024')
      expect(display.totalGross).toContain('80,00')
      expect(display.totalNet).toBeUndefined()
      expect(display.totalVat).toBeUndefined()
      expect(display.vatRatePercent).toBeUndefined()
      expect(display.isKleinunternehmer).toBe(true)
      expect(display.legalNotice).toBe('Kein Ausweis der Umsatzsteuer nach § 6 Abs. 1 Z 27 UStG')
      expect(display.tender).toBe('Barzahlung')
      expect(display.showVatBreakdown).toBe(false)
      expect(display.showPerformanceDate).toBe(true)
    })

    it('should format VAT invoice display correctly', () => {
      const display = computeInvoiceDisplay(vatInvoice)

      expect(display.id).toBe('inv_vat_123')
      expect(display.number).toBe('2024-002')
      expect(display.status).toBe('SENT')
      expect(display.invoiceDate).toBe('15.03.2024')
      expect(display.performanceDate).toBe('14.03.2024')
      expect(display.totalGross).toContain('120,00')
      expect(display.totalNet).toContain('100,00')
      expect(display.totalVat).toContain('20,00')
      expect(display.vatRatePercent).toBe(20)
      expect(display.isKleinunternehmer).toBe(false)
      expect(display.legalNotice).toContain('Dienstleistungen im Bereich der Gesundheitsförderung')
      expect(display.tender).toBe('Überweisung')
      expect(display.showVatBreakdown).toBe(true)
      expect(display.showPerformanceDate).toBe(true)
    })

    it('should handle missing performance date', () => {
      kuInvoice.performanceDate = null
      const display = computeInvoiceDisplay(kuInvoice)

      expect(display.performanceDate).toBeUndefined()
      expect(display.showPerformanceDate).toBe(false)
    })

    it('should handle missing Austrian compliance data for VAT invoice', () => {
      vatInvoice.netCents = null
      vatInvoice.vatCents = null
      vatInvoice.vatRate = null
      
      const display = computeInvoiceDisplay(vatInvoice)

      expect(display.totalNet).toBeUndefined()
      expect(display.totalVat).toBeUndefined()
      expect(display.vatRatePercent).toBeUndefined()
      expect(display.showVatBreakdown).toBe(false)
    })
  })

  describe('Performance Date Validation', () => {
    it('should accept valid performance date', () => {
      const performanceDate = new Date('2024-03-14T14:30:00Z')
      const invoiceDate = new Date('2024-03-15T10:00:00Z')
      
      const result = validatePerformanceDate(performanceDate, invoiceDate)
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject future performance date', () => {
      const performanceDate = new Date('2024-03-16T14:30:00Z') // Future
      const invoiceDate = new Date('2024-03-15T10:00:00Z')
      
      const result = validatePerformanceDate(performanceDate, invoiceDate)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Leistungsdatum darf nicht in der Zukunft liegen')
    })

    it('should warn about very old performance date', () => {
      const performanceDate = new Date('2022-01-01T14:30:00Z') // > 1 year ago
      const invoiceDate = new Date('2024-03-15T10:00:00Z')
      
      const result = validatePerformanceDate(performanceDate, invoiceDate)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Leistungsdatum sollte nicht älter als 1 Jahr sein')
    })

    it('should accept performance date exactly 1 year ago', () => {
      const performanceDate = new Date('2023-03-15T14:30:00Z') // Exactly 1 year
      const invoiceDate = new Date('2024-03-15T10:00:00Z')
      
      const result = validatePerformanceDate(performanceDate, invoiceDate)
      expect(result.valid).toBe(true)
    })
  })

  describe('Service VAT Rate Determination', () => {
    it('should return KLEINUNTERNEHMER for KU therapist', () => {
      expect(determineServiceVatRate(true, 'MASSAGE')).toBe('KLEINUNTERNEHMER')
      expect(determineServiceVatRate(true, 'CONSULTING')).toBe('KLEINUNTERNEHMER')
      expect(determineServiceVatRate(true, 'OTHER')).toBe('KLEINUNTERNEHMER')
    })

    it('should return UST_20 for regular therapist services', () => {
      expect(determineServiceVatRate(false, 'MASSAGE')).toBe('UST_20')
      expect(determineServiceVatRate(false, 'YOGA')).toBe('UST_20')
      expect(determineServiceVatRate(false, 'CONSULTING')).toBe('UST_20')
      expect(determineServiceVatRate(false, 'OTHER')).toBe('UST_20')
    })

    it('should default to UST_20 for unknown categories', () => {
      expect(determineServiceVatRate(false)).toBe('UST_20')
    })
  })

  describe('Invoice Compliance Data Calculation', () => {
    const performanceDate = new Date('2024-03-14T14:30:00Z')

    it('should calculate KU compliance data correctly', () => {
      const lines = [
        createInvoiceLineFromService('Massage', 8000, 'KLEINUNTERNEHMER')
      ]
      
      const compliance = calculateInvoiceComplianceData(lines, performanceDate, 'Barzahlung')
      
      expect(compliance.performanceDate).toEqual(performanceDate)
      expect(compliance.vatRate).toBeNull()
      expect(compliance.netCents).toBeNull()
      expect(compliance.vatCents).toBeNull()
      expect(compliance.tender).toBe('Barzahlung')
    })

    it('should calculate VAT compliance data correctly', () => {
      const lines = [
        createInvoiceLineFromService('Beratung', 12000, 'UST_20') // €120 gross = €100 net + €20 VAT
      ]
      
      const compliance = calculateInvoiceComplianceData(lines, performanceDate, 'Überweisung')
      
      expect(compliance.performanceDate).toEqual(performanceDate)
      expect(compliance.vatRate).toBe(0.2)
      expect(compliance.netCents).toBe(10000) // €100
      expect(compliance.vatCents).toBe(2000)  // €20
      expect(compliance.tender).toBe('Überweisung')
    })

    it('should handle mixed VAT rates correctly', () => {
      const lines = [
        createInvoiceLineFromService('Service 20%', 12000, 'UST_20'),
        createInvoiceLineFromService('Service 10%', 5500, 'UST_10')
      ]
      
      const compliance = calculateInvoiceComplianceData(lines, performanceDate)
      
      expect(compliance.vatRate).toBe(0.2) // Should pick highest rate
      expect(compliance.tender).toBeNull()
    })

    it('should handle missing tender', () => {
      const lines = [createInvoiceLineFromService('Service', 8000, 'KLEINUNTERNEHMER')]
      const compliance = calculateInvoiceComplianceData(lines, performanceDate)
      
      expect(compliance.tender).toBeNull()
    })
  })

  describe('Performance Date Formatting', () => {
    it('should format performance date using Austrian locale', () => {
      const date = new Date('2024-03-14T14:30:00Z')
      const formatted = formatPerformanceDate(date)
      
      expect(formatted).toMatch(/^\d{2}\.\d{2}\.\d{4}$/)
      expect(formatted).toBe('14.03.2024')
    })
  })
})