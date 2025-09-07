'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

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

export default function PublicInvoicePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchInvoice()
  }, [])

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/public/invoices/${params.id}`)
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

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading invoice...</div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-6 text-center max-w-md">
          <h2 className="text-lg font-medium text-red-800 mb-2">Invoice Not Found</h2>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Print Button */}
      <div className="print:hidden bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Invoice {invoice.number}</h1>
              <p className="text-sm text-gray-500">Created {formatDate(invoice.createdAt)}</p>
            </div>
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-2a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Invoice
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
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
      </main>
    </div>
  )
}