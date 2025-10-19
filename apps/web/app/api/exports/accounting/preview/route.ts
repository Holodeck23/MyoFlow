import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { prisma } from '@myoflow/db'
import {
  accountingExportRequestSchema,
  buildNoInvoicesMessage,
  fetchInvoicesForAccountingExport,
  formatDateRangeForMessage,
  formatStatusList,
  generatePreviewRows,
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

    let start: Date
    let end: Date
    try {
      ;({ start, end } = resolveDateRange(requestPayload))
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Invalid date range supplied'
      return NextResponse.json(
        {
          success: false,
          error: message
        },
        { status: 400 }
      )
    }

    const invoices = await fetchInvoicesForAccountingExport(
      prisma,
      therapist.id,
      start,
      end,
      statusFilter
    )

    const preparation = prepareInvoicesForExport(invoices)

    if (preparation.invoices.length === 0) {
      const totalInvoices = await prisma.invoice.count({
        where: { therapistId: therapist.id }
      })
      const message = buildNoInvoicesMessage({
        start,
        end,
        statuses: statusFilter,
        totalInvoices
      })

      return NextResponse.json(
        {
          success: false,
          error: message,
          details: {
            invoiceCount: 0,
            totalInvoices,
            warningCount: preparation.validationWarnings.length,
            excludedDraftCount: preparation.excludedDraftCount,
            dateRange: formatDateRangeForMessage(start, end),
            statusFilter: formatStatusList(statusFilter)
          }
        },
        { status: 404 }
      )
    }
    const previewRows = generatePreviewRows(
      requestPayload.targetSystem,
      preparation.invoices,
      requestPayload.options ?? {},
      10
    )

    return NextResponse.json(
      {
        success: true,
        data: {
          invoiceCount: preparation.invoices.length,
          totalRevenueCents: preparation.totalRevenueCents,
          dateRangeStart: start.toISOString(),
          dateRangeEnd: end.toISOString(),
          targetSystem: requestPayload.targetSystem,
          previewRows,
          validationWarnings: preparation.validationWarnings,
          warningCount: preparation.validationWarnings.length,
          excludedDraftCount: preparation.excludedDraftCount
        }
      },
      { status: 200 }
    )
  })
}
