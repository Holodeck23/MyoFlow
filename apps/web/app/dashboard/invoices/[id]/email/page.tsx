'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Invoice {
  id: string
  number: string
  status: 'DRAFT' | 'SENT' | 'PAID' | 'VOID'
  totalGrossCents: number
  createdAt: string
  kleinunternehmer: boolean
  Client: {
    id: string
    name: string
    email: string
    phone?: string
  }
  Therapist: {
    designation: string
    User: {
      name: string
      email: string
    }
  }
}

export default function InvoiceEmailPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/sign-in')
      return
    }

    if (status === 'authenticated') {
      fetchInvoice()
    }
  }, [status, router])

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/invoices/${params.id}`)
      if (!response.ok) {
        throw new Error('Invoice not found')
      }
      const data = await response.json()
      setInvoice(data.invoice)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('de-AT', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('de-AT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const handleDownloadPDF = async () => {
    if (!invoice) return
    
    setDownloading(true)
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/pdf`, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `Rechnung-${invoice.number}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('PDF download error:', error)
      alert('PDF-Erstellung fehlgeschlagen. Bitte versuchen Sie es erneut.')
    } finally {
      setDownloading(false)
    }
  }

  const handleOpenEmailClient = () => {
    if (!invoice) return

    if (!invoice.Client.email) {
      alert('❌ Client has no email address on file.\nPlease add an email to the client profile first.')
      return
    }

    const subject = `Invoice ${invoice.number} - MyoFlow`
    const body = `Dear ${invoice.Client.name},

Please find attached your invoice ${invoice.number} for ${formatCurrency(invoice.totalGrossCents)}.

Best regards,
${invoice.Therapist.User.name}
${invoice.Therapist.designation}

---
MyoFlow - Austrian Therapy Practice Management`

    const mailtoLink = `mailto:${invoice.Client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailtoLink, '_blank')
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!session) return null

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <Link href="/dashboard" className="text-xl font-semibold text-gray-900 hover:text-blue-600">
                  MyoFlow
                </Link>
                <span className="text-sm text-gray-500">/ </span>
                <Link href="/dashboard/invoices" className="text-sm text-gray-500 hover:text-gray-700">
                  Invoices
                </Link>
                <span className="text-sm text-gray-500">/ Error</span>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-medium text-red-800">Invoice Not Found</h2>
            <p className="text-red-700 mt-2">{error}</p>
            <Link 
              href="/dashboard/invoices"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              Back to Invoices
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-xl font-semibold text-gray-900 hover:text-blue-600">
                MyoFlow
              </Link>
              <span className="text-sm text-gray-500">/ </span>
              <Link href="/dashboard/invoices" className="text-sm text-gray-500 hover:text-gray-700">
                Invoices
              </Link>
              <span className="text-sm text-gray-500">/ </span>
              <Link href={`/dashboard/invoices/${invoice.id}`} className="text-sm text-gray-500 hover:text-gray-700">
                {invoice.number}
              </Link>
              <span className="text-sm text-gray-500">/ Send</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-lg font-medium text-gray-900">Send Invoice {invoice.number}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Send invoice to {invoice.Client.name}
            </p>
          </div>

          <div className="p-6">
            {/* Invoice Summary */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h2 className="text-sm font-medium text-gray-900 mb-2">Invoice Summary</h2>
              <div className="space-y-1 text-sm text-gray-600">
                <div>Invoice: {invoice.number}</div>
                <div>Date: {formatDate(invoice.createdAt)}</div>
                <div>Amount: {formatCurrency(invoice.totalGrossCents)}</div>
                <div>Client: {invoice.Client.name}</div>
                <div>Email: {invoice.Client.email || <span className="text-red-600">No email address</span>}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Send Invoice</h3>
                
                {!invoice.Client.email ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠️ This client has no email address on file. Please add an email address to the client profile before sending.
                    </p>
                    <Link
                      href={`/dashboard/clients/${invoice.Client.id}/edit`}
                      className="mt-2 inline-flex items-center px-3 py-2 border border-yellow-300 text-sm font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200"
                    >
                      Add Client Email
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex space-x-3">
                      <button
                        onClick={handleDownloadPDF}
                        disabled={downloading}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {downloading ? 'Downloading...' : 'Download PDF'}
                      </button>

                      <button
                        onClick={handleOpenEmailClient}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Open Email Client
                      </button>
                    </div>

                    <div className="text-sm text-gray-600 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="font-medium text-blue-900">📧 Email Instructions:</p>
                      <ol className="mt-2 ml-4 list-decimal space-y-1">
                        <li>Click "Download PDF" to download the invoice</li>
                        <li>Click "Open Email Client" to compose email to {invoice.Client.email}</li>
                        <li>Attach the downloaded PDF to your email</li>
                        <li>Send the email</li>
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-start">
              <Link
                href={`/dashboard/invoices/${invoice.id}`}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Back to Invoice
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}