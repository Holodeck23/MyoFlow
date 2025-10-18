import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { prisma } from '@myoflow/db'
import {
  AccountingCSVOptions,
  accountingExportRequestSchema,
  buildCsvResponsePayload,
  buildExportFilename,
  fetchInvoicesForAccountingExport,
  generateCSVForTarget,
  prepareInvoicesForExport,
  resolveDateRange,
  resolveStatusFilter
} from '@/lib/accounting-exports'
import { handleAuthErrors, requireTherapist } from '@/lib/shared-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  return handleAuthErrors(async () => {
    const { therapist } = await requireTherapist()

    const rawBody = await request.json().catch(() => ({}))
    const parseResult = accountingExportRequestSchema.safeParse(rawBody)

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request payload',
          details: parseResult.error.flatten()
        },
        { status: 400 }
      )
    }

    const requestPayload = parseResult.data
    const statusFilter = resolveStatusFilter(requestPayload)
    const { start, end } = resolveDateRange(requestPayload)

    const invoices = await fetchInvoicesForAccountingExport(
      prisma,
      therapist.id,
      start,
      end,
      statusFilter
    )

    const preparation = prepareInvoicesForExport(invoices)

    if (preparation.validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: {
            invoiceValidationErrors: preparation.validationErrors,
            warningCount: preparation.validationWarnings.length,
            excludedDraftCount: preparation.excludedDraftCount
          }
        },
        { status: 400 }
      )
    }

    if (preparation.invoices.length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: 'No invoices found in date range',
          invoiceCount: 0,
          warningCount: preparation.validationWarnings.length,
          excludedDraftCount: preparation.excludedDraftCount
        },
        { status: 200 }
      )
    }

    const csvOptions: AccountingCSVOptions = requestPayload.options ?? {}
    const csvContent = generateCSVForTarget(
      requestPayload.targetSystem,
      preparation.invoices,
      csvOptions
    )
    const { csvWithBom, sizeInBytes } = buildCsvResponsePayload(csvContent)
    const filename = buildExportFilename(
      requestPayload.targetSystem,
      start,
      end
    )

    await prisma.exportLog.create({
      data: {
        therapistId: therapist.id,
        configurationId: requestPayload.configurationId ?? null,
        exportType: 'ACCOUNTING_EXPORT',
        targetSystem: requestPayload.targetSystem,
        dateRangeStart: start,
        dateRangeEnd: end,
        invoiceCount: preparation.invoices.length,
        totalRevenueCents: preparation.totalRevenueCents,
        exportedAt: new Date(),
        fileSize: sizeInBytes,
        fileName: filename
      }
    })

    const headers = new Headers()
    headers.set('Content-Type', 'text/csv; charset=utf-8')
    headers.set('Content-Disposition', `attachment; filename="${filename}"`)
    headers.set(
      'X-Accounting-Warning-Count',
      preparation.validationWarnings.length.toString()
    )
    headers.set('Cache-Control', 'no-store')

    return new NextResponse(csvWithBom, {
      status: 200,
      headers
    })
  })
}
