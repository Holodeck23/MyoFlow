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

const ACCOUNTING_TIME_ZONE = 'Europe/Vienna'
const HUMAN_DATE_FORMATTER = new Intl.DateTimeFormat('de-AT', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
})

function mapStatusToLabel(status: AccountingExportStatusFilter): string {
  switch (status) {
    case 'SENT':
      return 'Sent'
    case 'PAID':
      return 'Paid'
    default:
      return status
  }
}

function getTimeZoneOffset(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  const parts = dtf.formatToParts(date)
  const mapped: Record<string, string> = {}
  for (const { type, value } of parts) {
    if (type !== 'literal') {
      mapped[type] = value
    }
  }
  const asUTC = Date.UTC(
    Number(mapped.year),
    Number(mapped.month) - 1,
    Number(mapped.day),
    Number(mapped.hour),
    Number(mapped.minute),
    Number(mapped.second)
  )
  return (asUTC - date.getTime()) / 60000
}

function createZonedDate(
  dateString: string,
  time: { hour: number; minute: number; second: number; millisecond: number },
  timeZone: string = ACCOUNTING_TIME_ZONE
): Date {
  const [yearStr, monthStr, dayStr] = dateString.split('-')
  const year = Number(yearStr)
  const month = Number(monthStr)
  const day = Number(dayStr)

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    throw new Error('Invalid date format, expected YYYY-MM-DD')
  }

  const utcDate = new Date(
    Date.UTC(year, month - 1, day, time.hour, time.minute, time.second, time.millisecond)
  )
  const offsetMinutes = getTimeZoneOffset(utcDate, timeZone)
  return new Date(utcDate.getTime() - offsetMinutes * 60_000)
}

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
  const statuses =
    request.statusFilter && request.statusFilter.length > 0
      ? request.statusFilter
      : (['SENT', 'PAID'] as AccountingExportStatusFilter[])
  return Array.from(new Set(statuses)) as AccountingExportStatusFilter[]
}

export function resolveDateRange(
  input: Pick<AccountingExportRequest, 'dateRangeStart' | 'dateRangeEnd'>
) {
  if (input.dateRangeEnd < input.dateRangeStart) {
    throw new Error('dateRangeEnd must be on or after dateRangeStart')
  }

  const start = createZonedDate(input.dateRangeStart, {
    hour: 0,
    minute: 0,
    second: 0,
    millisecond: 0
  })
  const end = createZonedDate(input.dateRangeEnd, {
    hour: 23,
    minute: 59,
    second: 59,
    millisecond: 999
  })

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

export function formatStatusList(statuses: AccountingExportStatusFilter[]): string {
  return statuses.map(mapStatusToLabel).join(', ')
}

export function formatDateRangeForMessage(start: Date, end: Date): string {
  return `${HUMAN_DATE_FORMATTER.format(start)} – ${HUMAN_DATE_FORMATTER.format(end)}`
}

export function buildNoInvoicesMessage(params: {
  start: Date
  end: Date
  statuses: AccountingExportStatusFilter[]
  totalInvoices: number
}): string {
  const { start, end, statuses, totalInvoices } = params
  const formattedRange = formatDateRangeForMessage(start, end)
  const statusList = formatStatusList(statuses)
  const totalPart =
    totalInvoices === 0
      ? 'You have no invoices yet for this account.'
      : `You currently have ${totalInvoices} invoice${totalInvoices === 1 ? '' : 's'} in total.`

  return `No invoices found between ${formattedRange} with statuses ${statusList}. ${totalPart} Try adjusting the date range or invoice status filters.`
}
