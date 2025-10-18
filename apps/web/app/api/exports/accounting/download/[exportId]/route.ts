import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { prisma } from '@myoflow/db'
import {
  ACCOUNTING_EXPORT_TARGETS,
  AccountingCSVOptions,
  type AccountingExportTarget,
  buildCsvResponsePayload,
  fetchInvoicesForAccountingExport,
  generateCSVForTarget,
  prepareInvoicesForExport,
  resolveStatusFilter
} from '@/lib/accounting-exports'
import { handleAuthErrors, requireTherapist } from '@/lib/shared-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: { exportId: string } }
) {
  return handleAuthErrors(async () => {
    const { therapist } = await requireTherapist()
    const exportId = params.exportId

    const log = await prisma.exportLog.findFirst({
      where: {
        id: exportId,
        therapistId: therapist.id
      },
      include: {
        Configuration: true
      }
    })

    if (!log) {
      return NextResponse.json(
        {
          success: false,
          error: 'Export not found'
        },
        { status: 404 }
      )
    }

    if (!ACCOUNTING_EXPORT_TARGETS.includes(log.targetSystem as AccountingExportTarget)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Export format is no longer supported'
        },
        { status: 400 }
      )
    }

    const targetSystem = log.targetSystem as AccountingExportTarget

    const statusFilter = resolveStatusFilter({
      statusFilter: Array.isArray(
        (log.Configuration?.fieldMappings as any)?.statusFilter
      )
        ? ((log.Configuration?.fieldMappings as any)?.statusFilter ?? []).filter(
            (status: string) => status === 'SENT' || status === 'PAID'
          )
        : undefined,
      targetSystem,
      dateRangeStart: log.dateRangeStart.toISOString().slice(0, 10),
      dateRangeEnd: log.dateRangeEnd.toISOString().slice(0, 10)
    })

    const invoices = await fetchInvoicesForAccountingExport(
      prisma,
      therapist.id,
      log.dateRangeStart,
      log.dateRangeEnd,
      statusFilter
    )

    const preparation = prepareInvoicesForExport(invoices)

    if (preparation.validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Export contains validation errors',
          details: {
            invoiceValidationErrors: preparation.validationErrors,
            warningCount: preparation.validationWarnings.length,
            excludedDraftCount: preparation.excludedDraftCount
          }
        },
        { status: 409 }
      )
    }

    const csvOptions: AccountingCSVOptions = {}
    const csvContent = generateCSVForTarget(targetSystem, preparation.invoices, csvOptions)
    const { csvWithBom, sizeInBytes } = buildCsvResponsePayload(csvContent)

    await prisma.exportLog.update({
      where: { id: log.id },
      data: {
        downloadCount: log.downloadCount + 1,
        lastDownloadAt: new Date(),
        fileSize: sizeInBytes,
        invoiceCount: preparation.invoices.length,
        totalRevenueCents: preparation.totalRevenueCents
      }
    })

    const headers = new Headers()
    headers.set('Content-Type', 'text/csv; charset=utf-8')
    headers.set('Content-Disposition', `attachment; filename="${log.fileName}"`)
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
