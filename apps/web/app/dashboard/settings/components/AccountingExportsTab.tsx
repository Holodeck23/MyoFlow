'use client'

import React, { useCallback, useMemo, useState } from 'react'
import type { ExportConfigurationFormData } from './ExportConfigurationForm'
import { ExportConfigurationForm } from './ExportConfigurationForm'
import { ExportHistoryTable } from './ExportHistoryTable'
import { ExportPreviewModal } from './ExportPreviewModal'
import {
  downloadBlob,
  extractFilenameFromHeaders,
  formatShortDate
} from './accounting-export-utils'

interface PreviewResponse {
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

export function AccountingExportsTab() {
  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [isGenerateLoading, setIsGenerateLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formInfo, setFormInfo] = useState<string | null>(null)
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0)
  const [lastPayload, setLastPayload] = useState<ExportConfigurationFormData | null>(null)

  const previewFallbackFilename = useMemo(() => {
    const today = new Date()
    return `MyoFlow-accounting-export-${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}.csv`
  }, [])

  const handlePreview = useCallback(
    async (payload: ExportConfigurationFormData) => {
      setFormError(null)
      setFormInfo(null)
      setIsPreviewLoading(true)
      setLastPayload(payload)

      try {
        const response = await fetch('/api/exports/accounting/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (!response.ok) {
          const json = await response.json().catch(() => null)
          setFormError(json?.error ?? 'Unable to generate preview. Please try again.')
          return
        }

        const json = await response.json()
        if (json.success && json.data) {
          setPreviewData(json.data)
          setShowPreview(true)
        } else {
          setFormError('Preview did not return data. Please try again.')
        }
      } catch (error) {
        setFormError(
          error instanceof Error ? error.message : 'Unable to generate preview.'
        )
      } finally {
        setIsPreviewLoading(false)
      }
    },
    []
  )

  const handleGenerate = useCallback(
    async (payload: ExportConfigurationFormData) => {
      setFormError(null)
      setFormInfo(null)
      setIsGenerateLoading(true)
      setLastPayload(payload)

      try {
        const response = await fetch('/api/exports/accounting/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        const contentType = response.headers.get('Content-Type') ?? ''

        if (!response.ok) {
          const json = await response.json().catch(() => null)
          const baseMessage =
            json?.error ?? 'Export could not be generated. Please review the inputs.'
          if (json?.details?.invoiceValidationErrors) {
            const detailsCount = json.details.invoiceValidationErrors.length
            setFormError(
              `${baseMessage} ${detailsCount} invoice${
                detailsCount === 1 ? ' has' : 's have'
              } blocking issues.`
            )
          } else {
            setFormError(baseMessage)
          }
          return
        }

        if (contentType.includes('text/csv')) {
          const blob = await response.blob()
          const filename = extractFilenameFromHeaders(
            response.headers,
            previewFallbackFilename
          )
          downloadBlob(blob, filename)
          setFormInfo('Export downloaded successfully.')
          setHistoryRefreshKey(key => key + 1)
          setShowPreview(false)
          setPreviewData(null)
          return
        }

        const json = await response.json().catch(() => null)
        if (json?.invoiceCount === 0) {
          setFormInfo('No invoices found for the selected period.')
        } else {
          setFormInfo('Export completed successfully.')
        }
        setHistoryRefreshKey(key => key + 1)
        setShowPreview(false)
        setPreviewData(null)
      } catch (error) {
        setFormError(
          error instanceof Error ? error.message : 'Failed to generate export.'
        )
      } finally {
        setIsGenerateLoading(false)
      }
    },
    [previewFallbackFilename]
  )

  const handleModalConfirm = useCallback(() => {
    if (lastPayload) {
      void handleGenerate(lastPayload)
    }
  }, [handleGenerate, lastPayload])

  return (
    <div className="space-y-10">
      <ExportConfigurationForm
        onPreview={handlePreview}
        onGenerate={handleGenerate}
        isPreviewLoading={isPreviewLoading}
        isGenerateLoading={isGenerateLoading}
        errorMessage={formError}
        infoMessage={formInfo}
      />

      <ExportHistoryTable refreshKey={historyRefreshKey} />

      {showPreview && previewData && (
        <ExportPreviewModal
          data={previewData}
          onClose={() => setShowPreview(false)}
          onConfirm={handleModalConfirm}
          isGenerating={isGenerateLoading}
        />
      )}

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
        <h4 className="text-sm font-semibold text-slate-800">Need a reminder?</h4>
        <p className="mt-1">
          Austrian therapists submit monthly accounting exports by the 15th of the second
          month. Use the preview to double-check data before sending it to your tax
          advisor. Each download is logged for audit trail compliance.
        </p>
        {lastPayload && (
          <p className="mt-2">
            Last configuration: {lastPayload.targetSystem} (
            {formatShortDate(lastPayload.dateRangeStart)} –{' '}
            {formatShortDate(lastPayload.dateRangeEnd)})
          </p>
        )}
      </div>
    </div>
  )
}
