// Austrian tax helpers (legacy)
export {
  KLEINUNTERNEHMER_LIMIT,
  getVatRate,
  vatLineItems,
  kleinunternehmerFooter,
  formatCurrency
} from './at/receipt'

// Austrian invoicing utilities (main) - export everything except conflicting formatDate
export type {
  InvoiceLine,
  VATBreakdown,
  VatRate,
  AustrianInvoiceData
} from './src/austrian-invoicing'

export {
  generateInvoiceNumber,
  getVatRateDecimal,
  calculateVatBreakdown,
  getKleinunternehmerNotice,
  getKleinunternehmerDisclaimer,
  getTherapyServiceNotice,
  formatAustrianCurrency,
  formatEuro,
  formatInvoiceDate,
  formatDate,
  calculateInvoiceTotals,
  createInvoiceLineFromService,
  validateInvoiceData,
  VAT_RATES,
  calculateVAT,
  getNextInvoiceNumber
} from './src/austrian-invoicing'

// PDF generation
export * from './src/pdf-generator'

// SEPA QR codes for Austrian banking
export * from './src/sepa-qr'

// CSV export for accounting software
export * from './src/csv-export'

// Types
export * from './src/types'

// i18n utilities
export * from './i18n/config'

// Encryption utilities
export * from './src/encryption'

// Version
export const MYOFLOW_LIB_VERSION = '0.0.0'
