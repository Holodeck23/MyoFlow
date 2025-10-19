import { format } from 'date-fns'
import { de } from 'date-fns/locale'

export type InvoiceExportStatus = 'DRAFT' | 'SENT' | 'PAID' | 'VOID' | 'OVERDUE'

export interface InvoicePaymentForExport {
  status: string
  paidAt?: Date | string | null
}

export interface InvoiceForExport {
  id: string
  number: string
  createdAt: Date
  clientName: string
  clientAddress?: string
  totalGrossCents: number
  status: InvoiceExportStatus
  isKleinunternehmer: boolean
  lines: any
  vatBreakdown: any
  payments?: InvoicePaymentForExport[]
}

export interface BMDExportOptions {
  separator?: string
  encoding?: string
  includeHeader?: boolean
  accountCode?: string
  taxCode?: string
}

export interface RZLExportOptions {
  separator?: string
  encoding?: string
  includeHeader?: boolean
}

export interface DATEVExportOptions {
  separator?: string
  encoding?: string
  includeHeader?: boolean
  consultantNumber?: string
  clientNumber?: string
}

export interface GenericCSVExportOptions {
  separator?: ',' | ';'
  encoding?: string
  includeHeader?: boolean
  dateFormat?: 'dd.MM.yyyy' | 'yyyy-MM-dd'
  language?: 'de' | 'en'
}

export interface ValidationResult {
  errors: string[]
  warnings: string[]
}

/**
 * Export invoices to BMD format (Austrian accounting software).
 */
export function exportToBMD(
  invoices: InvoiceForExport[],
  options: BMDExportOptions = {}
): string {
  const {
    separator = ';',
    includeHeader = true,
    accountCode = '8400',
    taxCode = 'AT'
  } = options

  const headers = [
    'Satzart',
    'GKonto',
    'Steuercode',
    'Buchcode',
    'Rechnungsnummer',
    'Rechnungsdatum',
    'Kunde',
    'Kundenadresse',
    'Bruttobetrag',
    'Status',
    'Kleinunternehmer'
  ]

  const rows = invoices.map(invoice => [
    'RG',
    invoice.isKleinunternehmer ? '8400' : accountCode,
    invoice.isKleinunternehmer ? '' : taxCode,
    invoice.isKleinunternehmer ? 'KU' : 'UST',
    invoice.number,
    format(invoice.createdAt, 'dd.MM.yyyy', { locale: de }),
    escapeCSVField(invoice.clientName, separator),
    escapeCSVField(invoice.clientAddress || '', separator),
    formatToDecimalComma(invoice.totalGrossCents),
    invoice.status,
    invoice.isKleinunternehmer ? 'Ja' : 'Nein'
  ])

  const csvLines: string[] = []

  if (includeHeader) {
    csvLines.push(headers.join(separator))
  }

  rows.forEach(row => {
    csvLines.push(row.join(separator))
  })

  return csvLines.join('\n')
}

/**
 * Export invoices to RZL format (Austrian accounting software).
 */
export function exportToRZL(
  invoices: InvoiceForExport[],
  options: RZLExportOptions = {}
): string {
  const { separator = ';', includeHeader = true } = options

  const headers = [
    'RE_NR',
    'RE_DATUM',
    'KUNDE',
    'ADRESSE',
    'BRUTTO_EUR',
    'STATUS',
    'KU_STATUS'
  ]

  const rows = invoices.map(invoice => [
    invoice.number,
    format(invoice.createdAt, 'dd.MM.yyyy', { locale: de }),
    escapeCSVField(invoice.clientName, separator),
    escapeCSVField(invoice.clientAddress || '', separator),
    formatToDecimalComma(invoice.totalGrossCents),
    invoice.status,
    invoice.isKleinunternehmer ? '1' : '0'
  ])

  const csvLines: string[] = []

  if (includeHeader) {
    csvLines.push(headers.join(separator))
  }

  rows.forEach(row => {
    csvLines.push(row.join(separator))
  })

  return csvLines.join('\n')
}

/**
 * Export invoices to DATEV format (German/Austrian accounting software).
 */
export function exportToDATEV(
  invoices: InvoiceForExport[],
  options: DATEVExportOptions = {}
): string {
  const { separator = ';', includeHeader = true } = options

  const headers = [
    'Umsatz (ohne Soll/Haben-Kz)',
    'Soll/Haben-Kennzeichen',
    'WKZ Umsatz',
    'Kurs',
    'Basis-Umsatz',
    'WKZ Basis-Umsatz',
    'Konto',
    'Gegenkonto (ohne BU-Schlüssel)',
    'BU-Schlüssel',
    'Belegdatum',
    'Belegfeld 1',
    'Belegfeld 2',
    'Skonto',
    'Buchungstext'
  ]

  const rows = invoices.map(invoice => {
    const account = invoice.isKleinunternehmer ? '8400' : '8300'
    const taxAccount = invoice.isKleinunternehmer ? '' : '1776'
    const vatRate = getVATRate(invoice.vatBreakdown)

    let buSchluessel = ''
    if (!invoice.isKleinunternehmer) {
      if (vatRate === 20) buSchluessel = '19'
      else if (vatRate === 13) buSchluessel = '07'
      else if (vatRate === 10) buSchluessel = '10'
      else buSchluessel = '19'
    }

    return [
      formatToDecimalComma(invoice.totalGrossCents),
      'S',
      'EUR',
      '',
      formatToDecimalComma(invoice.totalGrossCents),
      'EUR',
      account,
      taxAccount,
      buSchluessel,
      format(invoice.createdAt, 'ddMMyyyy'),
      invoice.number,
      escapeCSVField(invoice.clientName, separator),
      '',
      escapeCSVField('Massage/Therapie-Leistung', separator)
    ]
  })

  const csvLines: string[] = []

  if (includeHeader) {
    csvLines.push(headers.join(separator))
  }

  rows.forEach(row => {
    csvLines.push(row.join(separator))
  })

  return csvLines.join('\n')
}

