import { endOfDay, parseISO, startOfDay } from 'date-fns'
import { z } from 'zod'
import type { Prisma, PrismaClient, InvoiceStatus } from '@myoflow/db'
import {
  exportToBMD,
  exportToDATEV,
  exportToGenericCSV,
  exportToRZL,
  generateExportFilename,
  InvoiceExportStatus,
  InvoiceForExport,
  addUTF8BOM,
  validateInvoiceForExport
} from '@myoflow/lib'

export const ACCOUNTING_EXPORT_TARGETS = ['BMD', 'RZL', 'DATEV', 'CSV_GENERIC'] as const
export type AccountingExportTarget = (typeof ACCOUNTING_EXPORT_TARGETS)[number]

const INVOICE_STATUS_FILTERS = ['SENT', 'PAID'] as const
export type AccountingExportStatusFilter = (typeof INVOICE_STATUS_FILTERS)[number]

export const accountingExportOptionsSchema = z
  .object({
    consultantNumber: z.string().optional(),
    clientNumber: z.string().optional(),
    separator: z.enum([',', ';']).optional(),
    dateFormat: z.enum(['dd.MM.yyyy', 'yyyy-MM-dd']).optional(),
    includeHeader: z.boolean().optional(),
    accountCode: z.string().optional(),
    taxCode: z.string().optional()
  })
  .partial()

export const accountingExportRequestSchema = z.object({
  targetSystem: z.enum(ACCOUNTING_EXPORT_TARGETS),
  dateRangeStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dateRangeStart must be YYYY-MM-DD'),
  dateRangeEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dateRangeEnd must be YYYY-MM-DD'),
  statusFilter: z
    .array(z.enum(INVOICE_STATUS_FILTERS))
    .min(1)
    .optional(),
  configurationId: z.string().optional(),
  options: accountingExportOptionsSchema.optional()
})

export type AccountingExportRequest = z.infer<typeof accountingExportRequestSchema>

export interface AccountingExportParams {
  therapistId: string
  request: AccountingExportRequest
}

export interface InvoiceValidationIssue {
  invoiceId: string
  invoiceNumber: string
  errors: string[]
}

export interface InvoiceValidationWarning {
  invoiceId: string
  invoiceNumber: string
  message: string
  type: 'MISSING_CLIENT_ADDRESS' | 'VAT_MISMATCH' | 'HIGH_AMOUNT' | 'GENERAL_WARNING'
}

export interface AccountingExportPreparation {
  invoices: InvoiceForExport[]
  validationErrors: InvoiceValidationIssue[]
  validationWarnings: InvoiceValidationWarning[]
  excludedDraftCount: number
  totalRevenueCents: number
}

type InvoiceWithRelations = Prisma.InvoiceGetPayload<{
  include: {
    Client: {
      select: {
        name: true
        street: true
        postalCode: true
        city: true
      }
    }
    Payments: {
      select: {
        status: true
      }
    }
  }
}>

export function resolveStatusFilter(
  request: AccountingExportRequest
): AccountingExportStatusFilter[] {
  return request.statusFilter?.length
    ? (request.statusFilter as AccountingExportStatusFilter[])
    : ['SENT', 'PAID']
}

export function resolveDateRange(input: Pick<AccountingExportRequest, 'dateRangeStart' | 'dateRangeEnd'>) {
  const start = startOfDay(parseISO(`${input.dateRangeStart}`))
  const end = endOfDay(parseISO(`${input.dateRangeEnd}`))

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error('Invalid date range supplied')
  }

  if (end.getTime() < start.getTime()) {
    throw new Error('dateRangeEnd must be on or after dateRangeStart')
  }

  return { start, end }
}

export function mapInvoiceToExport(invoice: InvoiceWithRelations): InvoiceForExport {
  return {
    id: invoice.id,
    number: invoice.number,
    createdAt: invoice.createdAt,
    clientName: invoice.Client?.name || 'Unknown Client',
    clientAddress: buildClientAddress(invoice.Client),
    totalGrossCents: invoice.totalGrossCents,
    status: invoice.status as InvoiceExportStatus,
    isKleinunternehmer: invoice.kleinunternehmer,
    lines: invoice.lines,
    vatBreakdown: invoice.vatBreakdown,
    payments:
      invoice.Payments?.map(payment => ({
        status: payment.status
      })) ?? []
  }
}

