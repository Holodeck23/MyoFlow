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

// Google Maps integration for Austrian addresses - Server-side only
export * from './src/google-maps'

// CSV export for accounting software
export * from './src/csv-export'

// Austrian holidays
export * from './src/austrian-holidays'
export * from './src/austrian-validation'

// Types
export * from './src/types'

// i18n utilities
export * from './i18n/config'
export * from './i18n/context'
export * from './i18n/hooks'

// Security utilities (includes encryption)
export * from './security/crypto'
export * from './security/permissions'
export * from './security/intakeToken'

// Audit logging
export * from './audit/log'

// Compliance & revenue tracking
export * from './src/compliance-revenue'

// Version
export const MYOFLOW_LIB_VERSION = '0.0.0'
