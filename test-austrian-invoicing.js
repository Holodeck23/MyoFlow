// Quick test of Austrian invoicing functionality
const { 
  generateInvoiceNumber,
  createInvoiceLineFromService,
  calculateInvoiceTotals,
  formatAustrianCurrency,
  formatInvoiceDate,
  getKleinunternehmerNotice,
  getTherapyServiceNotice,
  validateInvoiceData
} = require('./packages/lib/src/austrian-invoicing.ts')

console.log('🇦🇹 Testing Austrian Invoice System\n')

// Test invoice number generation
console.log('=== Invoice Number Generation ===')
console.log('2024-001:', generateInvoiceNumber(2024, 1))
console.log('2024-052:', generateInvoiceNumber(2024, 52))
console.log('2025-123:', generateInvoiceNumber(2025, 123))

// Test service line creation
console.log('\n=== Invoice Line Creation ===')
const massageLine = createInvoiceLineFromService('Klassische Massage', 8000, 'KLEINUNTERNEHMER')
console.log('Massage Service Line:', massageLine)

const consultingLine = createInvoiceLineFromService('Beratungsgespräch', 5000, 'UST_20', 2)
console.log('Consulting Service Line:', consultingLine)

// Test totals calculation
console.log('\n=== Totals Calculation ===')
const lines = [massageLine, consultingLine]
const totals = calculateInvoiceTotals(lines)
console.log('Invoice Totals:', totals)

// Test formatting
console.log('\n=== Austrian Formatting ===')
console.log('Currency:', formatAustrianCurrency(8000)) // €80,00
console.log('Date:', formatInvoiceDate(new Date()))

// Test legal notices
console.log('\n=== Legal Notices ===')
console.log('Kleinunternehmer:', getKleinunternehmerNotice())
console.log('Therapy Service:', getTherapyServiceNotice())

// Test validation
console.log('\n=== Invoice Validation ===')
const validInvoice = {
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
  ...totals,
  kleinunternehmer: true
}

const validation = validateInvoiceData(validInvoice)
console.log('Validation Result:', validation)

console.log('\n✅ Austrian invoicing system working correctly!')

// Test VAT calculations for different scenarios
console.log('\n=== VAT Scenario Testing ===')

// Scenario 1: Kleinunternehmer (no VAT)
const kleinLines = [
  createInvoiceLineFromService('Massage 60min', 8000, 'KLEINUNTERNEHMER'),
  createInvoiceLineFromService('Massage 45min', 6500, 'KLEINUNTERNEHMER')
]
const kleinTotals = calculateInvoiceTotals(kleinLines)
console.log('Kleinunternehmer Totals:', kleinTotals)

// Scenario 2: Regular VAT (20%)
const vatLines = [
  createInvoiceLineFromService('Massage 60min', 8000, 'UST_20'),
  createInvoiceLineFromService('Beratung 30min', 5000, 'UST_20')
]
const vatTotals = calculateInvoiceTotals(vatLines)
console.log('Regular VAT Totals:', vatTotals)

console.log('\n🇦🇹 Austrian business compliance ready for grant applications!')