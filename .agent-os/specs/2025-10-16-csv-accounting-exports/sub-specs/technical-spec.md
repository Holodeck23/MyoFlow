# Technical Specification: CSV Accounting Exports

**Parent Spec:** `../spec.md`
**Created:** October 16, 2025
**Version:** 1.0.0

---

## Overview

This document provides implementation details for the CSV accounting export feature, including library updates, database schema, and component architecture.

---

## CSV Export Library Updates

### Current State

**File:** `packages/lib/src/csv-export.ts`

**Existing Functions:**
- `exportToBMD()` - Basic BMD format (incomplete)
- `exportToRZL()` - Basic RZL format (incomplete)
- `exportToDATEV()` - Basic DATEV format (missing fields)
- `validateInvoiceForExport()` - Basic validation
- `generateExportFilename()` - Austrian date format filename generator

**Issues Identified:**
1. BMD export missing required fields (`satzart`, `gkonto`, `steuercode`, `buchcode`)
2. DATEV export using wrong BU-Schlüssel codes
3. No CSV generic export option
4. Limited validation (doesn't check VAT calculations)
5. No UTF-8 BOM for Excel compatibility

---

## Required Library Enhancements

### 1. BMD Format Completion

**Update `exportToBMD()` function:**

```typescript
export interface BMDExportOptions {
  separator?: string
  encoding?: string
  includeHeader?: boolean
  accountCode?: string  // Default: "8400" for Kleinunternehmer
  taxCode?: string      // Default: "AT"
}

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
    'Satzart',           // NEW: Record type
    'GKonto',            // NEW: G/L account
    'Steuercode',        // NEW: Tax code
    'Buchcode',          // NEW: Posting code
    'Rechnungsnummer',   // UPDATED: Capitalized
    'Rechnungsdatum',    // UPDATED: Capitalized
    'Kunde',
    'Kundenadresse',     // UPDATED: Capitalized
    'Bruttobetrag',      // UPDATED: Capitalized
    'Status',
    'Kleinunternehmer'   // UPDATED: Capitalized
  ]

  const rows = invoices.map(invoice => [
    'RG',  // Satzart: RG = Rechnung (Invoice)
    invoice.isKleinunternehmer ? '8400' : accountCode,  // GKonto
    invoice.isKleinunternehmer ? '' : taxCode,  // Steuercode
    invoice.isKleinunternehmer ? 'KU' : 'UST',  // Buchcode
    invoice.number,
    format(invoice.createdAt, 'dd.MM.yyyy', { locale: de }),
    escapeCSVField(invoice.clientName),
    escapeCSVField(invoice.clientAddress || ''),
    (invoice.totalGrossCents / 100).toFixed(2).replace('.', ','),
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

// Helper function for proper CSV escaping
function escapeCSVField(value: string): string {
  if (!value) return '""'

  // Escape double quotes by doubling them
  const escaped = value.replace(/"/g, '""')

  // Wrap in quotes if contains separator, quotes, or newlines
  if (escaped.includes(';') || escaped.includes(',') || escaped.includes('\n')) {
    return `"${escaped}"`
  }

  return escaped
}
```

---

### 2. DATEV Format Corrections

**Update `exportToDATEV()` with correct BU-Schlüssel codes:**

```typescript
export interface DATEVExportOptions {
  separator?: string
  includeHeader?: boolean
  consultantNumber?: string  // DATEV consultant number
  clientNumber?: string      // DATEV client number
}

export function exportToDATEV(
  invoices: InvoiceForExport[],
  options: DATEVExportOptions = {}
): string {
  const { separator = ';', includeHeader = true } = options

  // DATEV requires specific header format (14 columns)
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
    // Determine account code based on Kleinunternehmer status
    const account = invoice.isKleinunternehmer ? '8400' : '8300'
    const taxAccount = invoice.isKleinunternehmer ? '' : '1776'

    // Determine BU-Schlüssel (tax code) based on VAT rate
    let buSchluessel = ''
    if (!invoice.isKleinunternehmer) {
      // Extract VAT rate from vatBreakdown
      const vatRate = getVATRate(invoice.vatBreakdown)

      if (vatRate === 20) buSchluessel = '19'      // 20% standard rate
      else if (vatRate === 13) buSchluessel = '07' // 13% special rate
      else if (vatRate === 10) buSchluessel = '10' // 10% reduced rate
      else buSchluessel = '19' // Default to standard rate
    }

    return [
      (invoice.totalGrossCents / 100).toFixed(2).replace('.', ','),
      'S', // Soll (Debit)
      'EUR',
      '',  // Empty exchange rate for EUR
      (invoice.totalGrossCents / 100).toFixed(2).replace('.', ','),
      'EUR',
      account,
      taxAccount,
      buSchluessel,
      format(invoice.createdAt, 'ddMMyyyy'), // NO separators
      invoice.number,
      escapeCSVField(invoice.clientName),
      '',  // Skonto (discount) - usually empty
      escapeCSVField('Massage/Therapie-Leistung')
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

// Helper to extract VAT rate from breakdown
function getVATRate(vatBreakdown: any): number {
  if (!vatBreakdown || typeof vatBreakdown !== 'object') return 20

  // vatBreakdown structure: { "20": { netCents, vatCents, grossCents } }
  const rates = Object.keys(vatBreakdown)
  if (rates.length === 0) return 20

  return parseInt(rates[0], 10)
}
```

---

### 3. Generic CSV Export (New)

**Add new `exportToGenericCSV()` function:**

```typescript
export interface GenericCSVExportOptions {
  separator?: ',' | ';'
  encoding?: string
  includeHeader?: boolean
  dateFormat?: 'dd.MM.yyyy' | 'yyyy-MM-dd'
  language?: 'de' | 'en'
}

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

  const headers = language === 'de' ? [
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
  ] : [
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
    const vatAmount = invoice.totalGrossCents - netAmount
    const vatRate = invoice.isKleinunternehmer ? 0 : getVATRate(invoice.vatBreakdown)

    const paymentStatus = getPaymentStatus(invoice)
    const paymentDate = getPaymentDate(invoice)

    return [
      invoice.number,
      format(invoice.createdAt, dateFormat, { locale: de }),
      escapeCSVField(invoice.clientName),
      escapeCSVField(invoice.clientAddress || ''),
      (invoice.totalGrossCents / 100).toFixed(2),
      (netAmount / 100).toFixed(2),
      (vatAmount / 100).toFixed(2),
      vatRate.toString() + '%',
      invoice.status,
      invoice.isKleinunternehmer ? (language === 'de' ? 'Ja' : 'Yes') : (language === 'de' ? 'Nein' : 'No'),
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

// Helper to calculate net amount from gross
function calculateNetAmount(invoice: InvoiceForExport): number {
  if (invoice.isKleinunternehmer) {
    return invoice.totalGrossCents // Gross = Net for Kleinunternehmer
  }

  // Extract net from VAT breakdown
  const vatBreakdown = invoice.vatBreakdown
  if (!vatBreakdown || typeof vatBreakdown !== 'object') {
    return invoice.totalGrossCents // Fallback
  }

  let totalNet = 0
  Object.values(vatBreakdown).forEach((rate: any) => {
    if (rate && typeof rate === 'object' && 'netCents' in rate) {
      totalNet += rate.netCents
    }
  })

  return totalNet || invoice.totalGrossCents
}

// Helper to get payment status
function getPaymentStatus(invoice: InvoiceForExport): string {
  if (invoice.status === 'PAID') return 'SETTLED'
  if (invoice.status === 'SENT') return 'PENDING'
  return 'UNKNOWN'
}

// Helper to get payment date
function getPaymentDate(invoice: InvoiceForExport): Date | null {
  // This would come from joined Payment records in actual implementation
  // For now, return null (will be enhanced in API layer)
  return null
}
```

---

### 4. Enhanced Validation

**Update `validateInvoiceForExport()` with Austrian-specific checks:**

```typescript
export interface ValidationResult {
  errors: string[]
  warnings: string[]
}

export function validateInvoiceForExport(invoice: InvoiceForExport): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Critical errors (prevent export)
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

  // Warnings (allow export but notify user)
  if (!invoice.clientAddress || invoice.clientAddress.trim() === '') {
    warnings.push('Client address is missing')
  }

  if (!invoice.isKleinunternehmer) {
    // Validate VAT breakdown exists
    if (!invoice.vatBreakdown || typeof invoice.vatBreakdown !== 'object') {
      warnings.push('VAT breakdown is missing for VAT-registered invoice')
    } else {
      // Validate VAT calculations
      const calculatedGross = calculateGrossFromBreakdown(invoice.vatBreakdown)
      const diff = Math.abs(calculatedGross - invoice.totalGrossCents)

      if (diff > 10) { // Allow 10 cent tolerance for rounding
        warnings.push(`VAT calculation mismatch: expected ${calculatedGross}, got ${invoice.totalGrossCents}`)
      }
    }
  }

  // Check for suspicious data
  if (invoice.totalGrossCents > 10000000) { // Over €100,000
    warnings.push('Unusually high invoice amount - please verify')
  }

  return { errors, warnings }
}

function calculateGrossFromBreakdown(vatBreakdown: any): number {
  let totalGross = 0
  Object.values(vatBreakdown).forEach((rate: any) => {
    if (rate && typeof rate === 'object' && 'grossCents' in rate) {
      totalGross += rate.grossCents
    }
  })
  return totalGross
}
```

---

### 5. UTF-8 BOM Support

**Add BOM helper function:**

```typescript
/**
 * Add UTF-8 BOM (Byte Order Mark) for Excel compatibility
 * Excel requires BOM to correctly detect UTF-8 encoding
 */
export function addUTF8BOM(csvContent: string): string {
  const bom = '\uFEFF'
  return bom + csvContent
}

// Usage in API routes:
const csvContent = exportToBMD(invoices, options)
const csvWithBom = addUTF8BOM(csvContent)
return new Response(csvWithBom, {
  headers: { 'Content-Type': 'text/csv; charset=utf-8' }
})
```

---

## Database Schema

### New Model: ExportLog

**File:** `packages/db/schema.prisma`

```prisma
model ExportLog {
  id                String             @id @default(cuid())
  therapistId       String             @map("therapist_id")
  configurationId   String?            @map("configuration_id")
  exportType        ExportType         @map("export_type")
  targetSystem      ExportTargetSystem @map("target_system")
  dateRangeStart    DateTime           @map("date_range_start") @db.Timestamp(6)
  dateRangeEnd      DateTime           @map("date_range_end") @db.Timestamp(6)
  invoiceCount      Int                @map("invoice_count")
  totalRevenueCents Int                @map("total_revenue_cents")
  exportedAt        DateTime           @default(now()) @map("exported_at") @db.Timestamp(6)
  fileSize          Int                @map("file_size")  // in bytes
  fileName          String             @map("file_name")
  downloadCount     Int                @default(0) @map("download_count")
  lastDownloadAt    DateTime?          @map("last_download_at") @db.Timestamp(6)

  Therapist       Therapist            @relation(fields: [therapistId], references: [id], onDelete: Cascade, onUpdate: NoAction)
  Configuration   ExportConfiguration? @relation(fields: [configurationId], references: [id], onDelete: SetNull, onUpdate: NoAction)

  @@index([therapistId, exportedAt], map: "idx_export_log_therapist_date")
  @@index([exportedAt], map: "idx_export_log_date")
}
```

**Add relations to existing models:**

```prisma
model Therapist {
  // ... existing fields
  ExportLogs ExportLog[]  // ← NEW
}

model ExportConfiguration {
  // ... existing fields
  ExportLogs ExportLog[]  // ← NEW
}
```

---

## Migration

**File:** `packages/db/migrations/YYYYMMDDHHMMSS_add_export_log/migration.sql`

```sql
-- CreateTable
CREATE TABLE "ExportLog" (
  "id" TEXT NOT NULL,
  "therapist_id" TEXT NOT NULL,
  "configuration_id" TEXT,
  "export_type" "ExportType" NOT NULL,
  "target_system" "ExportTargetSystem" NOT NULL,
  "date_range_start" TIMESTAMP(6) NOT NULL,
  "date_range_end" TIMESTAMP(6) NOT NULL,
  "invoice_count" INTEGER NOT NULL,
  "total_revenue_cents" INTEGER NOT NULL,
  "exported_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "file_size" INTEGER NOT NULL,
  "file_name" TEXT NOT NULL,
  "download_count" INTEGER NOT NULL DEFAULT 0,
  "last_download_at" TIMESTAMP(6),

  CONSTRAINT "ExportLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_export_log_therapist_date" ON "ExportLog"("therapist_id", "exported_at");

-- CreateIndex
CREATE INDEX "idx_export_log_date" ON "ExportLog"("exported_at");

-- AddForeignKey
ALTER TABLE "ExportLog" ADD CONSTRAINT "ExportLog_therapist_id_fkey"
  FOREIGN KEY ("therapist_id") REFERENCES "Therapist"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ExportLog" ADD CONSTRAINT "ExportLog_configuration_id_fkey"
  FOREIGN KEY ("configuration_id") REFERENCES "ExportConfiguration"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;
```

---

## Component Architecture

### Settings UI Components

**Directory:** `apps/web/app/dashboard/settings/components/`

#### 1. AccountingExportsTab.tsx

Main tab component for accounting exports.

```typescript
'use client'

import { useState } from 'react'
import { ExportConfigurationForm } from './ExportConfigurationForm'
import { ExportHistoryTable } from './ExportHistoryTable'
import { ExportPreviewModal } from './ExportPreviewModal'

export function AccountingExportsTab() {
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState(null)

  const handlePreview = async (formData) => {
    const response = await fetch('/api/exports/accounting/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    const data = await response.json()
    setPreviewData(data)
    setShowPreview(true)
  }

  const handleGenerate = async (formData) => {
    const response = await fetch('/api/exports/accounting/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })

    if (response.ok) {
      const blob = await response.blob()
      const filename = extractFilenameFromHeaders(response.headers)
      downloadBlob(blob, filename)
    }
  }

  return (
    <div className="space-y-8">
      <ExportConfigurationForm
        onPreview={handlePreview}
        onGenerate={handleGenerate}
      />

      <ExportHistoryTable />

      {showPreview && (
        <ExportPreviewModal
          data={previewData}
          onClose={() => setShowPreview(false)}
          onConfirm={handleGenerate}
        />
      )}
    </div>
  )
}
```

#### 2. ExportConfigurationForm.tsx

Form for configuring export parameters.

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const exportSchema = z.object({
  targetSystem: z.enum(['BMD', 'RZL', 'DATEV', 'CSV_GENERIC']),
  dateRangeStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dateRangeEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  statusFilter: z.array(z.enum(['SENT', 'PAID'])).min(1),
  options: z.object({
    consultantNumber: z.string().optional(),
    clientNumber: z.string().optional()
  }).optional()
})

export function ExportConfigurationForm({ onPreview, onGenerate }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(exportSchema),
    defaultValues: {
      targetSystem: 'BMD',
      dateRangeStart: getFirstDayOfPreviousMonth(),
      dateRangeEnd: getLastDayOfPreviousMonth(),
      statusFilter: ['SENT', 'PAID']
    }
  })

  return (
    <form className="space-y-6">
      <Select label="Target System" {...register('targetSystem')}>
        <option value="BMD">BMD (Austria)</option>
        <option value="RZL">RZL (Austria)</option>
        <option value="DATEV">DATEV (Germany/Austria)</option>
        <option value="CSV_GENERIC">Generic CSV</option>
      </Select>

      <div className="grid grid-cols-2 gap-4">
        <Input
          type="date"
          label="Start Date"
          {...register('dateRangeStart')}
          error={errors.dateRangeStart?.message}
        />
        <Input
          type="date"
          label="End Date"
          {...register('dateRangeEnd')}
          error={errors.dateRangeEnd?.message}
        />
      </div>

      <CheckboxGroup label="Include Invoice Status">
        <Checkbox label="Sent" {...register('statusFilter')} value="SENT" />
        <Checkbox label="Paid" {...register('statusFilter')} value="PAID" />
      </CheckboxGroup>

      <div className="flex gap-3">
        <Button variant="outline" onClick={handleSubmit(onPreview)}>
          Preview Export
        </Button>
        <Button onClick={handleSubmit(onGenerate)}>
          Generate & Download
        </Button>
      </div>
    </form>
  )
}
```

#### 3. ExportHistoryTable.tsx

Table displaying past exports with download links.

```typescript
'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Download } from 'lucide-react'

