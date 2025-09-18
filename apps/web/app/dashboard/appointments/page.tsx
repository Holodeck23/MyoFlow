'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from '@myoflow/lib'

interface Appointment {
  id: string
  start: string
  end: string
  status: string
  notes?: string
  // Travel-related fields
  estimatedTravelTimeMin?: number
  travelDistanceKm?: number
  travelCostCents?: number
  requiresTravelBuffer: boolean
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
    // Enhanced location fields
    street?: string
    streetNumber?: string
    postalCode?: string
    city?: string
    state?: string
    country?: string
    latitude?: number
    longitude?: number
  }
}

export default function AppointmentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useTranslation()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAppointments = useCallback(async () => {
    try {
      const response = await fetch('/api/appointments')
      if (!response.ok) {
        throw new Error(t('appointments.fetchError', 'Failed to fetch appointments'))
      }
      const data = await response.json()
      setAppointments(data.appointments)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error', 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/sign-in')
      return
    }

    if (status === 'authenticated') {
      fetchAppointments()
    }
  }, [status, router, fetchAppointments])

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
        return 'bg-blue-100 text-blue-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'NO_SHOW':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t('appointments.loading', 'Loading appointments...')}</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-gray-900">{t('appointments.title', 'Termine verwalten')}</h1>
          <p className="mt-2 text-neutral-gray-600">
            {t('appointments.subtitle', 'Verwalten Sie Ihre geplanten Termine und Buchungen.')}
          </p>
        </div>
      </div>

      <main>
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              {t('appointments.title', 'Termine')}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {t('appointments.subtitle', 'Verwalten Sie Ihre geplanten Termine')}
            </p>
          </div>

          {error && (
            <div className="p-6 bg-red-50 border-b border-red-200">
              <p className="text-red-800">{t('common.error', 'Error')}: {error}</p>
            </div>
          )}

          <div className="overflow-hidden">
            {appointments.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500">{t('appointments.noAppointments', 'Keine Termine gefunden.')}</p>
                <p className="text-sm text-gray-400 mt-2">
                  {t('appointments.createFirst', 'Erstellen Sie Ihren ersten Termin, um zu beginnen.')}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {appointments.map((appointment) => (
                  <Link 
                    key={appointment.id} 
                    href={`/dashboard/appointments/${appointment.id}`}
                    className="block p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">
                            {appointment.Client.name}
                          </h3>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              appointment.status
                            )}`}
                          >
                            {appointment.status}
                          </span>
                        </div>
                        
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="font-medium">{t('appointments.service', 'Service')}:</span>
                            <span className="ml-2">{appointment.Service.name}</span>
                            <span className="ml-2 text-gray-400">
                              ({appointment.Service.durationMin} min, {formatPrice(appointment.Service.priceCents)})
                            </span>
                          </div>

                          <div className="flex items-center text-sm text-gray-600">
                            <span className="font-medium">{t('appointments.location', 'Location')}:</span>
                            <span className="ml-2">{appointment.Location.name}</span>
                            {appointment.Location.postalCode && appointment.Location.city && (
                              <span className="ml-2 text-gray-400">
                                {appointment.Location.postalCode} {appointment.Location.city}
                              </span>
                            )}
                            {appointment.Location.address && !appointment.Location.postalCode && (
                              <span className="ml-2 text-gray-400">
                                {appointment.Location.address}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center text-sm text-gray-600">
                            <span className="font-medium">{t('appointments.start', 'Time')}:</span>
                            <span className="ml-2">
                              {formatDate(appointment.start)} at {formatTime(appointment.start)} - {formatTime(appointment.end)}
                            </span>
                          </div>

                          {/* Travel Information */}
                          {appointment.requiresTravelBuffer && (
                            <div className="flex items-center text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              <span className="font-medium">🚗 Travel:</span>
                              <div className="ml-2 flex space-x-3">
                                {appointment.travelDistanceKm && (
                                  <span>{appointment.travelDistanceKm.toFixed(1)}km</span>
                                )}
                                {appointment.estimatedTravelTimeMin && (
                                  <span>{appointment.estimatedTravelTimeMin}min</span>
                                )}
                                {appointment.travelCostCents && (
                                  <span className="font-medium">{formatPrice(appointment.travelCostCents)}</span>
                                )}
                              </div>
                            </div>
                          )}

                          {appointment.notes && (
                            <div className="flex items-start text-sm text-gray-600">
                              <span className="font-medium">{t('appointments.notes', 'Notes')}:</span>
                              <span className="ml-2">{appointment.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-4 flex-shrink-0">
                        <div className="text-sm text-blue-600 font-medium">
                          View Details →
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">
            🚀 Sprint 1.3 Progress
          </h3>
          <div className="text-sm text-blue-700">
            <p>✅ Appointment database schema with Austrian holiday support</p>
            <p>✅ Complete CRUD API with conflict detection</p>
            <p>✅ Basic appointments listing page</p>
            <p>🔄 Next: Appointment booking interface & calendar view</p>
          </div>
        </div>
      </main>
    </div>
  )
}