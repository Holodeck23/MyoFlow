'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Wrapper, Status } from '@googlemaps/react-wrapper'

// Google Maps TypeScript interfaces
interface GoogleMapsAPI {
  maps: {
    Map: new (element: HTMLElement, options: any) => GoogleMap
    Marker: new (options: any) => GoogleMarker
    LatLng: new (lat: number, lng: number) => GoogleLatLng
    LatLngBounds: new () => GoogleLatLngBounds
    DirectionsService: new () => GoogleDirectionsService
    DirectionsRenderer: new (options?: any) => GoogleDirectionsRenderer
    MapTypeId: {
      ROADMAP: string
    }
    TravelMode: {
      DRIVING: string
    }
  }
}

interface GoogleMap {
  fitBounds: (bounds: GoogleLatLngBounds) => void
}

interface GoogleMarker {}

interface GoogleLatLng {}

interface GoogleLatLngBounds {
  extend: (position: GoogleLatLng) => void
}

interface GoogleDirectionsService {
  route: (request: any, callback: (result: any, status: string) => void) => void
}

interface GoogleDirectionsRenderer {
  setMap: (map: GoogleMap) => void
  setDirections: (result: any) => void
}

declare global {
  interface Window {
    google: GoogleMapsAPI
  }
}

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
    address?: string
    latitude?: number
    longitude?: number
  }
  travelDistanceKm?: number
  estimatedTravelTimeMin?: number
  requiresTravelBuffer: boolean
}

interface VisualRouteMapProps {
  appointments: TravelAppointment[]
  selectedDate?: Date
  className?: string
  height?: string
}

// Base coordinates for Linz, Austria (practice location)
const LINZ_COORDS = { lat: 48.3059, lng: 14.2862 }

function MapComponent({ appointments }: { appointments: TravelAppointment[] }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<GoogleMap | null>(null)

  useEffect(() => {
    if (!mapRef.current) return

    // Initialize the map
    const googleMap = new window.google.maps.Map(mapRef.current, {
      center: LINZ_COORDS,
      zoom: 12,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: 'poi',
          stylers: [{ visibility: 'off' }]
        }
      ]
    })

    setMap(googleMap)

    // Add practice marker
    new window.google.maps.Marker({
      position: LINZ_COORDS,
      map: googleMap,
      title: 'Praxis Linz',
      icon: {
        url: 'data:image/svg+xml,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
            <circle cx="12" cy="12" r="10" fill="#10B981" stroke="white" stroke-width="2"/>
            <text x="12" y="16" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">🏠</text>
          </svg>
        `)
      }
    })

    // Filter travel appointments
    const travelAppointments = appointments.filter(apt => apt.requiresTravelBuffer)

    if (travelAppointments.length === 0) return

    // Create waypoints for route calculation
    const waypoints: Array<{ location: GoogleLatLng; stopover: boolean }> = []
    const bounds = new window.google.maps.LatLngBounds()

    // Add practice to bounds
    bounds.extend(LINZ_COORDS)

    // Add appointment locations
    travelAppointments.forEach((appointment, index) => {
      const location = appointment.Location

      // Use coordinates if available, otherwise estimate based on Austrian postal codes
      let position: GoogleLatLng

      if (location.latitude && location.longitude) {
        position = new window.google.maps.LatLng(location.latitude, location.longitude)
      } else {
        // Rough estimate for Austrian cities based on postal code
        const postalCode = location.postalCode
        let coords = LINZ_COORDS // Default to Linz

        if (postalCode?.startsWith('4020')) coords = { lat: 48.3059, lng: 14.2862 } // Linz
        else if (postalCode?.startsWith('4060')) coords = { lat: 48.2582, lng: 14.2804 } // Leonding
        else if (postalCode?.startsWith('4600')) coords = { lat: 48.1598, lng: 14.0290 } // Wels
        else if (postalCode?.startsWith('4400')) coords = { lat: 48.0379, lng: 14.4207 } // Steyr

        position = new window.google.maps.LatLng(coords.lat, coords.lng)
      }

      // Add to bounds
      bounds.extend(position)

      // Add waypoint
      waypoints.push({
        location: position,
        stopover: true
      })

      // Add marker for appointment
      new window.google.maps.Marker({
        position: position,
        map: googleMap,
        title: `${appointment.Client.name} - ${location.name}`,
        icon: {
          url: 'data:image/svg+xml,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
              <circle cx="12" cy="12" r="10" fill="#3B82F6" stroke="white" stroke-width="2"/>
              <text x="12" y="8" text-anchor="middle" fill="white" font-family="Arial" font-size="8" font-weight="bold">${index + 1}</text>
              <text x="12" y="18" text-anchor="middle" fill="white" font-family="Arial" font-size="10">📍</text>
            </svg>
          `)
        }
      })
    })

    // Fit map to show all markers
    googleMap.fitBounds(bounds)

    // Calculate and display route
    const directionsService = new window.google.maps.DirectionsService()
    const directionsRenderer = new window.google.maps.DirectionsRenderer({
      draggable: false,
      polylineOptions: {
        strokeColor: '#3B82F6',
        strokeWeight: 4,
        strokeOpacity: 0.8
      },
      suppressMarkers: true // We're using custom markers
    })

    directionsRenderer.setMap(googleMap)

    // Calculate route from practice through all waypoints and back
    directionsService.route({
      origin: LINZ_COORDS,
      destination: LINZ_COORDS, // Return to practice
      waypoints: waypoints,
      optimizeWaypoints: true,
      travelMode: window.google.maps.TravelMode.DRIVING,
      region: 'AT' // Austria
    }, (result: any, status: string) => {
      if (status === 'OK' && result) {
        directionsRenderer.setDirections(result)
      }
    })

  }, [appointments])

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
}

