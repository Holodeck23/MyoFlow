'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

interface CSVExportManagerProps {
  therapistId?: string
}

export default function CSVExportManager({ therapistId }: CSVExportManagerProps) {
  const [loading, setLoading] = useState(false)
  const getLastMonth = () => {
    const date = new Date()
    date.setMonth(date.getMonth() - 1)
    return date.toISOString().split('T')[0]
  }

  const [fromDate, setFromDate] = useState(getLastMonth())
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedFormat, setSelectedFormat] = useState<'BMD' | 'RZL' | 'DATEV'>('BMD')
  const [includeHeader, setIncludeHeader] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const exportFormats = [
    {
      value: 'BMD' as const,
      label: 'BMD',
      description: 'BMD NTCS accounting software format with Austrian formatting'
    },
    {
      value: 'RZL' as const,
      label: 'RZL',
      description: 'RZL accounting software format with semicolon separation'
    },
    {
      value: 'DATEV' as const,
      label: 'DATEV',
      description: 'DATEV format for German/Austrian tax preparation software'
    }
  ]

  const handleExport = async (exportFormat: 'BMD' | 'RZL' | 'DATEV') => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const params = new URLSearchParams({
        format: exportFormat,
        fromDate,
        toDate,
        includeHeader: includeHeader.toString()
      })

      const response = await fetch(`/api/invoices/export?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Export failed')
      }

      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition')
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `MyoFlow-${exportFormat}-Export-${new Date().toISOString().split('T')[0]}.csv`

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setSuccess(`Successfully exported ${exportFormat} format`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          CSV Export for Accounting Software
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Export your invoice data in formats compatible with popular Austrian accounting software.
        </p>
      </div>

      {/* Date Range Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="fromDate" className="block text-sm font-medium text-gray-700 mb-1">
            From Date
          </label>
          <input
            type="date"
            id="fromDate"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="toDate" className="block text-sm font-medium text-gray-700 mb-1">
            To Date
          </label>
          <input
            type="date"
            id="toDate"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Export Options */}
      <div>
        <div className="flex items-center mb-4">
          <input
            id="includeHeader"
            type="checkbox"
            checked={includeHeader}
            onChange={(e) => setIncludeHeader(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="includeHeader" className="ml-2 block text-sm text-gray-700">
            Include column headers in export
          </label>
        </div>
      </div>

      {/* Format Selection and Export Buttons */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900">Select Export Format</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {exportFormats.map((format) => (
            <div
              key={format.value}
              className="relative border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-sm font-medium text-gray-900">{format.label}</h5>
                <input
                  type="radio"
                  name="exportFormat"
                  value={format.value}
                  checked={selectedFormat === format.value}
                  onChange={(e) => setSelectedFormat(e.target.value as any)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
              </div>
              <p className="text-xs text-gray-600 mb-3">{format.description}</p>
              <Button
                onClick={() => handleExport(format.value)}
                disabled={loading}
                className="w-full"
                size="sm"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Exporting...
                  </>
                ) : (
                  `Export ${format.label}`
                )}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-4 bg-red-50 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Export Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Export Successful</h3>
              <p className="text-sm text-green-700 mt-1">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Usage Instructions */}
      <div className="bg-blue-50 p-4 rounded-md">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Usage Instructions</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• <strong>BMD:</strong> Import via &ldquo;Datenimport&rdquo; → &ldquo;CSV-Import&rdquo; with semicolon separator</li>
          <li>• <strong>RZL:</strong> Use &ldquo;Datenaustausch&rdquo; → &ldquo;Import&rdquo; and select CSV format</li>
          <li>• <strong>DATEV:</strong> Import through &ldquo;Datenaustausch&rdquo; → &ldquo;Belege&rdquo; with ISO encoding</li>
          <li>• Only finalized invoices (SENT, PAID) are included in exports</li>
          <li>• VAT calculations respect your Kleinunternehmer status automatically</li>
        </ul>
      </div>
    </div>
  )
}