/**
 * Export invoices to a configurable generic CSV format.
 */
export function exportToGenericCSV(
  invoices: InvoiceForExport[],
  options: GenericCSVExportOptions = {}
): string {
  const {
    separator = ',',
    includeHeader = true,
    dateFormat = 'dd.MM.yyyy',
    language = 'de'
  } = options

  const headers =
    language === 'de'
      ? [
          'Rechnungsnummer',
          'Rechnungsdatum',
          'Kunde',
          'Kundenadresse',
          'Bruttobetrag',
          'Nettobetrag',
          'MwSt-Betrag',
          'MwSt-Satz',
          'Status',
          'Kleinunternehmer',
          'Zahlungsstatus',
          'Zahlungsdatum'
        ]
      : [
          'Invoice Number',
          'Invoice Date',
          'Client Name',
          'Client Address',
          'Gross Amount',
          'Net Amount',
          'VAT Amount',
          'VAT Rate',
          'Status',
          'Small Business',
          'Payment Status',
          'Payment Date'
        ]

  const rows = invoices.map(invoice => {
    const netAmount = calculateNetAmount(invoice)
    const vatAmount = Math.max(invoice.totalGrossCents - netAmount, 0)
    const vatRate = invoice.isKleinunternehmer ? 0 : getVATRate(invoice.vatBreakdown)
    const paymentStatus = getPaymentStatus(invoice)
    const paymentDate = getPaymentDate(invoice)

    return [
      invoice.number,
      format(invoice.createdAt, dateFormat, { locale: de }),
      escapeCSVField(invoice.clientName, separator),
      escapeCSVField(invoice.clientAddress || '', separator),
      formatToDecimalDot(invoice.totalGrossCents),
      formatToDecimalDot(netAmount),
      formatToDecimalDot(vatAmount),
      `${vatRate}%`,
      invoice.status,
      invoice.isKleinunternehmer
        ? language === 'de'
          ? 'Ja'
          : 'Yes'
        : language === 'de'
        ? 'Nein'
        : 'No',
      paymentStatus,
      paymentDate ? format(new Date(paymentDate), dateFormat, { locale: de }) : ''
    ]
  })

  const csvLines: string[] = []

  if (includeHeader) {
    csvLines.push(headers.join(separator))
  }

  rows.forEach(row => {
    csvLines.push(row.join(separator))
  })

  return csvLines.join('\n')
}

export function validateInvoiceForExport(invoice: InvoiceForExport): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!invoice.number || invoice.number.trim() === '') {
    errors.push('Invoice number is required')
  }

  if (!invoice.clientName || invoice.clientName.trim() === '') {
    errors.push('Client name is required')
  }

  if (invoice.totalGrossCents <= 0) {
    errors.push('Gross amount must be positive')
  }

  if (invoice.status === 'DRAFT') {
    errors.push('DRAFT invoices cannot be exported to accounting')
  }

  if (!invoice.clientAddress || invoice.clientAddress.trim() === '') {
    warnings.push('Client address is missing')
  }

  if (!invoice.isKleinunternehmer) {
    if (!invoice.vatBreakdown || typeof invoice.vatBreakdown !== 'object') {
      warnings.push('VAT breakdown is missing for VAT-registered invoice')
    } else {
      const calculatedGross = calculateGrossFromBreakdown(invoice.vatBreakdown)
      const diff = Math.abs(calculatedGross - invoice.totalGrossCents)
      if (diff > 10) {
        warnings.push(
          `VAT calculation mismatch: expected ${calculatedGross}, got ${invoice.totalGrossCents}`
        )
      }
    }
  }

  if (invoice.totalGrossCents > 10_000_00) {
    warnings.push('Unusually high invoice amount - please verify')
  }

  return { errors, warnings }
}

/**
 * Generate filename for CSV exports with all supported targets.
 */
export function generateExportFilename(
  exportFormat: 'BMD' | 'RZL' | 'DATEV' | 'CSV_GENERIC',
  fromDate: Date,
  toDate: Date
): string {
  const fromStr = format(fromDate, 'yyyy-MM-dd')
  const toStr = format(toDate, 'yyyy-MM-dd')
  const timestamp = format(new Date(), 'yyyyMMdd-HHmm')
  return `MyoFlow-${exportFormat}-Export-${fromStr}-${toStr}-${timestamp}.csv`
}

