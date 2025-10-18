import { describe, expect, it } from 'vitest'
import {
  addUTF8BOM,
  exportToBMD,
  exportToDATEV,
  exportToGenericCSV,
  exportToRZL,
  generateExportFilename,
  InvoiceForExport,
  validateInvoiceForExport
} from '../csv-export'

function createInvoice(partial: Partial<InvoiceForExport> = {}): InvoiceForExport {
  return {
    id: partial.id ?? 'inv_1',
    number: partial.number ?? '2025-001',
    createdAt: partial.createdAt ?? new Date('2025-03-15T12:00:00Z'),
    clientName: partial.clientName ?? 'Anna Sommer',
    clientAddress: partial.clientAddress ?? 'Hauptstraße 12, 4020 Linz',
    totalGrossCents: partial.totalGrossCents ?? 200_00,
    status: partial.status ?? 'PAID',
    isKleinunternehmer: partial.isKleinunternehmer ?? false,
    lines: partial.lines ?? [],
    vatBreakdown:
      partial.vatBreakdown ??
      {
        '20': { netCents: 166_67, vatCents: 33_33, grossCents: 200_00 }
      },
    payments: partial.payments
  }
}

function parseCSVRow(row: string, separator: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < row.length; i += 1) {
    const char = row[i]

    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === separator && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }

  result.push(current)
  return result
}

describe('exportToBMD', () => {
  it('includes Austrian-specific fields and escapes special characters', () => {
    const invoice = createInvoice({
      clientName: '=SUM(A1:A2)',
      clientAddress: 'Kärntner Straße 12; 1010 Wien',
      totalGrossCents: 123_45,
      isKleinunternehmer: false
    })

    const csv = exportToBMD([invoice], { accountCode: '8300' })
    const [header, row] = csv.split('\n')

    expect(header).toBe(
      'Satzart;GKonto;Steuercode;Buchcode;Rechnungsnummer;Rechnungsdatum;Kunde;Kundenadresse;Bruttobetrag;Status;Kleinunternehmer'
    )
    expect(row.startsWith('RG;8300;AT;UST;2025-001;')).toBe(true)
    expect(row).toContain("'=SUM(A1:A2)")
    expect(row).toContain('"Kärntner Straße 12; 1010 Wien"')
    expect(row.endsWith('PAID;Nein')).toBe(true)
  })

  it('uses Kleinunternehmer defaults when applicable', () => {
    const invoice = createInvoice({
      isKleinunternehmer: true,
      totalGrossCents: 500_00
    })

    const [, row] = exportToBMD([invoice]).split('\n')
    expect(row.startsWith('RG;8400;;KU;')).toBe(true)
    expect(row).toContain(';Ja')
  })
})

describe('exportToRZL', () => {
  it('formats amounts with comma decimal separator', () => {
    const invoice = createInvoice({ totalGrossCents: 987_65 })

    const [, row] = exportToRZL([invoice]).split('\n')
    expect(row).toContain(';987,65;')
  })
})

describe('exportToDATEV', () => {
  it('outputs 14 columns and correct BU-Schlüssel for 20% VAT', () => {
    const invoice = createInvoice({
      totalGrossCents: 600_00,
      vatBreakdown: {
        '20': { netCents: 500_00, vatCents: 100_00, grossCents: 600_00 }
      }
    })

    const [, row] = exportToDATEV([invoice]).split('\n')
    const columns = row.split(';')
    expect(columns).toHaveLength(14)
    expect(columns[8]).toBe('19')
    expect(columns[9]).toBe('15032025') // ddMMyyyy
  })

  it('falls back to correct BU-Schlüssel for reduced VAT rates', () => {
    const invoice = createInvoice({
      totalGrossCents: 500_00,
      vatBreakdown: {
        '10': { netCents: 454_55, vatCents: 45_45, grossCents: 500_00 }
      }
    })

    const [, row] = exportToDATEV([invoice]).split('\n')
    const columns = row.split(';')
    expect(columns[8]).toBe('10')
  })

  it('omits tax account details for Kleinunternehmer', () => {
    const invoice = createInvoice({
      isKleinunternehmer: true
    })

    const [, row] = exportToDATEV([invoice]).split('\n')
    const columns = row.split(';')
    expect(columns[7]).toBe('')
    expect(columns[8]).toBe('')
  })
})

describe('exportToGenericCSV', () => {
  it('produces English headers and calculates net/VAT amounts', () => {
    const invoice = createInvoice({
      totalGrossCents: 1_200_00,
      vatBreakdown: {
        '20': { netCents: 1_000_00, vatCents: 200_00, grossCents: 1_200_00 }
      }
    })

    const csv = exportToGenericCSV([invoice], {
      language: 'en',
      dateFormat: 'yyyy-MM-dd'
    })

    const [headers, row] = csv.split('\n')
    expect(headers).toBe(
      'Invoice Number,Invoice Date,Client Name,Client Address,Gross Amount,Net Amount,VAT Amount,VAT Rate,Status,Small Business,Payment Status,Payment Date'
    )

    const columns = parseCSVRow(row, ',')
    expect(columns[4]).toBe('1200.00')
    expect(columns[5]).toBe('1000.00')
    expect(columns[6]).toBe('200.00')
    expect(columns[7]).toBe('20%')
    expect(columns[9]).toBe('No')
  })

  it('marks Kleinunternehmer invoices correctly', () => {
    const invoice = createInvoice({
      isKleinunternehmer: true,
      totalGrossCents: 300_00
    })

    const [, row] = exportToGenericCSV([invoice]).split('\n')
    const columns = parseCSVRow(row, ',')
    expect(columns[9]).toBe('Ja')
    expect(columns[5]).toBe('300.00') // Net equals gross
    expect(columns[6]).toBe('0.00')
  })
})

describe('validateInvoiceForExport', () => {
  it('collects critical validation errors', () => {
    const invoice = createInvoice({
      number: '',
      clientName: '',
      totalGrossCents: 0,
      status: 'DRAFT'
    })

    const result = validateInvoiceForExport(invoice)
    expect(result.errors).toEqual([
      'Invoice number is required',
      'Client name is required',
      'Gross amount must be positive',
      'DRAFT invoices cannot be exported to accounting'
    ])
  })

  it('reports VAT mismatches as warnings', () => {
    const invoice = createInvoice({
      totalGrossCents: 300_00,
      vatBreakdown: {
        '20': { netCents: 100_00, vatCents: 20_00, grossCents: 120_00 }
      },
      clientAddress: ''
    })

    const result = validateInvoiceForExport(invoice)
    expect(result.warnings).toContain(
      'VAT calculation mismatch: expected 12000, got 30000'
    )
    expect(result.warnings).toContain('Client address is missing')
  })
})

describe('addUTF8BOM', () => {
  it('prefixes CSV content with BOM for Excel compatibility', () => {
    const csv = 'col1;col2\nval1;val2'
    const withBom = addUTF8BOM(csv)
    expect(withBom.charCodeAt(0)).toBe(0xfeff)
    expect(withBom.slice(1)).toBe(csv)
  })
})

describe('generateExportFilename', () => {
  it('supports generic CSV exports', () => {
    const from = new Date('2025-08-01T00:00:00Z')
    const to = new Date('2025-08-31T00:00:00Z')
    const filename = generateExportFilename('CSV_GENERIC', from, to)
    expect(filename.startsWith('MyoFlow-CSV_GENERIC-Export-2025-08-01-2025-08-31-')).toBe(true)
    expect(filename.endsWith('.csv')).toBe(true)
  })
})
