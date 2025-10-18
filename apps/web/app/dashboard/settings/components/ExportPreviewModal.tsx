'use client'

import React from 'react'
import { Button } from '@/components/ui'
import { formatEuroFromCents, formatShortDate } from './accounting-export-utils'

interface ExportPreviewData {
  invoiceCount: number
  totalRevenueCents: number
  dateRangeStart: string
  dateRangeEnd: string
  targetSystem: string
  previewRows: string[]
  validationWarnings: Array<{
    invoiceId: string
    invoiceNumber: string
    message: string
    type: string
  }>
  warningCount: number
  excludedDraftCount: number
}

interface ExportPreviewModalProps {
  data: ExportPreviewData
  onClose: () => void
  onConfirm: () => void | Promise<void>
  isGenerating?: boolean
}

export function ExportPreviewModal({
  data,
  onClose,
  onConfirm,
  isGenerating
}: ExportPreviewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Preview Export</h2>
          <p className="text-sm text-slate-600">
            Review invoice coverage and warnings before generating the CSV file.
          </p>
        </div>

        <div className="space-y-6 overflow-y-auto px-6 py-6">
          <section className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
            <Statistic label="Target system" value={data.targetSystem} />
            <Statistic
              label="Invoice count"
              value={`${data.invoiceCount}${data.excludedDraftCount ? ` (excluding ${data.excludedDraftCount} draft)` : ''}`}
            />
            <Statistic
              label="Revenue covered"
              value={formatEuroFromCents(data.totalRevenueCents)}
            />
            <Statistic
              label="Date range"
              value={`${formatShortDate(data.dateRangeStart)} – ${formatShortDate(data.dateRangeEnd)}`}
              span={3}
            />
          </section>

          {data.validationWarnings.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-amber-700">
                {data.validationWarnings.length} warning
                {data.validationWarnings.length === 1 ? '' : 's'} detected
              </h3>
              <ul className="space-y-2">
                {data.validationWarnings.map(warning => (
                  <li
                    key={`${warning.invoiceId}-${warning.message}`}
                    className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
                  >
                    <span className="font-medium">{warning.invoiceNumber}</span>: {warning.message}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-800">CSV preview</h3>
            <div className="max-h-60 overflow-auto rounded-md border border-slate-200 bg-slate-900">
              <pre className="whitespace-pre text-xs text-slate-50">
                {data.previewRows.join('\n')}
              </pre>
            </div>
          </section>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-6 py-4">
          <p className="text-xs text-slate-500">
            CSV preview shows the first 10 rows. Warnings do not block export but should
            be reviewed.
          </p>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button type="button" onClick={onConfirm} disabled={isGenerating}>
              {isGenerating ? 'Generating…' : 'Download CSV'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface StatisticProps {
  label: string
  value: string
  span?: number
}

function Statistic({ label, value, span = 1 }: StatisticProps) {
  const spanClass = span === 3 ? 'sm:col-span-3' : span === 2 ? 'sm:col-span-2' : ''
  return (
    <div className={`flex flex-col gap-1 ${spanClass}`}>
      <span className="text-xs uppercase tracking-wide text-slate-500">{label}</span>
      <span className="text-base font-semibold text-slate-900">{value}</span>
    </div>
  )
}
