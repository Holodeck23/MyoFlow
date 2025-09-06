/**
 * Austrian Invoice Generation Utilities
 * Compliant with Austrian tax law and business requirements
 */

export interface InvoiceLine {
  description: string
  quantity: number
  unitPriceCents: number
  vatRate: VatRate
  totalCents: number
}

export interface VATBreakdown {
  netCents: number
  vatCents: number
  grossCents: number
  vatRate: number
}

export type VatRate = 'KLEINUNTERNEHMER' | 'UST_10' | 'UST_13' | 'UST_20'

export interface AustrianInvoiceData {
  // Invoice metadata
  number: string
  date: Date
  serviceDate?: Date
  
  // Business information
  therapist: {
    name: string
    address: string
    uid?: string // Austrian tax number
    kleinunternehmer: boolean
  }
  
  // Client information  
  client: {
    name: string
    email?: string
    address?: string
  }
  
  // Invoice lines and totals
  lines: InvoiceLine[]
  totalNetCents: number
  totalVatCents: number
  totalGrossCents: number
  vatBreakdown: VATBreakdown[]
  
  // Legal compliance
  kleinunternehmer: boolean
  legalNotice?: string
}

/**
 * Generate Austrian-compliant invoice number
 * Format: YYYY-NNN (e.g., 2024-001)
 */
export function generateInvoiceNumber(year: number, sequenceNumber: number): string {
  return `${year}-${sequenceNumber.toString().padStart(3, '0')}`
}

/**
 * Get VAT rate as decimal (e.g., 0.20 for 20%)
 */
export function getVatRateDecimal(vatRate: VatRate): number {
  switch (vatRate) {
    case 'KLEINUNTERNEHMER':
      return 0
    case 'UST_10':
      return 0.10
    case 'UST_13':
      return 0.13
    case 'UST_20':
      return 0.20
    default:
      return 0
  }
}

/**
 * Calculate VAT breakdown for invoice lines
 */
export function calculateVatBreakdown(lines: InvoiceLine[]): VATBreakdown[] {
  const vatGroups = new Map<number, { netCents: number; vatCents: number }>()
  
  lines.forEach(line => {
    const vatRate = getVatRateDecimal(line.vatRate)
    const netAmount = Math.round(line.totalCents / (1 + vatRate))
    const vatAmount = line.totalCents - netAmount
    
    const existing = vatGroups.get(vatRate) || { netCents: 0, vatCents: 0 }
    vatGroups.set(vatRate, {
      netCents: existing.netCents + netAmount,
      vatCents: existing.vatCents + vatAmount
    })
  })
  
  return Array.from(vatGroups.entries()).map(([vatRate, amounts]) => ({
    netCents: amounts.netCents,
    vatCents: amounts.vatCents,
    grossCents: amounts.netCents + amounts.vatCents,
    vatRate: vatRate * 100 // Convert to percentage
  }))
}

/**
 * Get Austrian Kleinunternehmer legal notice
 */
export function getKleinunternehmerNotice(): string {
  return "Kein Ausweis der Umsatzsteuer nach § 6 Abs. 1 Z 27 UStG"
}

/**
 * Alias for getKleinunternehmerNotice (for compatibility)
 */
export function getKleinunternehmerDisclaimer(): string {
  return getKleinunternehmerNotice()
}

/**
 * Get standard Austrian therapy service legal notice
 */
export function getTherapyServiceNotice(): string {
  return "Dienstleistungen im Bereich der Gesundheitsförderung und Entspannung. " +
         "Kein Heilversprechen. Bei gesundheitlichen Beschwerden konsultieren Sie einen Arzt."
}

/**
 * Format Austrian currency
 */
export function formatAustrianCurrency(cents: number): string {
  return new Intl.NumberFormat('de-AT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(cents / 100)
}

/**
 * Format currency amount using Austrian locale (€80,00) - compatibility alias
 */
export function formatEuro(amount: number): string {
  return formatAustrianCurrency(amount * 100) // Convert euros to cents
}

/**
 * Format Austrian date for invoices
 */
export function formatInvoiceDate(date: Date): string {
  return date.toLocaleDateString('de-AT', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric'
  })
}

/**
 * Format date using Austrian locale (DD.MM.YYYY) - compatibility alias
 */
export function formatDate(date: Date): string {
  return formatInvoiceDate(date)
}

/**
 * Calculate invoice totals from lines
 */
export function calculateInvoiceTotals(lines: InvoiceLine[]) {
  const totalGrossCents = lines.reduce((sum, line) => sum + line.totalCents, 0)
  const vatBreakdown = calculateVatBreakdown(lines)
  const totalNetCents = vatBreakdown.reduce((sum, vat) => sum + vat.netCents, 0)
  const totalVatCents = vatBreakdown.reduce((sum, vat) => sum + vat.vatCents, 0)
  
  return {
    totalNetCents,
    totalVatCents, 
    totalGrossCents,
    vatBreakdown
  }
}

/**
 * Create invoice line from appointment service
 */
export function createInvoiceLineFromService(
  serviceName: string,
  priceCents: number,
  vatRate: VatRate,
  quantity: number = 1
): InvoiceLine {
  const totalCents = priceCents * quantity
  
  return {
    description: serviceName,
    quantity,
    unitPriceCents: priceCents,
    vatRate,
    totalCents
  }
}

/**
 * Validate Austrian invoice data
 */
export function validateInvoiceData(invoice: AustrianInvoiceData): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Required fields
  if (!invoice.number) errors.push('Invoice number is required')
  if (!invoice.date) errors.push('Invoice date is required')
  if (!invoice.therapist.name) errors.push('Therapist name is required')
  if (!invoice.client.name) errors.push('Client name is required')
  if (!invoice.lines.length) errors.push('At least one invoice line is required')
  
  // Invoice number format
  if (invoice.number && !/^\d{4}-\d{3}$/.test(invoice.number)) {
    errors.push('Invoice number must be in format YYYY-NNN')
  }
  
  // VAT consistency
  if (invoice.kleinunternehmer) {
    const hasVat = invoice.lines.some(line => line.vatRate !== 'KLEINUNTERNEHMER')
    if (hasVat) {
      errors.push('Kleinunternehmer invoices cannot include VAT')
    }
  }
  
  // Totals consistency
  const calculated = calculateInvoiceTotals(invoice.lines)
  if (calculated.totalGrossCents !== invoice.totalGrossCents) {
    errors.push('Invoice total does not match calculated total')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Austrian VAT rates constants
 */
export const VAT_RATES = {
  KLEINUNTERNEHMER: 0,
  STANDARD: 20,
  REDUCED_10: 10,
  REDUCED_13: 13
} as const

/**
 * Calculate VAT amounts for invoice (simplified version)
 */
export function calculateVAT(subtotal: number, vatRate: number): {
  vatAmount: number
  total: number
} {
  const vatAmount = Math.round(subtotal * vatRate) / 100
  const total = subtotal + vatAmount
  
  return { vatAmount, total }
}

/**
 * Get next invoice number for therapist (placeholder for API implementation)
 */
export async function getNextInvoiceNumber(therapistId: string): Promise<string> {
  // This will be implemented in the API route with database access
  const year = new Date().getFullYear()
  const sequenceNumber = 1
  return generateInvoiceNumber(year, sequenceNumber)
}