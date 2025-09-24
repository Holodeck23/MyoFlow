'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

interface Client {
  id: string
  name: string
  email: string
}

interface Appointment {
  id: string
  start: string
  Client: {
    name: string
  }
  Service: {
    name: string
    priceCents: number
  }
}

interface InvoiceLine {
  description: string
  quantity: number
  unitPriceCents: number
  vatRate: 'KLEINUNTERNEHMER' | 'UST_10' | 'UST_13' | 'UST_20'
}

interface Invoice {
  id: string
  number: string
  status: 'DRAFT' | 'SENT' | 'PAID' | 'VOID'
  clientId: string
  appointmentId?: string
  lines: InvoiceLine[]
  totalGrossCents: number
  Client: {
    id: string
    name: string
    email: string
  }
  Appointment?: {
    id: string
    start: string
    Service: {
      name: string
    }
  }
}

export default function EditInvoicePage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    clientId: '',
    appointmentId: '',
    lines: [] as InvoiceLine[],
    serviceDate: new Date().toISOString().split('T')[0]
  })

  const fetchData = useCallback(async () => {
    try {
      const [invoiceRes, clientsRes, appointmentsRes] = await Promise.all([
        fetch(`/api/invoices/${params.id}`),
        fetch('/api/clients'),
        fetch('/api/appointments')
      ])

      if (!invoiceRes.ok) {
        throw new Error('Invoice not found')
      }

      const invoiceData = await invoiceRes.json()
      const invoice = invoiceData.invoice
      setInvoice(invoice)

      // Set form data from invoice
      setFormData({
        clientId: invoice.clientId || '',
        appointmentId: invoice.appointmentId || '',
        lines: invoice.lines,
        serviceDate: invoice.Appointment?.start ? 
          new Date(invoice.Appointment.start).toISOString().split('T')[0] : 
          new Date().toISOString().split('T')[0]
      })

      if (clientsRes.ok) {
        const clientsData = await clientsRes.json()
        setClients(clientsData.clients || [])
      }

      if (appointmentsRes.ok) {
        const appointmentsData = await appointmentsRes.json()
        setAppointments(appointmentsData.appointments || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/sign-in')
      return
    }

    if (status === 'authenticated') {
      fetchData()
    }
  }, [status, router, fetchData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!invoice) return

    // Prevent editing of paid or void invoices
    if (invoice.status === 'PAID' || invoice.status === 'VOID') {
      setError('Cannot edit paid or void invoices')
      return
    }

    setUpdating(true)
    setError(null)

    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lines: formData.lines,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update invoice')
      }

      router.push(`/dashboard/invoices/${invoice.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setUpdating(false)
    }
  }

  const updateLine = (index: number, field: keyof InvoiceLine, value: any) => {
    const newLines = [...formData.lines]
    newLines[index] = { ...newLines[index], [field]: value }
    setFormData({ ...formData, lines: newLines })
  }

  const addLine = () => {
    setFormData({
      ...formData,
      lines: [...formData.lines, {
        description: '',
        quantity: 1,
        unitPriceCents: 0,
        vatRate: 'KLEINUNTERNEHMER'
      }]
    })
  }

  const removeLine = (index: number) => {
    if (formData.lines.length > 1) {
      const newLines = formData.lines.filter((_, i) => i !== index)
      setFormData({ ...formData, lines: newLines })
    }
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('de-AT', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100)
  }

  const calculateTotal = () => {
    return formData.lines.reduce((total, line) => total + (line.unitPriceCents * line.quantity), 0)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading invoice...</div>
      </div>
    )
  }

  if (!session || !invoice) {
    return null
  }

  // Prevent editing of paid or void invoices
  if (invoice.status === 'PAID' || invoice.status === 'VOID') {
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
                <span className="text-sm text-gray-500">/ {invoice.number}</span>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-lg font-medium text-yellow-800">Cannot Edit Invoice</h2>
            <p className="text-yellow-700 mt-2">
              {invoice.status === 'PAID' ? 'Paid invoices cannot be edited for compliance reasons.' : 
               'Void invoices cannot be edited.'}
            </p>
            <Link 
              href={`/dashboard/invoices/${invoice.id}`}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
            >
              View Invoice
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
              <span className="text-sm text-gray-500">/ Edit</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Edit Invoice {invoice.number}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Update invoice lines and amounts (Austrian tax-compliant)
            </p>
          </div>

          {error && (
            <div className="p-6 bg-red-50 border-b border-red-200">
              <p className="text-red-800">Error: {error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client (Cannot Change)
                </label>
                <input
                  type="text"
                  disabled
                  value={invoice.Client.name}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Related Appointment (Cannot Change)
                </label>
                <input
                  type="text"
                  disabled
                  value={invoice.Appointment ? 
                    `${invoice.Appointment.Service.name} (${new Date(invoice.Appointment.start).toLocaleDateString('de-AT')})` :
                    'No appointment'
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Invoice Lines</h3>
                <button
                  type="button"
                  onClick={addLine}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add Line
                </button>
              </div>

              <div className="space-y-4">
                {formData.lines.map((line, index) => (
                  <div key={index} className="border border-gray-200 rounded-md p-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          required
                          value={line.description}
                          onChange={(e) => updateLine(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Service description"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={line.quantity}
                          onChange={(e) => updateLine(index, 'quantity', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Unit Price (€)
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={line.unitPriceCents / 100}
                          onChange={(e) => updateLine(index, 'unitPriceCents', Math.round(parseFloat(e.target.value) * 100))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          VAT Rate
                        </label>
                        <select
                          value={line.vatRate}
                          onChange={(e) => updateLine(index, 'vatRate', e.target.value as any)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="KLEINUNTERNEHMER">Kleinunternehmer (0%)</option>
                          <option value="UST_10">10% USt</option>
                          <option value="UST_13">13% USt</option>
                          <option value="UST_20">20% USt</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-4">
                      <div className="text-sm text-gray-600">
                        Total: {formatCurrency(line.unitPriceCents * line.quantity)}
                      </div>
                      {formData.lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLine(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-md">
                <div className="text-lg font-semibold text-gray-900">
                  Total: {formatCurrency(calculateTotal())}
                </div>
                <div className="text-sm text-gray-600">
                  🇦🇹 Austrian tax-compliant invoice with sequential numbering
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link
                href={`/dashboard/invoices/${invoice.id}`}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={updating}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Updating...' : 'Update Invoice'}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 bg-orange-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-orange-800 mb-2">
            ⚠️ Editing Restrictions
          </h3>
          <div className="text-sm text-orange-700 space-y-1">
            <p>• Only invoice lines can be edited</p>
            <p>• Client and appointment cannot be changed</p>
            <p>• PAID and VOID invoices cannot be edited</p>
            <p>• Changes maintain Austrian tax compliance</p>
          </div>
        </div>
      </main>
    </div>
  )
}