'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useTranslation } from '@myoflow/lib'
import { Calendar, CalendarEvent, Button, TravelRouteMap } from '@/components/ui'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import {
  AppointmentModal,
  type ClientOption,
  type ServiceOption,
  type LocationOption,
} from './components/AppointmentModal'

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

export default function CalendarPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useTranslation()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalInitialDate, setModalInitialDate] = useState<Date | null>(null)

  // Reference data for modal
  const [clients, setClients] = useState<ClientOption[]>([])
  const [services, setServices] = useState<ServiceOption[]>([])
  const [locations, setLocations] = useState<LocationOption[]>([])
  const [referenceDataLoading, setReferenceDataLoading] = useState(false)

  const fetchAppointments = useCallback(async () => {
    try {
      const response = await fetch('/api/appointments')
      if (!response.ok) {
        throw new Error(t('appointments.fetchError'))
      }
      const data = await response.json()
      setAppointments(data.appointments)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setLoading(false)
    }
  }, [t])

  const fetchReferenceData = useCallback(async () => {
    setReferenceDataLoading(true)
    try {
      const [clientsRes, servicesRes, locationsRes] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/services'),
        fetch('/api/locations'),
      ])

      if (clientsRes.ok) {
        const clientsData = await clientsRes.json()
        setClients(Array.isArray(clientsData) ? clientsData : [])
      }

      if (servicesRes.ok) {
        const servicesData = await servicesRes.json()
        setServices(Array.isArray(servicesData.services) ? servicesData.services : [])
      }

      if (locationsRes.ok) {
        const locationsData = await locationsRes.json()
        setLocations(Array.isArray(locationsData.locations) ? locationsData.locations : [])
      }
    } catch (err) {
      console.error('Failed to fetch reference data:', err)
    } finally {
      setReferenceDataLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/sign-in')
      return
    }

    if (status === 'authenticated') {
      fetchAppointments()
    }
  }, [status, router, fetchAppointments])

  // Convert appointments to calendar events with debug logging
  const calendarEvents: CalendarEvent[] = appointments.map((appointment) => {
    const event = {
      id: appointment.id,
      title: `${appointment.Client.name} - ${appointment.Service.name}`,
      start: new Date(appointment.start),
      end: new Date(appointment.end),
      status: appointment.status as CalendarEvent['status'],
      requiresTravelBuffer: appointment.requiresTravelBuffer,
      Client: appointment.Client,
      Service: appointment.Service
    }

    // Debug log for Sept 16th specifically
    if (event.start.getDate() === 16 && event.start.getMonth() === 8) { // September = month 8
      console.log('Sept 16 appointment found:', {
        title: event.title,
        start: event.start.toString(),
        date: event.start.toDateString()
      })
    }

    return event
  })

  console.log('Total calendar events created:', calendarEvents.length)
  console.log('Sept 16th events:', calendarEvents.filter(e =>
    e.start.getDate() === 16 && e.start.getMonth() === 8
  ).length)

  // Handle calendar event clicks
  const handleEventClick = (event: CalendarEvent) => {
    router.push(`/dashboard/appointments/${event.id}`)
  }

  // Handle calendar date clicks - filter appointments by day
  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    console.log(`Filtering appointments for: ${date.toDateString()}`)
    // Open appointment modal with selected date
    handleOpenAppointmentModal(date)
  }

  // Handle double-click - open day detail view (15-minute blocks)
  const handleDayDoubleClick = (date: Date) => {
    console.log(`Opening day detail view for: ${date.toDateString()}`)
    handleOpenAppointmentModal(date)
  }

  // Open appointment modal
  const handleOpenAppointmentModal = (date?: Date) => {
    setModalInitialDate(date || new Date())
    setModalOpen(true)
    // Always fetch fresh reference data when opening modal
    // This ensures we get latest data even if previous fetch failed
    fetchReferenceData()
  }

  // Handle modal close
  const handleModalClose = () => {
    setModalOpen(false)
    setModalInitialDate(null)
  }

  // Handle appointment created
  const handleAppointmentCreated = async () => {
    await fetchAppointments()
  }

  // Handle availability blocking
  const handleTimeSlotBlock = (start: Date, end: Date) => {
    console.log('Blocking time slot:', start, 'to', end)
    // TODO: Implement API call to block time slot
    alert(`${t('calendarPage.blockedTimePrefix')}: ${format(start, 'dd.MM.yyyy HH:mm')} - ${format(end, 'HH:mm')}`)
  }

  // Handle today button
  const handleToday = () => {
    setSelectedDate(new Date())
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
        <div className="text-lg">{t('appointments.loading')}</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="max-w-full overflow-hidden">
      <div className="space-y-4 xl:space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="min-w-0">
            <h1 className="text-xl xl:text-2xl font-semibold text-neutral-gray-900 truncate">{t('calendarPage.heading')}</h1>
            <p className="mt-1 xl:mt-2 text-sm xl:text-base text-neutral-gray-600">
              {format(selectedDate || new Date(), 'EEEE, d. MMMM yyyy', { locale: de })}
            </p>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              className="h-8"
            >
              {t('calendarPage.today')}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => handleOpenAppointmentModal()}
              className="h-8 hidden sm:block"
            >
              {t('calendarPage.newAppointment')}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => handleOpenAppointmentModal()}
              className="h-8 sm:hidden"
            >
              +
            </Button>
          </div>
        </div>

      <main>
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{t('common.error')}: {error}</p>
          </div>
        )}

        {/* Responsive layout: Appointments on left, Calendar on right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* Appointments List Section - Left Side */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">
                      {selectedDate
                        ? format(selectedDate, 'EEEE, d. MMMM yyyy', { locale: de })
                        : t('calendarPage.allAppointments')}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {t('calendarPage.selectedDaySummary')}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Link href="/dashboard/appointments" className="text-sm text-blue-600 hover:text-blue-700">
                      {t('calendarPage.toList')}
                    </Link>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden max-h-[600px] overflow-y-auto">
                {appointments.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-gray-500">{t('appointments.noAppointments')}</p>
                    <p className="text-sm text-gray-400 mt-2">
                      {t('appointments.createFirst')}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {appointments.filter(apt => {
                      if (!selectedDate) return true
                      const aptDate = new Date(apt.start)
                      return aptDate.toDateString() === selectedDate.toDateString()
                    }).map((appointment) => (
                      <div key={appointment.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-800">
                                {appointment.Client.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-medium text-gray-900">{appointment.Client.name}</h3>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                                  {appointment.status === 'BOOKED'
                                    ? t('appointments.statusLabels.booked')
                                    : appointment.status}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{appointment.Service.name}</p>
                              <div className="flex items-center text-sm text-gray-500 mt-1 space-x-4">
                                <span>⏰ {formatTime(appointment.start)} - {formatTime(appointment.end)}</span>
                                <span>📍 {appointment.Location.name}</span>
                              </div>
                              {appointment.requiresTravelBuffer && (
                                <div className="flex items-center text-sm text-blue-600 mt-2">
                                  <span>🚗 {appointment.travelDistanceKm?.toFixed(1)}km, {appointment.estimatedTravelTimeMin}min</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">{formatPrice(appointment.Service.priceCents)}</p>
                            <Link
                              href={`/dashboard/appointments/${appointment.id}`}
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              {t('calendarPage.detailsCta')}
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Today's Schedule Summary - Compact */}
            <div className="mt-4 bg-white rounded-lg shadow p-4">
              <h3 className="font-medium text-gray-900 mb-2">{t('calendarPage.todayPlan')}</h3>
              <div className="space-y-1">
                {appointments.filter(apt => {
                  const today = new Date()
                  const aptDate = new Date(apt.start)
                  return aptDate.toDateString() === today.toDateString()
                }).slice(0, 4).map((appointment) => (
                  <div key={appointment.id} className="flex items-center text-xs">
                    <span className="font-medium text-gray-600 w-12">
                      {formatTime(appointment.start)}
                    </span>
                    <span className="ml-2 truncate">{appointment.Client.name}</span>
                    {appointment.requiresTravelBuffer && (
                      <span className="ml-1 text-orange-600">🚗</span>
                    )}
                  </div>
                ))}
                {appointments.filter(apt => {
                  const today = new Date()
                  const aptDate = new Date(apt.start)
                  return aptDate.toDateString() === today.toDateString()
                }).length === 0 && (
                  <p className="text-xs text-gray-500">{t('calendarPage.noAppointmentsToday')}</p>
                )}
              </div>
            </div>

            {/* Compact Calendar Legend */}
            <div className="mt-4 bg-white rounded-lg shadow p-3">
              <h3 className="font-medium text-gray-900 mb-2 text-sm">{t('calendarPage.legend.title')}</h3>

              {/* Density Indicators */}
              <div className="mb-3">
                <h4 className="text-xs font-medium text-gray-600 mb-1">{t('calendarPage.legend.capacity')}</h4>
                <div className="space-y-1">
                  <div className="flex items-center text-xs">
                    <div className="w-5 h-3 bg-green-500 rounded-full text-white text-xs flex items-center justify-center font-bold mr-2">4</div>
                    <span>{t('calendarPage.legend.capacityLow')}</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <div className="w-5 h-3 bg-yellow-500 rounded-full text-white text-xs flex items-center justify-center font-bold mr-2">6</div>
                    <span>{t('calendarPage.legend.capacityMedium')}</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <div className="w-5 h-3 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold mr-2">8</div>
                    <span>{t('calendarPage.legend.capacityHigh')}</span>
                  </div>
                </div>
              </div>

              {/* Quick Indicators */}
              <div>
                <h4 className="text-xs font-medium text-gray-600 mb-1">{t('calendarPage.legend.indicators')}</h4>
                <div className="space-y-1">
                  <div className="flex items-center text-xs">
                    <span className="text-orange-600 mr-2">🚗</span>
                    <span>{t('calendarPage.legend.homeVisit')}</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <div className="w-3 h-3 rounded-full border-2 border-orange-400 bg-blue-500 mr-2"></div>
                    <span>{t('calendarPage.legend.withTravel')}</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <div className="w-3 h-1 bg-gray-600 rounded-full mr-2"></div>
                    <span>{t('calendarPage.legend.blocked')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Calendar Section - Right Side (Bigger) */}
          <div className="lg:col-span-8 xl:col-span-9">
            <Calendar
              events={calendarEvents}
              onEventClick={handleEventClick}
              onDateClick={handleDateClick}
              onDateDoubleClick={handleDayDoubleClick}
              onTimeSlotBlock={handleTimeSlotBlock}
              selectedDate={selectedDate}
              austrianStateCode="OÖ"
              allowBlocking={true}
              externalCalendarSyncEnabled={false}
              className="w-full"
            />

            {/* Compact Travel Timeline */}
            <div className="mt-4 bg-white rounded-lg shadow p-4">
              <h3 className="font-medium text-gray-900 mb-3">{t('calendarPage.route.title')}</h3>
              {(() => {
                const dayAppointments = appointments.filter(apt => {
                  if (!selectedDate) return false
                  const aptDate = new Date(apt.start)
                  return aptDate.toDateString() === selectedDate.toDateString()
                })
                const travelAppointments = dayAppointments.filter(apt => apt.requiresTravelBuffer)

                if (travelAppointments.length === 0) {
                  return (
                    <div className="text-center py-3">
                      <p className="text-gray-500 text-sm">{t('calendarPage.route.noVisits')}</p>
                    </div>
                  )
                }

                return (
                  <div className="space-y-2">
                    {/* Horizontal Timeline */}
                    <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                      <div className="flex items-center space-x-1 text-xs bg-green-100 px-2 py-1 rounded-full whitespace-nowrap">
                        <span>🏠</span>
                        <span>{t('calendarPage.route.practice')}</span>
                      </div>

                      {travelAppointments.map((apt, index) => (
                        <div key={apt.id} className="flex items-center space-x-1">
                          <div className="w-8 border-t border-gray-300"></div>
                          <div className="flex items-center space-x-1 text-xs bg-blue-100 px-2 py-1 rounded-full whitespace-nowrap">
                            <span>📍</span>
                            <span>{apt.Client.name}</span>
                            <span className="text-blue-600">({apt.travelDistanceKm?.toFixed(1)}km)</span>
                          </div>
                        </div>
                      ))}

                      <div className="flex items-center space-x-1">
                        <div className="w-8 border-t border-gray-300"></div>
                        <div className="flex items-center space-x-1 text-xs bg-green-100 px-2 py-1 rounded-full whitespace-nowrap">
                          <span>🏠</span>
                          <span>{t('calendarPage.route.return')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Route Stats */}
                    <div className="flex justify-between text-xs text-gray-600 pt-2 border-t">
                      <span>📍 {travelAppointments.length} {t('calendarPage.route.statsVisits')}</span>
                      <span>🚗 {travelAppointments.reduce((total, apt) => total + (apt.travelDistanceKm || 0), 0).toFixed(1)}km</span>
                      <span>⏱️ {travelAppointments.reduce((total, apt) => total + (apt.estimatedTravelTimeMin || 0), 0)}min</span>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      </main>

      {/* Appointment Modal */}
      <AppointmentModal
        open={modalOpen}
        mode="create"
        onClose={handleModalClose}
        initialDate={modalInitialDate}
        clients={clients}
        services={services}
        locations={locations}
        loading={referenceDataLoading}
        missingData={{
          clients: clients.length === 0,
          services: services.length === 0,
          locations: locations.length === 0,
        }}
        onRefreshReference={fetchReferenceData}
        onCreated={handleAppointmentCreated}
      />
      </div>
    </div>
  )
}