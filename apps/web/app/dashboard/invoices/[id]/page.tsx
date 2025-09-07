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
  lines: {
    description: string
    quantity: number
    unitPriceCents: number
    vatRate: string
    totalCents: number
  }[]
  vatBreakdown: {
    netCents: number
    vatCents: number
    grossCents: number
    vatRate: number
  }[]
  Client: {
    id: string
    name: string
    email: string
    phone?: string
  }
  Appointment?: {
    id: string
    start: string
    end: string
    Service: {
      name: string
      category: string
      durationMin: number
    }
    Location: {
      name: string
      type: string
      address?: string
    }
  }
  Therapist: {
    designation: string
    kleinunternehmer: boolean
    vatStatus: string
    User: {
      name: string
      email: string
    }
  }
}

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const updateStatus = async (newStatus: string) => {
    if (!invoice) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update invoice')
      }

      const data = await response.json()
      setInvoice(data.invoice)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setUpdating(false)
    }
  }

  const handlePrint = () => {
    try {
      window.print()
    } catch (error) {
      console.error('Print error:', error)
      alert('Print functionality not available. Please use browser menu: File > Print')
    }
  }

  const handleEmailInvoice = () => {
    if (!invoice) return

    if (!invoice.Client.email) {
      alert('❌ Client has no email address on file.\nPlease add an email to the client profile first.')
      return
    }

    // Create public invoice link (no authentication required)
    const invoiceLink = `${window.location.origin}/invoice/${invoice.id}`
    
    const subject = `Invoice ${invoice.number} - MyoFlow`
    const body = `Dear ${invoice.Client.name},

Please find your invoice ${invoice.number} for ${formatCurrency(invoice.totalGrossCents)}.

View invoice: ${invoiceLink}

You can view and print the invoice from this link.

Best regards,
${invoice.Therapist.User.name}
${invoice.Therapist.designation}

---
MyoFlow - Austrian Therapy Practice Management`

    const mailtoLink = `mailto:${invoice.Client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailtoLink, '_blank')
  }

  const handleDownloadPDF = async () => {
    if (!invoice) return
    
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/pdf`, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf',
        },
        credentials: 'include', // Include cookies for authentication
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800'
      case 'SENT':
        return 'bg-blue-100 text-blue-800'
      case 'PAID':
        return 'bg-green-100 text-green-800'
      case 'VOID':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading invoice...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

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
      <nav className="bg-white shadow-sm border-b print:hidden">
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
              <span className="text-sm text-gray-500">/ {invoice.number}</span>
            </div>
            <div className="flex items-center space-x-4">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                  invoice.status
                )}`}
              >
                {invoice.status}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Action Buttons */}
        <div className="mb-6 flex justify-between items-center print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Invoice {invoice.number}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Created {formatDate(invoice.createdAt)}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-2a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>

            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              PDF
            </button>

            <button
              onClick={handleEmailInvoice}
              disabled={!invoice.Client.email}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              title={!invoice.Client.email ? 'Client has no email address' : `Email invoice link to ${invoice.Client.email}`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
            </button>

            {(invoice.status === 'DRAFT' || invoice.status === 'SENT') && (
              <Link
                href={`/dashboard/invoices/${invoice.id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </Link>
            )}

            {(invoice.status === 'DRAFT' || invoice.status === 'SENT') && (
              <div className="relative">
                <select
                  value=""
                  onChange={(e) => updateStatus(e.target.value)}
                  disabled={updating}
                  className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">More Actions</option>
                  {invoice.status === 'DRAFT' && <option value="SENT">Mark as Sent</option>}
                  {invoice.status === 'SENT' && <option value="PAID">Mark as Paid</option>}
                  <option value="VOID">Mark as Void</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Invoice Content */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-8">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">MyoFlow</h2>
                <p className="text-gray-600">{invoice.Therapist.User.name}</p>
                <p className="text-gray-600">{invoice.Therapist.designation}</p>
                <p className="text-gray-600">{invoice.Therapist.User.email}</p>
              </div>
              <div className="text-right">
                <h3 className="text-xl font-semibold text-gray-900">RECHNUNG</h3>
                <p className="text-gray-600">Nr. {invoice.number}</p>
                <p className="text-gray-600">Datum: {formatDate(invoice.createdAt)}</p>
              </div>
            </div>

            {/* Client Information */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Rechnungsempfänger</h4>
              <div className="text-gray-700">
                <p className="font-medium">{invoice.Client.name}</p>
                <p>{invoice.Client.email}</p>
                {invoice.Client.phone && <p>{invoice.Client.phone}</p>}
              </div>
            </div>

            {/* Appointment Information */}
            {invoice.Appointment && (
              <div className="mb-8 p-4 bg-gray-50 rounded-md">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Behandlungsdetails</h4>
                <div className="text-gray-700 space-y-1">
                  <p><span className="font-medium">Service:</span> {invoice.Appointment.Service.name}</p>
                  <p><span className="font-medium">Kategorie:</span> {invoice.Appointment.Service.category}</p>
                  <p><span className="font-medium">Dauer:</span> {invoice.Appointment.Service.durationMin} Minuten</p>
                  <p><span className="font-medium">Datum:</span> {formatDate(invoice.Appointment.start)}</p>
                  <p><span className="font-medium">Ort:</span> {invoice.Appointment.Location.name}</p>
                  {invoice.Appointment.Location.address && (
                    <p><span className="font-medium">Adresse:</span> {invoice.Appointment.Location.address}</p>
                  )}
                </div>
              </div>
            )}

            {/* Invoice Lines */}
            <div className="mb-8">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-sm font-medium text-gray-900">Beschreibung</th>
                    <th className="text-center py-3 text-sm font-medium text-gray-900">Menge</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-900">Einzelpreis</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-900">Gesamt</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lines.map((line, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 text-gray-900">{line.description}</td>
                      <td className="py-3 text-center text-gray-700">{line.quantity}</td>
                      <td className="py-3 text-right text-gray-700">{formatCurrency(line.unitPriceCents)}</td>
                      <td className="py-3 text-right text-gray-900 font-medium">{formatCurrency(line.totalCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64">
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center text-lg font-semibold text-gray-900">
                    <span>Gesamtbetrag:</span>
                    <span>{formatCurrency(invoice.totalGrossCents)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Austrian Legal Notices */}
            <div className="mt-8 pt-8 border-t border-gray-200 text-sm text-gray-600">
              {invoice.kleinunternehmer && (
                <p className="mb-2">
                  🇦🇹 <strong>Kleinunternehmerregelung:</strong> Kein Ausweis der Umsatzsteuer nach § 6 Abs. 1 Z 27 UStG
                </p>
              )}
              <p className="mb-2">
                <strong>Hinweis:</strong> Dienstleistungen im Bereich der Gesundheitsförderung und Entspannung. 
                Kein Heilversprechen. Bei gesundheitlichen Beschwerden konsultieren Sie einen Arzt.
              </p>
              <p className="text-xs text-gray-500">
                Diese Rechnung wurde mit MyoFlow erstellt - Austrian-compliant therapy practice management.
              </p>
            </div>
          </div>
        </div>

        {/* Status Management */}
        {invoice.status !== 'VOID' && (
          <div className="mt-6 bg-blue-50 rounded-lg p-4 print:hidden">
            <h3 className="text-sm font-medium text-blue-800 mb-2">
              📋 Invoice Workflow
            </h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• <strong>DRAFT:</strong> Invoice created, can be edited</p>
              <p>• <strong>SENT:</strong> Invoice sent to client, limited editing</p>
              <p>• <strong>PAID:</strong> Payment received, invoice locked</p>
              <p>• <strong>VOID:</strong> Invoice cancelled, no further changes</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}