export function ExportHistoryTable() {
  const [exports, setExports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchExportHistory()
  }, [])

  const fetchExportHistory = async () => {
    const response = await fetch('/api/exports/accounting/history?limit=10')
    const data = await response.json()
    if (data.success) {
      setExports(data.data.exports)
    }
    setLoading(false)
  }

  const handleDownload = async (exportId: string) => {
    const response = await fetch(`/api/exports/accounting/download/${exportId}`)
    if (response.ok) {
      const blob = await response.blob()
      const filename = extractFilenameFromHeaders(response.headers)
      downloadBlob(blob, filename)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Export Date</TableHead>
          <TableHead>Format</TableHead>
          <TableHead>Date Range</TableHead>
          <TableHead>Invoices</TableHead>
          <TableHead>Revenue</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {exports.map((exp) => (
          <TableRow key={exp.id}>
            <TableCell>
              {format(new Date(exp.exportedAt), 'dd.MM.yyyy HH:mm', { locale: de })}
            </TableCell>
            <TableCell>{exp.targetSystem}</TableCell>
            <TableCell>
              {format(new Date(exp.dateRangeStart), 'dd.MM.yyyy', { locale: de })} -{' '}
              {format(new Date(exp.dateRangeEnd), 'dd.MM.yyyy', { locale: de })}
            </TableCell>
            <TableCell>{exp.invoiceCount}</TableCell>
            <TableCell>€{(exp.totalRevenueCents / 100).toFixed(2)}</TableCell>
            <TableCell>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDownload(exp.id)}
              >
                <Download className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

---

## Testing Requirements

### Unit Tests

**CSV Library Tests:**
- `packages/lib/src/__tests__/csv-export.test.ts`

```typescript
describe('exportToBMD', () => {
  it('includes all required fields', () => {
    const csv = exportToBMD([mockInvoice])
    expect(csv).toContain('Satzart;GKonto;Steuercode')
  })

  it('uses correct Kleinunternehmer account code', () => {
    const invoice = { ...mockInvoice, isKleinunternehmer: true }
    const csv = exportToBMD([invoice])
    expect(csv).toContain('RG;8400;;KU')
  })
})

describe('exportToDATEV', () => {
  it('uses correct BU-Schlüssel for 20% VAT', () => {
    const invoice = {
      ...mockInvoice,
      isKleinunternehmer: false,
      vatBreakdown: { '20': { netCents: 10000, vatCents: 2000, grossCents: 12000 } }
    }
    const csv = exportToDATEV([invoice])
    expect(csv).toMatch(/8300;1776;19/)
  })
})
```

### Integration Tests

**API Route Tests:**
- `apps/web/app/api/exports/accounting/generate/route.test.ts`

```typescript
describe('POST /api/exports/accounting/generate', () => {
  it('generates BMD export and creates log entry', async () => {
    const response = await POST(mockRequest)
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('text/csv; charset=utf-8')

    const logCount = await prisma.exportLog.count({
      where: { therapistId: mockTherapist.id }
    })
    expect(logCount).toBe(1)
  })
})
```

---

## Performance Optimization

### Query Optimization

```typescript
// Use select to limit fields
const invoices = await prisma.invoice.findMany({
  where: { ... },
  select: {
    id: true,
    number: true,
    createdAt: true,
    totalGrossCents: true,
    status: true,
    kleinunternehmer: true,
    lines: true,
    vatBreakdown: true,
    Client: {
      select: {
        name: true,
        street: true,
        postalCode: true,
        city: true
      }
    },
    Payments: {
      select: {
        status: true,
        createdAt: true
      }
    }
  }
})
```

### Streaming for Large Exports

For exports > 1000 invoices, use streaming response:

```typescript
import { Readable } from 'stream'

async function* generateCSVRows(invoices) {
  yield headers.join(';') + '\n'

  for (const invoice of invoices) {
    const row = formatInvoiceRow(invoice)
    yield row.join(';') + '\n'
  }
}

const stream = Readable.from(generateCSVRows(invoices))
return new Response(stream, {
  headers: { 'Content-Type': 'text/csv' }
})
```

---

## Security Considerations

### CSV Injection Prevention

```typescript
// Prevent CSV injection attacks
function sanitizeForCSV(value: string): string {
  // Remove leading =, +, -, @ (formula injection)
  if (/^[=+\-@]/.test(value)) {
    return `'${value}` // Prefix with single quote
  }
  return value
}
```

### Authorization Checks

```typescript
// Always verify therapist owns invoices
const invoices = await prisma.invoice.findMany({
  where: {
    therapistId: therapist.id,  // Critical: filter by logged-in therapist
    // ... other filters
  }
})
```

---

## References

- **Parent Spec:** `../spec.md`
- **API Spec:** `./api-spec.md`
- **CSV Export Library:** `packages/lib/src/csv-export.ts`
- **Database Schema:** `packages/db/schema.prisma`

---

**Last Updated:** October 16, 2025
