import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export interface InvoiceForExport {
  id: string;
  number: string;
  createdAt: Date;
  clientName: string;
  clientAddress?: string;
  totalGrossCents: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'VOID' | 'OVERDUE';
  isKleinunternehmer: boolean;
  lines: any;
  vatBreakdown: any;
}

export interface BMDExportOptions {
  separator?: string;
  encoding?: string;
  includeHeader?: boolean;
}

export interface RZLExportOptions {
  separator?: string;
  encoding?: string;
  includeHeader?: boolean;
}

export interface DATEVExportOptions {
  separator?: string;
  encoding?: string;
  includeHeader?: boolean;
  consultantNumber?: string;
  clientNumber?: string;
}

/**
 * Export invoices to BMD format (Austrian accounting software)
 * BMD uses semicolon-separated values with German date formats
 */
export function exportToBMD(
  invoices: InvoiceForExport[],
  options: BMDExportOptions = {}
): string {
  const { separator = ';', includeHeader = true } = options;
  
  const headers = [
    'Rechnungsnummer',
    'Rechnungsdatum',
    'Kunde',
    'Kundenadresse',
    'Bruttobetrag',
    'Status',
    'Kleinunternehmer'
  ];

  const rows = invoices.map(invoice => [
    invoice.number,
    format(invoice.createdAt, 'dd.MM.yyyy', { locale: de }),
    `"${invoice.clientName}"`,
    `"${invoice.clientAddress || ''}"`,
    (invoice.totalGrossCents / 100).toFixed(2).replace('.', ','),
    invoice.status,
    invoice.isKleinunternehmer ? 'Ja' : 'Nein'
  ]);

  const csvLines: string[] = [];
  
  if (includeHeader) {
    csvLines.push(headers.join(separator));
  }
  
  rows.forEach(row => {
    csvLines.push(row.join(separator));
  });

  return csvLines.join('\n');
}

/**
 * Export invoices to RZL format (Austrian accounting software)
 * RZL uses semicolon-separated values with specific Austrian formatting
 */
export function exportToRZL(
  invoices: InvoiceForExport[],
  options: RZLExportOptions = {}
): string {
  const { separator = ';', includeHeader = true } = options;
  
  const headers = [
    'RE_NR',
    'RE_DATUM',
    'KUNDE',
    'ADRESSE',
    'BRUTTO_EUR',
    'STATUS',
    'KU_STATUS'
  ];

  const rows = invoices.map(invoice => [
    invoice.number,
    format(invoice.createdAt, 'dd.MM.yyyy'),
    invoice.clientName.replace(/"/g, '""'),
    (invoice.clientAddress || '').replace(/"/g, '""'),
    (invoice.totalGrossCents / 100).toFixed(2),
    invoice.status,
    invoice.isKleinunternehmer ? '1' : '0'
  ]);

  const csvLines: string[] = [];
  
  if (includeHeader) {
    csvLines.push(headers.join(separator));
  }
  
  rows.forEach(row => {
    csvLines.push(row.join(separator));
  });

  return csvLines.join('\n');
}

/**
 * Export invoices to DATEV format (German/Austrian accounting software)
 * DATEV has strict formatting requirements for import compatibility
 */
export function exportToDATEV(
  invoices: InvoiceForExport[],
  options: DATEVExportOptions = {}
): string {
  const { separator = ';', includeHeader = true, consultantNumber = '', clientNumber = '' } = options;
  
  // DATEV requires specific header format
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
  ];

  const rows = invoices.map(invoice => {
    // DATEV format requires specific account mapping
    const account = invoice.isKleinunternehmer ? '8400' : '8300'; // Revenue accounts
    const taxAccount = invoice.isKleinunternehmer ? '' : '1776'; // VAT account
    
    return [
      (invoice.totalGrossCents / 100).toFixed(2).replace('.', ','),
      'S', // Soll (Debit)
      'EUR',
      '',
      (invoice.totalGrossCents / 100).toFixed(2).replace('.', ','),
      'EUR',
      account,
      taxAccount,
      invoice.isKleinunternehmer ? '' : '19', // VAT code for 20% (Austrian standard)
      format(invoice.createdAt, 'ddMMyyyy', { locale: de }),
      invoice.number,
      `"${invoice.clientName}"`,
      '',
      `"Massage/Therapie-Leistung"`
    ];
  });

  const csvLines: string[] = [];
  
  if (includeHeader) {
    csvLines.push(headers.join(separator));
  }
  
  rows.forEach(row => {
    csvLines.push(row.join(separator));
  });

  return csvLines.join('\n');
}

/**
 * Generate filename for CSV export with Austrian date format
 */
export function generateExportFilename(
  exportFormat: 'BMD' | 'RZL' | 'DATEV',
  fromDate: Date,
  toDate: Date
): string {
  const fromStr = format(fromDate, 'yyyy-MM-dd');
  const toStr = format(toDate, 'yyyy-MM-dd');
  const timestamp = format(new Date(), 'yyyyMMdd-HHmm');
  
  return `MyoFlow-${exportFormat}-Export-${fromStr}-${toStr}-${timestamp}.csv`;
}

/**
 * Validate invoice data for export completeness
 */
export function validateInvoiceForExport(invoice: InvoiceForExport): string[] {
  const errors: string[] = [];
  
  if (!invoice.number) {
    errors.push('Invoice number is required');
  }
  
  if (!invoice.clientName) {
    errors.push('Client name is required');
  }
  
  if (invoice.totalGrossCents <= 0) {
    errors.push('Gross amount must be positive');
  }
  
  if (invoice.status === 'DRAFT') {
    errors.push('Draft invoices should not be exported to accounting');
  }
  
  return errors;
}