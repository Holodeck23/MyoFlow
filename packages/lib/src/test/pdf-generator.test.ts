import { describe, it, expect, vi } from 'vitest'
import { generateInvoicePDF } from '../pdf-generator'
import { formatEuro, formatDate, getKleinunternehmerDisclaimer } from '../austrian-invoicing'
import puppeteer from 'puppeteer'

// Mock Puppeteer since we're testing functionality, not actual PDF creation  
vi.mock('puppeteer', () => {
  const mockPDF = vi.fn().mockResolvedValue(Buffer.from('mock-pdf-content'))
  const mockPage = {
    setContent: vi.fn(),
    pdf: mockPDF,
    close: vi.fn()
  }
  const mockBrowser = {
    newPage: vi.fn().mockResolvedValue(mockPage),
    close: vi.fn()
  }
  
  return {
    default: {
      launch: vi.fn().mockResolvedValue(mockBrowser)
    },
    __mockPage: mockPage,
    __mockBrowser: mockBrowser,
    __mockPDF: mockPDF
  }
})

describe('PDF Generator Integration', () => {
  const mockTherapist = {
    name: 'Dr. Sarah Müller',
    email: 'sarah@myoflow.at',
    phone: '+43 664 123 4567',
    address: 'Mariahilfer Straße 123',
    postalCode: '1060',
    city: 'Wien',
    country: 'Österreich',
    kleinunternehmer: true,
    vatNumber: null,
    businessRegistration: null,
    iban: 'AT611904300234573201' // Valid Bank Austria IBAN
  }

  const mockInvoice = {
    id: 'inv_123',
    number: '2024-001',
    status: 'SENT',
    totalGrossCents: 8000, // €80.00
    lines: [
      {
        description: 'Klassische Massage 60min',
        quantity: 1,
        unitPriceCents: 8000,
        vatRate: 'KLEINUNTERNEHMER' as const,
        totalCents: 8000
      }
    ],
    vatBreakdown: [
      {
        netCents: 8000,
        vatCents: 0,
        grossCents: 8000,
        vatRate: 0
      }
    ],
    kleinunternehmer: true,
    createdAt: new Date('2024-03-15T10:00:00Z'),
    Client: {
      id: 'client_123',
      name: 'Maria Schmidt',
      email: 'maria@example.com',
      phone: '+43 699 987 6543',
      street: 'Kärtner Straße 45',
      postalCode: '1010',
      city: 'Wien',
      country: 'Österreich',
      tags: [],
      createdAt: new Date('2024-01-01T00:00:00Z'),
      therapistId: 'therapist_123',
      healthFlagsEnc: null,
      updatedAt: new Date('2024-03-15T10:00:00Z')
    },
    Appointment: {
      id: 'apt_123',
      start: new Date('2024-03-15T10:00:00Z'),
      Service: {
        id: 'service_123',
        name: 'Klassische Massage',
        durationMin: 60,
        category: 'MASSAGE',
        priceCents: 8000,
        therapistId: 'therapist_123',
        vatRate: 'KLEINUNTERNEHMER',
        active: true
      }
    }
  }

  describe('PDF Generation Functionality', () => {
    it('should generate PDF buffer for valid invoice', async () => {
      const result = await generateInvoicePDF(mockInvoice, mockTherapist)
      
      expect(result).toBeInstanceOf(Buffer)
      expect(puppeteer.launch).toHaveBeenCalled()
    })

    it('should call Puppeteer with correct launch options', async () => {
      await generateInvoicePDF(mockInvoice, mockTherapist)
      
      expect(puppeteer.launch).toHaveBeenCalledWith({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })
    })
  })

  describe('Austrian Formatting Helper Functions', () => {
    it('should format Euro currency correctly', () => {
      expect(formatEuro(80.00)).toContain('80')
      expect(formatEuro(80.00)).toContain(',00')
      expect(formatEuro(123.45)).toContain('123')
      expect(formatEuro(123.45)).toContain(',45')
    })

    it('should format dates in Austrian format', () => {
      const testDate = new Date('2024-03-15T10:00:00Z')
      const formatted = formatDate(testDate)
      expect(formatted).toMatch(/^\d{2}\.\d{2}\.\d{4}$/)
    })

    it('should provide Kleinunternehmer disclaimer', () => {
      const disclaimer = getKleinunternehmerDisclaimer()
      expect(disclaimer).toContain('Kein Ausweis der Umsatzsteuer')
      expect(disclaimer).toContain('§ 6 Abs. 1 Z 27 UStG')
    })
  })

})