export function prepareInvoicesForExport(invoices: InvoiceWithRelations[]): AccountingExportPreparation {
  const mappedInvoices = invoices.map(mapInvoiceToExport)
  const exportInvoices = mappedInvoices.filter(invoice => invoice.status !== 'DRAFT')
  const excludedDraftCount = mappedInvoices.length - exportInvoices.length

  const validationErrors: InvoiceValidationIssue[] = []
  const validationWarnings: InvoiceValidationWarning[] = []

  mappedInvoices.forEach(invoice => {
    const result = validateInvoiceForExport(invoice)

    if (result.errors.length > 0) {
      validationErrors.push({
        invoiceId: invoice.id,
        invoiceNumber: invoice.number,
        errors: result.errors
      })
    }

    if (result.warnings.length > 0) {
      result.warnings.forEach(message => {
        validationWarnings.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.number,
          message,
          type: categorizeWarning(message)
        })
      })
    }
  })

  const totalRevenueCents = exportInvoices.reduce(
    (sum, invoice) => sum + invoice.totalGrossCents,
    0
  )

  return {
    invoices: exportInvoices,
    validationErrors,
    validationWarnings,
    excludedDraftCount,
    totalRevenueCents
  }
}

export interface AccountingCSVOptions {
  separator?: ',' | ';'
  includeHeader?: boolean
  dateFormat?: 'dd.MM.yyyy' | 'yyyy-MM-dd'
  consultantNumber?: string
  clientNumber?: string
  accountCode?: string
  taxCode?: string
}

export function generateCSVForTarget(
  targetSystem: AccountingExportTarget,
  invoices: InvoiceForExport[],
  options: AccountingCSVOptions = {}
): string {
  switch (targetSystem) {
    case 'BMD':
      return exportToBMD(invoices, {
        separator: options.separator ?? ';',
        includeHeader: options.includeHeader ?? true,
        accountCode: options.accountCode,
        taxCode: options.taxCode
      })
    case 'RZL':
      return exportToRZL(invoices, {
        separator: options.separator ?? ';',
        includeHeader: options.includeHeader ?? true
      })
    case 'DATEV':
      return exportToDATEV(invoices, {
        separator: options.separator ?? ';',
        includeHeader: options.includeHeader ?? true,
        consultantNumber: options.consultantNumber,
        clientNumber: options.clientNumber
      })
    case 'CSV_GENERIC':
    default:
      return exportToGenericCSV(invoices, {
        separator: options.separator ?? ',',
        includeHeader: options.includeHeader ?? true,
        dateFormat: options.dateFormat ?? 'dd.MM.yyyy'
      })
  }
}

export function generatePreviewRows(
  targetSystem: AccountingExportTarget,
  invoices: InvoiceForExport[],
  options: AccountingCSVOptions = {},
  limit = 10
): string[] {
  if (invoices.length === 0) {
    return []
  }

  const previewInvoices = invoices.slice(0, Math.max(0, limit))
  const csv = generateCSVForTarget(targetSystem, previewInvoices, {
    ...options,
    includeHeader: true
  })

  return csv.split('\n').filter(line => line.trim().length > 0)
}

export function buildExportFilename(
  targetSystem: AccountingExportTarget,
  start: Date,
  end: Date
): string {
  return generateExportFilename(targetSystem, start, end)
}

export function buildCsvResponsePayload(csvContent: string) {
  const csvWithBom = addUTF8BOM(csvContent)
  const sizeInBytes = Buffer.from(csvWithBom, 'utf8').length

  return { csvWithBom, sizeInBytes }
}

type InvoiceClient = Pick<PrismaClient, 'invoice'>

export async function fetchInvoicesForAccountingExport(
  client: InvoiceClient,
  therapistId: string,
  start: Date,
  end: Date,
  statuses: AccountingExportStatusFilter[]
) {
  const statusesForQuery = Array.from(
    new Set<InvoiceStatus>([
      ...statuses.map(status => status as InvoiceStatus),
      'DRAFT'
    ])
  )

  return client.invoice.findMany({
    where: {
      therapistId,
      createdAt: {
        gte: start,
        lte: end
      },
      status: { in: statusesForQuery }
    },
    orderBy: { createdAt: 'asc' },
    include: {
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
          status: true
        }
      }
    }
  }) as Promise<InvoiceWithRelations[]>
}

function categorizeWarning(message: string): InvoiceValidationWarning['type'] {
  if (message.toLowerCase().includes('client address')) {
    return 'MISSING_CLIENT_ADDRESS'
  }
  if (message.toLowerCase().includes('vat calculation mismatch')) {
    return 'VAT_MISMATCH'
  }
  if (message.toLowerCase().includes('unusually high invoice amount')) {
    return 'HIGH_AMOUNT'
  }
  return 'GENERAL_WARNING'
}

function buildClientAddress(
  client:
    | {
        street?: string | null
        postalCode?: string | null
        city?: string | null
      }
    | null
    | undefined
): string {
  if (!client) {
    return ''
  }

  const parts = [client.street, client.postalCode, client.city].filter(
    (value): value is string => Boolean(value && value.trim().length > 0)
  )

  return parts.join(', ')
}
