#!/usr/bin/env ts-node
/**
 * Quick CSV export validation script
 * Tests BMD, RZL, DATEV, and Generic CSV exports with sample data
 */

import {
  exportToBMD,
  exportToRZL,
  exportToDATEV,
  exportToGenericCSV,
  validateInvoiceForExport,
  addUTF8BOM,
  type InvoiceForExport,
} from '../packages/lib/src/csv-export.ts'

// Sample Austrian invoice data
const sampleInvoices: InvoiceForExport[] = [
  {
    id: 'inv_1',
    number: 'RE-2025-001',
    createdAt: new Date('2025-09-15'),
    clientName: 'Müller GmbH',
    clientAddress: 'Hauptstraße 23, 4020 Linz, Österreich',
    totalGrossCents: 12000, // €120.00
    status: 'PAID',
    isKleinunternehmer: false,
    lines: [],
    vatBreakdown: {
      '20': { netCents: 10000, vatCents: 2000, grossCents: 12000, vatRate: 20 },
    },
    payments: [{ status: 'SETTLED', paidAt: new Date('2025-09-20') }],
  },
  {
    id: 'inv_2',
    number: 'RE-2025-002',
    createdAt: new Date('2025-09-20'),
    clientName: 'Österreichische Praxis für Physiotherapie',
    clientAddress: 'Landstraße 45, 4040 Linz',
    totalGrossCents: 8500, // €85.00
    status: 'SENT',
    isKleinunternehmer: true,
    lines: [],
    vatBreakdown: {},
    payments: [],
  },
  {
    id: 'inv_3',
    number: 'RE-2025-003',
    createdAt: new Date('2025-09-25'),
    clientName: 'Schöne Welt Massage Salon',
    clientAddress: 'Donaustraße 12, 4020 Linz',
    totalGrossCents: 15600, // €156.00
    status: 'PAID',
    isKleinunternehmer: false,
    lines: [],
    vatBreakdown: {
      '13': { netCents: 13805, vatCents: 1795, grossCents: 15600, vatRate: 13 },
    },
    payments: [{ status: 'SETTLED', paidAt: new Date('2025-09-26') }],
  },
]

console.log('🧪 Testing CSV Export Functions\n')

// Test 1: BMD Export
console.log('1️⃣ BMD Export Test')
console.log('─'.repeat(50))
const bmdCsv = exportToBMD(sampleInvoices)
console.log('First 3 lines:')
console.log(bmdCsv.split('\n').slice(0, 3).join('\n'))
console.log(`\n✅ BMD: ${bmdCsv.split('\n').length} rows generated`)
console.log(`✅ Contains "Müller": ${bmdCsv.includes('Müller')}`)
console.log(`✅ Decimal comma format: ${bmdCsv.includes(',00')}`)
console.log(`✅ Has all 11 columns: ${bmdCsv.split('\n')[0].split(';').length === 11}`)
console.log()

// Test 2: DATEV Export
console.log('2️⃣ DATEV Export Test')
console.log('─'.repeat(50))
const datevCsv = exportToDATEV(sampleInvoices)
console.log('Header:')
console.log(datevCsv.split('\n')[0])
console.log('\nFirst data row:')
console.log(datevCsv.split('\n')[1])
console.log(`\n✅ DATEV: ${datevCsv.split('\n').length} rows generated`)
console.log(`✅ Has exactly 14 columns: ${datevCsv.split('\n')[0].split(';').length === 14}`)
console.log(`✅ BU-Schlüssel 19 (20% VAT): ${datevCsv.includes(';19;')}`)
console.log(`✅ BU-Schlüssel 07 (13% VAT): ${datevCsv.includes(';07;')}`)
console.log(`✅ Date format ddMMyyyy: ${datevCsv.includes('15092025')}`)
console.log()

// Test 3: RZL Export
console.log('3️⃣ RZL Export Test')
console.log('─'.repeat(50))
const rzlCsv = exportToRZL(sampleInvoices)
console.log('First 2 lines:')
console.log(rzlCsv.split('\n').slice(0, 2).join('\n'))
console.log(`\n✅ RZL: ${rzlCsv.split('\n').length} rows generated`)
console.log(`✅ Kleinunternehmer as 1: ${rzlCsv.includes(';1')}`)
console.log(`✅ Abbreviated columns: ${rzlCsv.includes('RE_NR')}`)
console.log()

// Test 4: Generic CSV Export
console.log('4️⃣ Generic CSV Export Test')
console.log('─'.repeat(50))
const genericCsv = exportToGenericCSV(sampleInvoices, {
  separator: ',',
  dateFormat: 'yyyy-MM-dd',
  language: 'en',
})
console.log('First 2 lines:')
console.log(genericCsv.split('\n').slice(0, 2).join('\n'))
console.log(`\n✅ Generic CSV: ${genericCsv.split('\n').length} rows generated`)
console.log(`✅ Comma separator: ${genericCsv.includes('Invoice Number,Invoice Date')}`)
console.log(`✅ English headers: ${genericCsv.includes('Client Name')}`)
console.log(`✅ ISO date format: ${genericCsv.includes('2025-09')}`)
console.log()

// Test 5: UTF-8 BOM
console.log('5️⃣ UTF-8 BOM Test')
console.log('─'.repeat(50))
const withBom = addUTF8BOM(bmdCsv)
console.log(`✅ BOM added: ${withBom.charCodeAt(0) === 0xfeff}`)
console.log(`✅ Original content preserved: ${withBom.slice(1, 20) === bmdCsv.slice(0, 19)}`)
console.log()

// Test 6: Validation
console.log('6️⃣ Validation Test')
console.log('─'.repeat(50))
sampleInvoices.forEach((inv, i) => {
  const result = validateInvoiceForExport(inv)
  console.log(`Invoice ${i + 1}: ${result.errors.length} errors, ${result.warnings.length} warnings`)
  if (result.warnings.length > 0) {
    console.log(`  Warnings: ${result.warnings.join(', ')}`)
  }
})
console.log()

// Test 7: Special Characters
console.log('7️⃣ Special Characters Test')
console.log('─'.repeat(50))
const specialCharInvoice: InvoiceForExport = {
  id: 'inv_special',
  number: 'RE-2025-999',
  createdAt: new Date(),
  clientName: 'Größe & Schönheit GmbH',
  clientAddress: 'Äußere Straße 99, Österreich',
  totalGrossCents: 10000,
  status: 'SENT',
  isKleinunternehmer: true,
  lines: [],
  vatBreakdown: {},
}
const specialCsv = exportToBMD([specialCharInvoice])
console.log('Special character handling:')
console.log(specialCsv.split('\n')[1])
console.log(`✅ Contains ö: ${specialCsv.includes('ö')}`)
console.log(`✅ Contains ß: ${specialCsv.includes('ß')}`)
console.log(`✅ Contains Ä: ${specialCsv.includes('Ä')}`)
console.log()

console.log('✅ All CSV export tests completed!')
console.log('\n📝 Next Steps:')
console.log('1. Start dev server: pnpm dev')
console.log('2. Navigate to: http://localhost:3000/dashboard/settings?tab=accounting-exports')
console.log('3. Test actual CSV downloads in Excel')
console.log('4. Verify formatting matches Austrian requirements')
