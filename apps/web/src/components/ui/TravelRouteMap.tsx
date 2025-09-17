'use client'

import React from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

interface TravelAppointment {
  id: string
  start: string
  end: string
  Client: {
    name: string
  }
  Location: {
    name: string
    city?: string
    postalCode?: string
  }
  travelDistanceKm?: number
  estimatedTravelTimeMin?: number
  requiresTravelBuffer: boolean
}

interface TravelRouteMapProps {
  appointments: TravelAppointment[]
  selectedDate?: Date
  className?: string
}

export function TravelRouteMap({ appointments, selectedDate, className = '' }: TravelRouteMapProps) {
  // Filter appointments for the selected date or today
  const targetDate = selectedDate || new Date()
  const dayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.start)
    return aptDate.toDateString() === targetDate.toDateString()
  }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

  // Filter only travel appointments
  const travelAppointments = dayAppointments.filter(apt => apt.requiresTravelBuffer)

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('de-AT', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTotalTravelTime = () => {
    return travelAppointments.reduce((total, apt) => total + (apt.estimatedTravelTimeMin || 0), 0)
  }

  const getTotalDistance = () => {
    return travelAppointments.reduce((total, apt) => total + (apt.travelDistanceKm || 0), 0)
  }

  if (travelAppointments.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
        <h3 className="font-medium text-gray-900 mb-2">🗺️ Tagesroute</h3>
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm">Keine Hausbesuche heute</p>
          <p className="text-xs text-gray-400 mt-1">Alle Termine in der Praxis</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      <h3 className="font-medium text-gray-900 mb-3">
        🗺️ Tagesroute - {format(targetDate, 'dd.MM.yyyy', { locale: de })}
      </h3>

      {/* Route Overview */}
      <div className="space-y-3">
        {/* Starting Point */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-6 h-6 bg-green-500 rounded-full">
            <span className="text-white text-xs font-bold">S</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">🏠 Praxis Linz</p>
            <p className="text-xs text-gray-500">Hauptplatz 1, 4020 Linz</p>
          </div>
          <div className="text-xs text-gray-500">
            {formatTime(travelAppointments[0]?.start)} Abfahrt
          </div>
        </div>

        {/* Travel Route */}
        <div className="ml-3 border-l-2 border-gray-300 space-y-3 pl-3">
          {travelAppointments.map((appointment, index) => (
            <div key={appointment.id} className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-6 h-6 bg-blue-500 rounded-full -ml-6">
                <span className="text-white text-xs font-bold">{index + 1}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  📍 {appointment.Location.name}
                </p>
                <p className="text-xs text-gray-600">{appointment.Client.name}</p>
                <p className="text-xs text-gray-500">
                  {appointment.Location.city || 'Linz'} • {appointment.travelDistanceKm?.toFixed(1)}km
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-gray-900">
                  {formatTime(appointment.start)} - {formatTime(appointment.end)}
                </p>
                <p className="text-xs text-blue-600">
                  🚗 {appointment.estimatedTravelTimeMin}min
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Return Journey */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-6 h-6 bg-green-500 rounded-full">
            <span className="text-white text-xs font-bold">E</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">🏠 Zurück zur Praxis</p>
            <p className="text-xs text-gray-500">Ende der Hausbesuche</p>
          </div>
          <div className="text-xs text-gray-500">
            {travelAppointments.length > 0 && formatTime(travelAppointments[travelAppointments.length - 1]?.end)} Ankunft
          </div>
        </div>
      </div>

      {/* Route Statistics */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-gray-500">Gesamtstrecke</p>
            <p className="text-sm font-bold text-gray-900">{getTotalDistance().toFixed(1)}km</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Fahrzeit</p>
            <p className="text-sm font-bold text-gray-900">{getTotalTravelTime()}min</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Hausbesuche</p>
            <p className="text-sm font-bold text-gray-900">{travelAppointments.length}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <button className="text-xs text-blue-600 hover:text-blue-800">
            📱 In Google Maps öffnen
          </button>
          <button className="text-xs text-gray-500 hover:text-gray-700">
            📋 Route exportieren
          </button>
        </div>
      </div>
    </div>
  )
}