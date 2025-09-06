import { formatCurrency, kleinunternehmerFooter } from '../at/receipt'

export interface Invoice {
  id: string
  number: string
  date: Date
  serviceDate: Date
  dueDate: Date
  description: string
  quantity: number
  unitPrice: number
  subtotal: number
  vatRate: number
  vatAmount: number
  total: number
  status: 'DRAFT' | 'SENT' | 'PAID' | 'VOID'
}

/**
 * Generate Austrian invoice number in YYYY-NNN format
 */
export function generateInvoiceNumber(year: number, sequenceNumber: number): string {
  return `${year}-${sequenceNumber.toString().padStart(3, '0')}`
}

/**
 * Format currency amount using Austrian locale (€80,00)
 */
export function formatEuro(amount: number): string {
  return formatCurrency(amount * 100) // Convert to cents for existing function
}

/**
 * Format date using Austrian locale (DD.MM.YYYY)
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('de-AT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date)
}

/**
 * Get Kleinunternehmer disclaimer text
 */
export function getKleinunternehmerDisclaimer(): string {
  return kleinunternehmerFooter()
}

/**
 * Calculate VAT amounts for invoice
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
 * Get next invoice number for therapist
 */
export async function getNextInvoiceNumber(therapistId: string): Promise<string> {
  // This will be implemented in the API route with database access
  // For now, return a placeholder
  const year = new Date().getFullYear()
  const sequenceNumber = 1
  return generateInvoiceNumber(year, sequenceNumber)
}

/**
 * Austrian VAT rates
 */
export const VAT_RATES = {
  KLEINUNTERNEHMER: 0,
  STANDARD: 20,
  REDUCED_10: 10,
  REDUCED_13: 13
} as const

/**
 * Validate Austrian invoice data
 */
export function validateInvoiceData(data: Partial<Invoice>): string[] {
  const errors: string[] = []
  
  if (!data.description?.trim()) {
    errors.push('Leistungsbeschreibung ist erforderlich')
  }
  
  if (!data.quantity || data.quantity <= 0) {
    errors.push('Menge muss größer als 0 sein')
  }
  
  if (!data.unitPrice || data.unitPrice <= 0) {
    errors.push('Einzelpreis muss größer als 0 sein')
  }
  
  if (!data.date) {
    errors.push('Rechnungsdatum ist erforderlich')
  }
  
  if (!data.serviceDate) {
    errors.push('Leistungsdatum ist erforderlich')
  }
  
  return errors
}