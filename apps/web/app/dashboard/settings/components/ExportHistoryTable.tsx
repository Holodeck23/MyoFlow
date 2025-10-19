'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Download, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui'
import {
  downloadBlob,
  extractFilenameFromHeaders,
  formatEuroFromCents,
  formatShortDate
} from './accounting-export-utils'

interface ExportHistoryEntry {
  id: string
  targetSystem: string
  exportType: string
  exportedAt: string
  dateRangeStart: string
  dateRangeEnd: string
  invoiceCount: number
  totalRevenueCents: number
  downloadCount: number
  lastDownloadAt: string | null
  fileName: string
  configurationName: string | null
}

interface ExportHistoryTableProps {
  refreshKey?: number
}

export function ExportHistoryTable({ refreshKey }: ExportHistoryTableProps) {
  const mountedRef = useRef(true)
  const [history, setHistory] = useState<ExportHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const loadHistory = useCallback(async () => {
    try {
      if (mountedRef.current) {
        setLoading(true)
      }
      const response = await fetch('/api/exports/accounting/history', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const errorMsg = errorData?.error || `Unable to load export history (${response.status})`
        throw new Error(errorMsg)
      }

      const json = await response.json()
      if (mountedRef.current) {
        if (json.success && Array.isArray(json.data)) {
          setHistory(json.data)
          setError(null)
        } else if (json.success && json.data == null) {
          setHistory([])
          setError(null)
        } else {
          setHistory([])
          setError(
            typeof json.error === 'string'
              ? json.error
              : 'Unable to load export history'
          )
        }
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Unable to load export history')
        setHistory([])
      }
    }

    if (mountedRef.current) {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory, refreshKey])

  const handleDownload = async (entry: ExportHistoryEntry) => {
    try {
      if (mountedRef.current) {
        setIsRefreshing(true)
      }
      const response = await fetch(`/api/exports/accounting/download/${entry.id}`)
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(
          data?.error ??
            'Unable to download export. Please regenerate the file and try again.'
        )
      }

      const blob = await response.blob()
      const filename = extractFilenameFromHeaders(response.headers, entry.fileName)
      downloadBlob(blob, filename)
      if (mountedRef.current) {
        setError(null)
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Download failed')
      }
    } finally {
      if (mountedRef.current) {
        setIsRefreshing(false)
      }
    }
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <span>Loading export history…</span>
        </div>
      )
    }

    if (history.length === 0 && !error) {
      return (
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <span>No past exports yet. Generate your first CSV to see it appear here.</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setHistory([])}
            disabled
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      )
    }

    return (
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium text-slate-600">Exported</th>
              <th className="px-4 py-3 font-medium text-slate-600">Format</th>
              <th className="px-4 py-3 font-medium text-slate-600">Date Range</th>
              <th className="px-4 py-3 font-medium text-slate-600">Invoices</th>
              <th className="px-4 py-3 font-medium text-slate-600">Revenue</th>
              <th className="px-4 py-3 font-medium text-slate-600">Downloads</th>
              <th className="px-4 py-3 font-medium text-slate-600 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {history.map(entry => (
              <tr key={entry.id}>
                <td className="px-4 py-3 text-slate-700">
                  {formatShortDate(entry.exportedAt)}{' '}
                  <span className="text-xs text-slate-500">
                    {new Date(entry.exportedAt).toLocaleTimeString('de-AT', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  {entry.configurationName && (
                    <div className="text-xs text-slate-500">{entry.configurationName}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-700">{entry.targetSystem}</td>
                <td className="px-4 py-3 text-slate-700">
                  {formatShortDate(entry.dateRangeStart)} –{' '}
                  {formatShortDate(entry.dateRangeEnd)}
                </td>
                <td className="px-4 py-3 text-slate-700">{entry.invoiceCount}</td>
                <td className="px-4 py-3 text-slate-700">
                  {formatEuroFromCents(entry.totalRevenueCents)}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {entry.downloadCount}
                  {entry.lastDownloadAt && (
                    <div className="text-xs text-slate-500">
                      {formatShortDate(entry.lastDownloadAt)}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDownload(entry)}
                    disabled={isRefreshing}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Recent Exports</h3>
        <Button type="button" size="sm" variant="outline" onClick={loadHistory} disabled={loading}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {error}
        </div>
      )}

      {renderContent()}
    </div>
  )
}