function LoadingComponent() {
  return (
    <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600 text-sm">Karte wird geladen...</p>
      </div>
    </div>
  )
}

function ErrorComponent({ appointments }: { appointments: TravelAppointment[] }) {
  const travelAppointments = appointments.filter(apt => apt.requiresTravelBuffer)

  if (travelAppointments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-4xl mb-2">🏠</div>
          <p className="text-gray-500">No travel appointments today</p>
        </div>
      </div>
    )
  }

  // Calculate proportional timeline
  const calculateProportionalTimeline = () => {
    const allAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.start)
      return travelAppointments.some(travel => travel.id === apt.id) ||
             aptDate.toDateString() === (new Date()).toDateString()
    }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

    const segments = []

    for (let i = 0; i < allAppointments.length; i++) {
      const apt = allAppointments[i]
      const appointmentDuration = Math.round((new Date(apt.end).getTime() - new Date(apt.start).getTime()) / 60000) // minutes
      const travelTime = apt.estimatedTravelTimeMin || 0

      // Add appointment segment
      segments.push({
        type: 'appointment',
        duration: appointmentDuration,
        client: apt.Client.name,
        service: 'Service',
        start: new Date(apt.start).toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' }),
        location: apt.Location.name,
        isTravel: apt.requiresTravelBuffer
      })

      // Add travel segment to next appointment (if any)
      if (i < allAppointments.length - 1 && travelTime > 0) {
        segments.push({
          type: 'travel',
          duration: travelTime,
          distance: apt.travelDistanceKm?.toFixed(1) || '0',
          to: allAppointments[i + 1]?.Client.name || 'Next location'
        })
      }
    }

    return segments
  }

  const segments = calculateProportionalTimeline()
  const totalDuration = segments.reduce((sum, seg) => sum + seg.duration, 0)

  return (
    <div className="h-64 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg p-6 relative overflow-hidden">
      {/* Proportional Timeline Visualization */}
      <div className="relative h-full">
        <h4 className="text-sm font-medium text-gray-700 mb-4">🕐 Daily Schedule Timeline</h4>

        {/* Proportional Timeline */}
        <div className="relative h-16 bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="flex h-full">
            {segments.map((segment, index) => {
              const widthPercent = (segment.duration / totalDuration) * 100

              if (segment.type === 'appointment') {
                return (
                  <div
                    key={index}
                    className={`relative flex flex-col justify-center px-1 text-center border-r border-white ${
                      segment.isTravel ? 'bg-orange-400' : 'bg-blue-500'
                    }`}
                    style={{ width: `${widthPercent}%` }}
                    title={`${segment.client} - ${segment.service} (${segment.duration}min)`}
                  >
                    <div className="text-white text-xs font-bold truncate">
                      {segment.client}
                    </div>
                    <div className="text-white text-xs opacity-90">
                      {segment.duration}min
                    </div>
                    <div className="text-white text-xs opacity-75 truncate">
                      {segment.start}
                    </div>
                  </div>
                )
              } else {
                return (
                  <div
                    key={index}
                    className="relative flex items-center justify-center bg-gray-300"
                    style={{ width: `${widthPercent}%` }}
                    title={`Travel: ${segment.distance}km (${segment.duration}min)`}
                  >
                    <div className="text-gray-600 text-xs">
                      🚗 {segment.duration}min
                    </div>
                  </div>
                )
              }
            })}
          </div>
        </div>

        {/* Timeline Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded mr-1"></div>
            <span>Office appointments</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-400 rounded mr-1"></div>
            <span>Home visits</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-300 rounded mr-1"></div>
            <span>Travel time</span>
          </div>
        </div>

        {/* Route Stats */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-6 text-xs">
          <div className="bg-white/80 px-3 py-1 rounded-full">
            📍 {travelAppointments.length} stops
          </div>
          <div className="bg-white/80 px-3 py-1 rounded-full">
            🚗 {travelAppointments.reduce((total, apt) => total + (apt.travelDistanceKm || 0), 0).toFixed(1)}km
          </div>
          <div className="bg-white/80 px-3 py-1 rounded-full">
            ⏱️ {travelAppointments.reduce((total, apt) => total + (apt.estimatedTravelTimeMin || 0), 0)}min
          </div>
        </div>
      </div>

    </div>
  )
}

