'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
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
    id: string
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

export default function NewInvoicePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    clientId: '',
    appointmentId: '',
    lines: [{
      description: 'Klassische Massage 60min',
      quantity: 1,
      unitPriceCents: 8000,
      vatRate: 'KLEINUNTERNEHMER' as const
    }] as InvoiceLine[],
    serviceDate: '2024-09-06' // Set to demo date for consistency with test data
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/sign-in')
      return
    }

    if (status === 'authenticated') {
      fetchData()
    }
  }, [status, router])

  const fetchData = async () => {
    try {
      const [clientsRes, appointmentsRes] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/appointments')
      ])

      if (clientsRes.ok) {
        const clientsData = await clientsRes.json()
        // API returns clients directly, not wrapped in { clients: [] }
        const clientsArray = Array.isArray(clientsData) ? clientsData : clientsData.clients || []
        setClients(clientsArray)
        console.log(`Loaded ${clientsArray.length} clients`)
      } else {
        const errorData = await clientsRes.json()
        console.error('Clients API error:', errorData)
        setError(`Failed to load clients: ${errorData.error || 'Unknown error'}`)
      }

      if (appointmentsRes.ok) {
        const appointmentsData = await appointmentsRes.json()
        const appointmentsArray = appointmentsData.appointments || []
        setAppointments(appointmentsArray)
        console.log(`Loaded ${appointmentsArray.length} appointments`)
      } else {
        const errorData = await appointmentsRes.json()
        console.error('Appointments API error:', errorData)
        // Don't set error for appointments as it's optional
      }
    } catch (err) {
      console.error('Data fetch error:', err)
      setError('Failed to load data - please ensure you are logged in')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError(null)

    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: formData.clientId,
          appointmentId: formData.appointmentId || undefined,
          lines: formData.lines,
          serviceDate: formData.serviceDate + 'T12:00:00.000Z',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create invoice')
      }

      const data = await response.json()
      router.push(`/dashboard/invoices/${data.invoice.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setCreating(false)
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
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
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
              <span className="text-sm text-gray-500">/ New</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Create Austrian Tax-Compliant Invoice
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Generate invoices with Kleinunternehmer and VAT compliance
            </p>
          </div>

          {error && (
            <div className="p-6 bg-red-50 border-b border-red-200">
              <p className="text-red-800">Error: {error}</p>
              {error.includes('logged in') && (
                <p className="text-red-600 text-sm mt-2">
                  Please sign out and sign back in, then try again.
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client *
                </label>
                <select
                  required
                  value={formData.clientId}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    clientId: e.target.value,
                    appointmentId: '' // Clear appointment when client changes
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} ({client.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Related Appointment (Optional)
                </label>
                <select
                  value={formData.appointmentId}
                  onChange={(e) => setFormData({ ...formData, appointmentId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No appointment</option>
                  {appointments
                    .filter(appointment => !formData.clientId || appointment.Client.id === formData.clientId)
                    .map((appointment) => (
                    <option key={appointment.id} value={appointment.id}>
                      {appointment.Service.name} ({new Date(appointment.start).toLocaleDateString('de-AT')} {new Date(appointment.start).toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' })})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Date
              </label>
              <input
                type="date"
                value={formData.serviceDate}
                onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })}
                className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
                href="/dashboard/invoices"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={creating || !formData.clientId}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create Invoice'}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">
            🇦🇹 Austrian Compliance Features
          </h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p>✅ Kleinunternehmer (§6 UStG) and regular VAT support</p>
            <p>✅ Sequential invoice numbering (YYYY-NNN format)</p>
            <p>✅ Austrian currency formatting and date formats</p>
            <p>✅ Tax-compliant invoice data structure</p>
          </div>
        </div>
      </main>
    </div>
  )
}