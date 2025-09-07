import { describe, expect, it } from 'vitest'
import {
  generateInvoiceNumber,
  createInvoiceLineFromService,
  calculateInvoiceTotals,
  formatInvoiceDate,
  validateInvoiceData
} from '../src/austrian-invoicing'

describe('Austrian Invoicing', () => {
  it('generates sequential invoice numbers', () => {
    expect(generateInvoiceNumber(2024, 1)).toBe('2024-001')
    expect(generateInvoiceNumber(2024, 52)).toBe('2024-052')
  })

  it('creates invoice lines and calculates totals', () => {
    const line1 = createInvoiceLineFromService('Massage', 8000, 'KLEINUNTERNEHMER')
    const line2 = createInvoiceLineFromService('Consulting', 5000, 'UST_20', 2)
    const totals = calculateInvoiceTotals([line1, line2])
    expect(totals.totalGrossCents).toBe(8000 + 5000 * 2)
    expect(totals.vatBreakdown.find(v => v.vatRate === 20)?.vatCents).toBeGreaterThan(0)
  })

  it('formats invoice dates', () => {
    expect(formatInvoiceDate(new Date('2024-01-05'))).toBe('05.01.2024')
  })

  it('validates invoice data', () => {
    const line = createInvoiceLineFromService('Massage', 8000, 'KLEINUNTERNEHMER')
    const totals = calculateInvoiceTotals([line])
    const invoice = {
      number: '2024-001',
      date: new Date('2024-01-01'),
      therapist: { name: 'Therapist', address: 'Street', kleinunternehmer: true },
      client: { name: 'Client' },
      lines: [line],
      ...totals,
      kleinunternehmer: true
    }
    const result = validateInvoiceData(invoice)
    expect(result.valid).toBe(true)
  })
})
