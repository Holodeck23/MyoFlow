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

/**
 * Database-compatible invoice data with Austrian compliance fields
 */
export interface DatabaseInvoiceData {
  id: string
  therapistId: string
  clientId?: string | null
  appointmentId?: string | null
  number: string
  status: 'DRAFT' | 'SENT' | 'PAID' | 'VOID'
  lines: unknown // JSON field
  totalGrossCents: number
  vatBreakdown: unknown // JSON field
  kleinunternehmer: boolean
  // New Austrian compliance fields
  performanceDate?: Date | null
  vatRate?: number | null // Decimal (e.g., 0.2000)
  netCents?: number | null
  vatCents?: number | null
  tender?: string | null
  pdfUrl?: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Processed invoice display data for Austrian compliance
 */
export interface InvoiceDisplayData {
  // Basic invoice info
  id: string
  number: string
  status: 'DRAFT' | 'SENT' | 'PAID' | 'VOID'
  
  // Dates (Austrian formatted)
  invoiceDate: string // Formatted as DD.MM.YYYY
  performanceDate?: string // Leistungsdatum, formatted as DD.MM.YYYY
  
  // Financial data (Austrian formatted)
  totalGross: string // e.g., "€ 120,00"
  totalNet?: string // e.g., "€ 100,00"  
  totalVat?: string // e.g., "€ 20,00"
  vatRatePercent?: number // e.g., 20 for 20%
  
  // Legal compliance
  isKleinunternehmer: boolean
  legalNotice?: string // KU disclaimer or therapy notice
  tender?: string // Payment method
  
  // Display flags
  showVatBreakdown: boolean
  showPerformanceDate: boolean
}

/**
 * Compute Austrian-compliant invoice display data from database record
 * Handles KU vs VAT logic correctly and formats for Austrian standards
 */
export function computeInvoiceDisplay(invoice: DatabaseInvoiceData): InvoiceDisplayData {
  // Format invoice date
  const invoiceDate = formatInvoiceDate(invoice.createdAt)
  
  // Format performance date if available
  const performanceDate = invoice.performanceDate 
    ? formatInvoiceDate(invoice.performanceDate)
    : undefined
  
  // Determine if Kleinunternehmer
  const isKleinunternehmer = invoice.kleinunternehmer
  
  // Format financial amounts
  const totalGross = formatAustrianCurrency(invoice.totalGrossCents)
  let totalNet: string | undefined
  let totalVat: string | undefined
  let vatRatePercent: number | undefined
  
  // For non-KU invoices with Austrian compliance data
  if (!isKleinunternehmer && invoice.netCents !== null && invoice.vatCents !== null && invoice.netCents !== undefined && invoice.vatCents !== undefined) {
    totalNet = formatAustrianCurrency(invoice.netCents)
    totalVat = formatAustrianCurrency(invoice.vatCents)
    
    // Convert decimal VAT rate to percentage (e.g., 0.2000 -> 20)
    if (invoice.vatRate !== null && invoice.vatRate !== undefined) {
      vatRatePercent = Math.round(invoice.vatRate * 100)
    }
  }
  
  // Generate appropriate legal notice
  let legalNotice: string | undefined
  if (isKleinunternehmer) {
    legalNotice = getKleinunternehmerNotice()
  } else {
    // For regular VAT invoices, include therapy service notice
    legalNotice = getTherapyServiceNotice()
  }
  
  return {
    id: invoice.id,
    number: invoice.number,
    status: invoice.status,
    invoiceDate,
    performanceDate,
    totalGross,
    totalNet,
    totalVat,
    vatRatePercent,
    isKleinunternehmer,
    legalNotice,
    tender: invoice.tender || undefined,
    showVatBreakdown: !isKleinunternehmer && (totalNet !== undefined && totalVat !== undefined),
    showPerformanceDate: performanceDate !== undefined
  }
}

/**
 * Validate performance date against Austrian business rules
 */
export function validatePerformanceDate(performanceDate: Date, invoiceDate: Date = new Date()): { 
  valid: boolean; 
  error?: string 
} {
  // Performance date cannot be in the future
  if (performanceDate > invoiceDate) {
    return {
      valid: false,
      error: 'Leistungsdatum darf nicht in der Zukunft liegen'
    }
  }
  
  // Performance date should not be more than 1 year in the past
  const oneYearAgo = new Date(invoiceDate)
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  
  if (performanceDate < oneYearAgo) {
    return {
      valid: false,
      error: 'Leistungsdatum sollte nicht älter als 1 Jahr sein'
    }
  }
  
  return { valid: true }
}

/**
 * Format performance date for Austrian invoice display
 * Alias for formatInvoiceDate for clarity in performance date context
 */
export function formatPerformanceDate(date: Date): string {
  return formatInvoiceDate(date)
}

/**
 * Determine appropriate VAT rate based on service type and therapist status
 * Austrian massage therapy services typically use standard 20% rate
 */
export function determineServiceVatRate(
  therapistKleinunternehmer: boolean,
  serviceCategory?: 'MASSAGE' | 'YOGA' | 'CONSULTING' | 'OTHER'
): VatRate {
  if (therapistKleinunternehmer) {
    return 'KLEINUNTERNEHMER'
  }
  
  // Austrian tax rates for different service categories
  switch (serviceCategory) {
    case 'MASSAGE':
    case 'YOGA':
    case 'OTHER':
      return 'UST_20' // Standard rate for wellness services
    case 'CONSULTING':
      return 'UST_20' // Standard rate for consulting services
    default:
      return 'UST_20' // Default to standard rate
  }
}

/**
 * Calculate Austrian invoice compliance data for database storage
 */
export function calculateInvoiceComplianceData(
  lines: InvoiceLine[],
  performanceDate: Date,
  tender?: string
): {
  performanceDate: Date
  vatRate: number | null
  netCents: number | null
  vatCents: number | null
  tender: string | null
} {
  const totals = calculateInvoiceTotals(lines)
  
  // If all lines are Kleinunternehmer, no VAT calculations needed
  const isKleinunternehmer = lines.every(line => line.vatRate === 'KLEINUNTERNEHMER')
  
  if (isKleinunternehmer) {
    return {
      performanceDate,
      vatRate: null,
      netCents: null,
      vatCents: null,
      tender: tender || null
    }
  }
  
  // For VAT invoices, determine the primary VAT rate
  const vatRates = lines.map(line => getVatRateDecimal(line.vatRate)).filter(rate => rate > 0)
  const primaryVatRate = vatRates.length > 0 ? Math.max(...vatRates) : null
  
  return {
    performanceDate,
    vatRate: primaryVatRate,
    netCents: totals.totalNetCents,
    vatCents: totals.totalVatCents,
    tender: tender || null
  }
}