'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

interface Appointment {
  id: string
  start: string
  end: string
  status: string
  notes?: string
  createdAt: string
  updatedAt: string
  recurrenceType: string
  Client: {
    id: string
    name: string
    email: string
    phone: string
  }
  Service: {
    id: string
    name: string
    durationMin: number
    priceCents: number
    category: string
  }
  Location: {
    id: string
    name: string
    type: string
    address?: string
  }
  Reminders: Array<{
    id: string
    type: string
    status: string
    scheduledFor: string
    sentAt?: string
  }>
}

export default function AppointmentDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const appointmentId = params.id as string
  
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAppointment = useCallback(async () => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch appointment')
      }
      const data = await response.json()
      setAppointment(data.appointment)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [appointmentId])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/sign-in')
      return
    }

    if (status === 'authenticated' && appointmentId) {
      fetchAppointment()
    }
  }, [status, router, appointmentId, fetchAppointment])

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('de-AT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('de-AT', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('de-AT', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('de-AT', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'BOOKED':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'NO_SHOW':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'BOOKED':
        return '📅'
      case 'COMPLETED':
        return '✅'
      case 'CANCELLED':
        return '❌'
      case 'NO_SHOW':
        return '👻'
      default:
        return '❓'
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading appointment...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center py-4">
              <Link href="/dashboard" className="text-xl font-semibold text-gray-900 hover:text-blue-600">
                MyoFlow
              </Link>
              <span className="text-sm text-gray-500 ml-2">/ </span>
              <Link href="/dashboard/appointments" className="text-sm text-blue-600 hover:text-blue-800 ml-1">
                Appointments
              </Link>
              <span className="text-sm text-gray-500 ml-1">/ Error</span>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-medium text-red-800">Error Loading Appointment</h2>
            <p className="text-red-700 mt-2">{error}</p>
            <Link 
              href="/dashboard/appointments"
              className="mt-4 inline-block bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Back to Appointments
            </Link>
          </div>
        </main>
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Appointment not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Link href="/dashboard" className="text-xl font-semibold text-gray-900 hover:text-blue-600">
              MyoFlow
            </Link>
            <span className="text-sm text-gray-500 ml-2">/ </span>
            <Link href="/dashboard/appointments" className="text-sm text-blue-600 hover:text-blue-800 ml-1">
              Appointments
            </Link>
            <span className="text-sm text-gray-500 ml-1">/ {appointment.Client.name}</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-semibold text-gray-900">
                  {appointment.Client.name}
                </h1>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(appointment.status)}`}>
                  <span className="mr-1">{getStatusIcon(appointment.status)}</span>
                  {appointment.status}
                </span>
              </div>
              <div className="flex space-x-3">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                  Edit Appointment
                </button>
                <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors">
                  More Actions
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Main Info Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                {/* DateTime Card */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-blue-900 mb-3">📅 Appointment Time</h3>
                  <div className="space-y-2 text-blue-800">
                    <p className="text-sm font-medium">Date: {formatDate(appointment.start)}</p>
                    <p className="text-sm">Start: {formatTime(appointment.start)}</p>
                    <p className="text-sm">End: {formatTime(appointment.end)}</p>
                    <p className="text-sm">Duration: {appointment.Service.durationMin} minutes</p>
                  </div>
                </div>

                {/* Service Card */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-green-900 mb-3">💆‍♀️ Service Details</h3>
                  <div className="space-y-2 text-green-800">
                    <p className="text-sm font-medium">{appointment.Service.name}</p>
                    <p className="text-sm">Category: {appointment.Service.category}</p>
                    <p className="text-sm">Duration: {appointment.Service.durationMin} minutes</p>
                    <p className="text-sm font-medium">Price: {formatPrice(appointment.Service.priceCents)}</p>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Client Card */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-purple-900 mb-3">👤 Client Information</h3>
                  <div className="space-y-2 text-purple-800">
                    <p className="text-sm font-medium">{appointment.Client.name}</p>
                    {appointment.Client.email && (
                      <p className="text-sm">📧 {appointment.Client.email}</p>
                    )}
                    {appointment.Client.phone && (
                      <p className="text-sm">📞 {appointment.Client.phone}</p>
                    )}
                  </div>
                </div>

                {/* Location Card */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-orange-900 mb-3">📍 Location</h3>
                  <div className="space-y-2 text-orange-800">
                    <p className="text-sm font-medium">{appointment.Location.name}</p>
                    <p className="text-sm">Type: {appointment.Location.type}</p>
                    {appointment.Location.address && (
                      <p className="text-sm">{appointment.Location.address}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            {appointment.notes && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-yellow-900 mb-3">📝 Notes</h3>
                <p className="text-yellow-800 text-sm">{appointment.notes}</p>
              </div>
            )}

            {/* Reminders Section */}
            {appointment.Reminders && appointment.Reminders.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">🔔 Reminders</h3>
                <div className="space-y-2">
                  {appointment.Reminders.map((reminder) => (
                    <div key={reminder.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">
                        {reminder.type} reminder - {formatDateTime(reminder.scheduledFor)}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        reminder.status === 'SENT' 
                          ? 'bg-green-100 text-green-800' 
                          : reminder.status === 'FAILED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {reminder.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">ℹ️ Metadata</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <p>Created: {formatDateTime(appointment.createdAt)}</p>
                <p>Updated: {formatDateTime(appointment.updatedAt)}</p>
                <p>Recurrence: {appointment.recurrenceType}</p>
                <p>ID: {appointment.id}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6">
          <Link 
            href="/dashboard/appointments"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            ← Back to Appointments
          </Link>
        </div>
      </main>
    </div>
  )
}