export function VisualRouteMap({
  appointments,
  selectedDate,
  className = '',
  height = '400px'
}: VisualRouteMapProps) {
  // Filter appointments for the selected date or today
  const targetDate = selectedDate || new Date()
  const dayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.start)
    return aptDate.toDateString() === targetDate.toDateString()
  }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

  // Filter only travel appointments
  const travelAppointments = dayAppointments.filter(apt => apt.requiresTravelBuffer)

  const getTotalTravelTime = () => {
    return travelAppointments.reduce((total, apt) => total + (apt.estimatedTravelTimeMin || 0), 0)
  }

  const getTotalDistance = () => {
    return travelAppointments.reduce((total, apt) => total + (apt.travelDistanceKm || 0), 0)
  }

  if (travelAppointments.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <h3 className="font-medium text-gray-900 mb-3">🗺️ Tagesroute</h3>
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">🏠</div>
          <p className="text-gray-500">Keine Hausbesuche heute</p>
          <p className="text-xs text-gray-400 mt-1">Alle Termine in der Praxis</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">
            🗺️ Tagesroute - {targetDate.toLocaleDateString('de-AT')}
          </h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>📍 {travelAppointments.length} Stops</span>
            <span>🚗 {getTotalDistance().toFixed(1)}km</span>
            <span>⏱️ {getTotalTravelTime()}min</span>
          </div>
        </div>
      </div>

      <div className="relative" style={{ height }}>
        {/* Use proportional timeline instead of Google Maps */}
        <ErrorComponent appointments={dayAppointments} />
      </div>

      {/* Route Summary */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm">
            <span className="flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-1"></span>
              🏠 Start: Praxis Linz
            </span>
            <span className="flex items-center">
              <span className="w-3 h-3 bg-blue-500 rounded-full mr-1"></span>
              📍 {travelAppointments.length} Hausbesuche
            </span>
          </div>
          <button className="text-sm text-blue-600 hover:text-blue-800">
            📱 In Google Maps öffnen
          </button>
        </div>
      </div>
    </div>
  )
}