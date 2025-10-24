'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { DatePickerField } from '@/components/ui/DatePickerField'

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
  travelDistanceKm?: number | null
  travelCostCents?: number | null
  estimatedTravelTimeMin?: number | null
}

interface InvoiceLine {
  description: string
  quantity: number
  unitPriceCents: number
  vatRate: 'KLEINUNTERNEHMER' | 'UST_10' | 'UST_13' | 'UST_20'
}

type InvoiceFormData = {
  clientId: string
  appointmentId: string
  lines: InvoiceLine[]
  serviceDate: string | null
}

type LineFieldName = 'description' | 'quantity' | 'unitPriceCents' | 'vatRate'

type LineErrors = Partial<Record<LineFieldName | '_root', string>>

interface InvoiceFieldErrors {
  clientId?: string
  appointmentId?: string
  lines: Record<number, LineErrors>
  general: string[]
}

export default function NewInvoicePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [includeTravelCharges, setIncludeTravelCharges] = useState(false)

  const [dateError, setDateError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<InvoiceFieldErrors>({
    lines: {},
    general: []
  })
  const [formData, setFormData] = useState<InvoiceFormData>(() => ({
    clientId: '',
    appointmentId: '',
    lines: [{
      description: 'Klassische Massage 60min',
      quantity: 1,
      unitPriceCents: 8000,
      vatRate: 'KLEINUNTERNEHMER'
    }],
    serviceDate: format(new Date(), 'yyyy-MM-dd')
  }))
  const today = useMemo(() => new Date(), [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/sign-in')
      return
    }

    if (status === 'authenticated') {
      fetchData()
    }
  }, [status, router])

  // Manage travel line item based on checkbox and selected appointment
  useEffect(() => {
    if (!includeTravelCharges || !formData.appointmentId) {
      // Remove travel line if checkbox unchecked or no appointment selected
      setFormData(prev => ({
        ...prev,
        lines: prev.lines.filter(line => !line.description.startsWith('Anfahrt'))
      }))
      return
    }

    const selectedAppointment = appointments.find(apt => apt.id === formData.appointmentId)
    if (!selectedAppointment?.travelCostCents || selectedAppointment.travelCostCents <= 0) {
      return
    }

    // Check if travel line already exists
    const hasTravelLine = formData.lines.some(line => line.description.startsWith('Anfahrt'))
    if (hasTravelLine) {
      return
    }

    // Add travel line
    const travelDescription = selectedAppointment.travelDistanceKm
      ? `Anfahrt (${selectedAppointment.travelDistanceKm.toFixed(1)} km)`
      : 'Anfahrt'

    setFormData(prev => ({
      ...prev,
      lines: [
        ...prev.lines,
        {
          description: travelDescription,
          quantity: 1,
          unitPriceCents: selectedAppointment.travelCostCents || 0,
          vatRate: 'KLEINUNTERNEHMER' // Will be adjusted based on therapist settings
        }
      ]
    }))
  }, [includeTravelCharges, formData.appointmentId, appointments])

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
    setFieldErrors({ lines: {}, general: [] })
    setDateError(null)

    if (!formData.serviceDate || dateError) {
      setCreating(false)
      return
    }

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
          serviceDate: formData.serviceDate ? `${formData.serviceDate}T12:00:00.000Z` : undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        handleInvoiceError(errorData)
        return
      }

      const data = await response.json()
      router.push(`/dashboard/invoices/${data.invoice.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setCreating(false)
    }
  }

  const handleInvoiceError = (errorData: any) => {
    const nextFieldErrors: InvoiceFieldErrors = { lines: {}, general: [] }
    let nextDateError: string | null = null

    const fallbackMessage =
      typeof errorData?.error === 'string'
        ? errorData.error
        : 'Failed to create invoice'

    const pushGeneral = (message: string | undefined | null) => {
      if (!message) return
      if (!nextFieldErrors.general.includes(message)) {
        nextFieldErrors.general.push(message)
      }
    }

    const recordLineError = (index: number, field: keyof LineErrors, message: string) => {
      if (!nextFieldErrors.lines[index]) {
        nextFieldErrors.lines[index] = {}
      }
      nextFieldErrors.lines[index][field] = message
    }

    if (Array.isArray(errorData?.details)) {
      if (errorData.details.every((detail: unknown) => typeof detail === 'string')) {
        (errorData.details as string[]).forEach((message) => pushGeneral(message))
      } else {
        for (const detail of errorData.details) {
          const message =
            typeof detail?.message === 'string'
              ? detail.message
              : fallbackMessage
          const path = Array.isArray(detail?.path) ? detail.path : []

          if (path[0] === 'clientId') {
            nextFieldErrors.clientId = message
            continue
          }

          if (path[0] === 'appointmentId') {
            nextFieldErrors.appointmentId = message
            continue
          }

          if (path[0] === 'serviceDate') {
            nextDateError = message
            continue
          }

          if (path[0] === 'lines') {
            const indexRaw = path[1]
            const index =
              typeof indexRaw === 'number'
                ? indexRaw
                : Number.parseInt(indexRaw, 10)

            if (!Number.isNaN(index)) {
              const field = path[2]
              if (typeof field === 'string' && field.length > 0) {
                recordLineError(index, field as LineFieldName, message)
              } else {
                recordLineError(index, '_root', message)
              }
            } else {
              pushGeneral(message)
            }
            continue
          }

          pushGeneral(message)
        }
      }
    }

    if (fallbackMessage) {
      if (fallbackMessage === 'Client not found or access denied') {
        nextFieldErrors.clientId = fallbackMessage
      } else if (
        fallbackMessage === 'Appointment not found or access denied' ||
        fallbackMessage === 'Appointment already has an invoice'
      ) {
        nextFieldErrors.appointmentId = fallbackMessage
      } else if (fallbackMessage.toLowerCase().includes('service date')) {
        nextDateError = fallbackMessage
      } else if (nextFieldErrors.general.length === 0) {
        pushGeneral(fallbackMessage)
      }
    }

    if (nextFieldErrors.general.length === 0 && fallbackMessage) {
      pushGeneral(fallbackMessage)
    }

    const bannerMessage = nextFieldErrors.general[0] ?? fallbackMessage ?? 'Failed to create invoice'

    setFieldErrors(nextFieldErrors)
    setDateError(nextDateError)
    setError(bannerMessage)
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

          {(error || fieldErrors.general.length > 0) && (
            <div className="p-6 bg-red-50 border-b border-red-200">
              {error && (
                <p className="text-red-800 font-medium">Error: {error}</p>
              )}
              {fieldErrors.general.length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-700">
                  {fieldErrors.general.map((message, index) => (
                    <li key={`${message}-${index}`}>{message}</li>
                  ))}
                </ul>
              )}
              {error && error.includes('logged in') && (
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
                  aria-invalid={Boolean(fieldErrors.clientId)}
                  aria-describedby={fieldErrors.clientId ? 'client-error' : undefined}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${fieldErrors.clientId ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} ({client.email})
                    </option>
                  ))}
                </select>
                {fieldErrors.clientId && (
                  <p id="client-error" className="mt-2 text-sm text-red-600">
                    {fieldErrors.clientId}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Related Appointment (Optional)
                </label>
                <select
                  value={formData.appointmentId}
                  onChange={(e) => {
                    const appointmentId = e.target.value
                    setFormData({ ...formData, appointmentId })

                    // Auto-enable travel charges if appointment has travel costs
                    if (appointmentId) {
                      const selectedAppointment = appointments.find(apt => apt.id === appointmentId)
                      if (selectedAppointment?.travelCostCents && selectedAppointment.travelCostCents > 0) {
                        setIncludeTravelCharges(true)
                      } else {
                        setIncludeTravelCharges(false)
                      }
                    } else {
                      setIncludeTravelCharges(false)
                    }
                  }}
                  aria-invalid={Boolean(fieldErrors.appointmentId)}
                  aria-describedby={fieldErrors.appointmentId ? 'appointment-error' : undefined}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${fieldErrors.appointmentId ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
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
                {fieldErrors.appointmentId && (
                  <p id="appointment-error" className="mt-2 text-sm text-red-600">
                    {fieldErrors.appointmentId}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Date *
              </label>
              <DatePickerField
                id="serviceDate"
                name="serviceDate"
                value={formData.serviceDate}
                onChange={(value) => setFormData((prev) => ({ ...prev, serviceDate: value }))}
                maxDate={today}
                required
                error={dateError}
                onErrorChange={setDateError}
                className="mt-1 w-full md:w-1/2"
              />
            </div>

            {/* Travel Charges Toggle */}
            {formData.appointmentId && appointments.find(apt => apt.id === formData.appointmentId)?.travelCostCents && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeTravelCharges}
                    onChange={(e) => setIncludeTravelCharges(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      Include Travel Charges
                    </span>
                    {(() => {
                      const apt = appointments.find(a => a.id === formData.appointmentId)
                      if (!apt) return null
                      const distance = apt.travelDistanceKm ? ` (${apt.travelDistanceKm.toFixed(1)} km)` : ''
                      const cost = apt.travelCostCents ? ` - €${(apt.travelCostCents / 100).toFixed(2)}` : ''
                      return (
                        <p className="text-sm text-gray-600">
                          This appointment includes travel{distance}{cost}
                        </p>
                      )
                    })()}
                  </div>
                </label>
              </div>
            )}

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
                      {fieldErrors.lines[index]?._root && (
                        <div className="md:col-span-5">
                          <p className="text-sm text-red-600">
                            {fieldErrors.lines[index]?._root}
                          </p>
                        </div>
                      )}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          required
                          value={line.description}
                          onChange={(e) => updateLine(index, 'description', e.target.value)}
                          aria-invalid={Boolean(fieldErrors.lines[index]?.description)}
                          aria-describedby={fieldErrors.lines[index]?.description ? `line-${index}-description-error` : undefined}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${fieldErrors.lines[index]?.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                          placeholder="Service description"
                        />
                        {fieldErrors.lines[index]?.description && (
                          <p id={`line-${index}-description-error`} className="mt-1 text-xs text-red-600">
                            {fieldErrors.lines[index]?.description}
                          </p>
                        )}
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
                          aria-invalid={Boolean(fieldErrors.lines[index]?.quantity)}
                          aria-describedby={fieldErrors.lines[index]?.quantity ? `line-${index}-quantity-error` : undefined}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${fieldErrors.lines[index]?.quantity ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                        />
                        {fieldErrors.lines[index]?.quantity && (
                          <p id={`line-${index}-quantity-error`} className="mt-1 text-xs text-red-600">
                            {fieldErrors.lines[index]?.quantity}
                          </p>
                        )}
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
                          aria-invalid={Boolean(fieldErrors.lines[index]?.unitPriceCents)}
                          aria-describedby={fieldErrors.lines[index]?.unitPriceCents ? `line-${index}-unitPriceCents-error` : undefined}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${fieldErrors.lines[index]?.unitPriceCents ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                        />
                        {fieldErrors.lines[index]?.unitPriceCents && (
                          <p id={`line-${index}-unitPriceCents-error`} className="mt-1 text-xs text-red-600">
                            {fieldErrors.lines[index]?.unitPriceCents}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          VAT Rate
                        </label>
                        <select
                          value={line.vatRate}
                          onChange={(e) => updateLine(index, 'vatRate', e.target.value as any)}
                          aria-invalid={Boolean(fieldErrors.lines[index]?.vatRate)}
                          aria-describedby={fieldErrors.lines[index]?.vatRate ? `line-${index}-vatRate-error` : undefined}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${fieldErrors.lines[index]?.vatRate ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                        >
                          <option value="KLEINUNTERNEHMER">Kleinunternehmer (0%)</option>
                          <option value="UST_10">10% USt</option>
                          <option value="UST_13">13% USt</option>
                          <option value="UST_20">20% USt</option>
                        </select>
                        {fieldErrors.lines[index]?.vatRate && (
                          <p id={`line-${index}-vatRate-error`} className="mt-1 text-xs text-red-600">
                            {fieldErrors.lines[index]?.vatRate}
                          </p>
                        )}
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
                disabled={creating || !formData.clientId || !formData.serviceDate || Boolean(dateError)}
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
