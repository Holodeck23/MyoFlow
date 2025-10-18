import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { prisma } from '@myoflow/db'
import {
  accountingExportRequestSchema,
  fetchInvoicesForAccountingExport,
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
    const { start, end } = resolveDateRange(requestPayload)

    const invoices = await fetchInvoicesForAccountingExport(
      prisma,
      therapist.id,
      start,
      end,
      statusFilter
    )

    const preparation = prepareInvoicesForExport(invoices)
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