/**
 * Add UTF-8 BOM (Byte Order Mark) for Excel compatibility.
 */
export function addUTF8BOM(csvContent: string): string {
  const bom = '\uFEFF'
  return bom + csvContent
}

function formatToDecimalComma(valueInCents: number): string {
  return (valueInCents / 100).toFixed(2).replace('.', ',')
}

function formatToDecimalDot(valueInCents: number): string {
  return (valueInCents / 100).toFixed(2)
}

function escapeCSVField(value: string, separator: string): string {
  if (value === undefined || value === null) {
    return '""'
  }

  let sanitized = sanitizeForExcel(String(value))
  if (sanitized === '') {
    return '""'
  }

  sanitized = sanitized.replace(/\r\n/g, '\n')
  const requiresQuoting =
    sanitized.includes(separator) ||
    sanitized.includes('"') ||
    sanitized.includes('\n') ||
    sanitized.startsWith(' ') ||
    sanitized.endsWith(' ')

  if (requiresQuoting) {
    sanitized = sanitized.replace(/"/g, '""')
    return `"${sanitized}"`
  }

  return sanitized
}

function sanitizeForExcel(value: string): string {
  if (!value) return value

  const trimmed = value.trimStart()
  if (
    trimmed.startsWith('=') ||
    trimmed.startsWith('+') ||
    trimmed.startsWith('-') ||
    trimmed.startsWith('@')
  ) {
    return `'${value}`
  }

  return value
}

function calculateNetAmount(invoice: InvoiceForExport): number {
  if (invoice.isKleinunternehmer) {
    return invoice.totalGrossCents
  }

  const breakdown = normalizeVATBreakdown(invoice.vatBreakdown)
  if (!breakdown) {
    return invoice.totalGrossCents
  }

  let totalNet = 0
  Object.values(breakdown).forEach(rate => {
    if (rate && typeof rate === 'object' && 'netCents' in rate && typeof rate.netCents === 'number') {
      totalNet += rate.netCents
    }
  })

  return totalNet || invoice.totalGrossCents
}

function calculateGrossFromBreakdown(vatBreakdown: any): number {
  const breakdown = normalizeVATBreakdown(vatBreakdown)
  if (!breakdown) return 0

  let totalGross = 0
  Object.values(breakdown).forEach(rate => {
    if (
      rate &&
      typeof rate === 'object' &&
      'grossCents' in rate &&
      typeof rate.grossCents === 'number'
    ) {
      totalGross += rate.grossCents
    }
  })

  return totalGross
}

function getVATRate(vatBreakdown: any): number {
  const breakdown = normalizeVATBreakdown(vatBreakdown)
  if (!breakdown) return 20

  const rates = Object.keys(breakdown)
  if (rates.length > 0) {
    const parsedRate = parseInt(rates[0], 10)
    if (!isNaN(parsedRate)) {
      return parsedRate
    }
  }

  const firstEntry = Object.values(breakdown)[0]
  if (firstEntry && typeof firstEntry === 'object' && 'vatRate' in firstEntry) {
    const vatRate = Number((firstEntry as any).vatRate)
    if (!isNaN(vatRate)) {
      return vatRate
    }
  }

  return 20
}

function normalizeVATBreakdown(
  vatBreakdown: any
): Record<string, { netCents?: number; vatCents?: number; grossCents?: number; vatRate?: number }> | null {
  if (!vatBreakdown) return null

  if (Array.isArray(vatBreakdown)) {
    const result: Record<
      string,
      { netCents?: number; vatCents?: number; grossCents?: number; vatRate?: number }
    > = {}

    vatBreakdown.forEach(entry => {
      if (entry && typeof entry === 'object') {
        const rate =
          typeof entry.vatRate === 'number'
            ? entry.vatRate.toString()
            : typeof entry.rate === 'number'
            ? entry.rate.toString()
            : '0'

        result[rate] = {
          netCents: typeof entry.netCents === 'number' ? entry.netCents : undefined,
          vatCents: typeof entry.vatCents === 'number' ? entry.vatCents : undefined,
          grossCents: typeof entry.grossCents === 'number' ? entry.grossCents : undefined,
          vatRate: typeof entry.vatRate === 'number' ? entry.vatRate : undefined
        }
      }
    })

    return result
  }

  if (typeof vatBreakdown === 'object') {
    return vatBreakdown
  }

  return null
}

function getPaymentStatus(invoice: InvoiceForExport): string {
  if (invoice.status === 'PAID') return 'SETTLED'
  if (invoice.status === 'SENT') return 'PENDING'
  if (invoice.payments && invoice.payments.some(payment => payment.status?.toUpperCase() === 'SETTLED')) {
    return 'SETTLED'
  }

  return 'UNKNOWN'
}

function getPaymentDate(invoice: InvoiceForExport): Date | string | null {
  if (!invoice.payments || invoice.payments.length === 0) {
    return null
  }

  const paidPayment = invoice.payments.find(payment => payment.status?.toUpperCase() === 'SETTLED')
  if (!paidPayment) {
    return null
  }

  return paidPayment.paidAt || null
}
