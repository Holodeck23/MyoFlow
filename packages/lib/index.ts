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

// PDF generation - Server-side only, not exported to avoid client-side bundling issues
// Import directly from './src/pdf-generator' in API routes when needed

// SEPA QR codes for Austrian banking - Server-side only
// Import directly from './src/sepa-qr' in API routes when needed

// CSV export for accounting software
export * from './src/csv-export'

// Types
export * from './src/types'

// i18n utilities
export * from './i18n/config'
export * from './i18n/context'
export * from './i18n/hooks'

// Encryption utilities
export * from './src/encryption'

// Security utilities
export * from './security/crypto'
export * from './security/permissions'
export * from './security/intakeToken'

// Audit logging
export * from './audit/log'

// Version
export const MYOFLOW_LIB_VERSION = '0.0.0'
