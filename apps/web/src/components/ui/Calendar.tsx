'use client'

import * as React from 'react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  isToday
} from 'date-fns'
import { de } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from './Button'
import { isAustrianHoliday } from '@myoflow/lib'

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  status: 'BOOKED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  requiresTravelBuffer?: boolean
  Client?: {
    name: string
  }
  Service?: {
    name: string
  }
}

export interface BlockedTimeSlot {
  id: string
  title: string
  start: Date
  end: Date
  type: 'BLOCKED' | 'PERSONAL' | 'EXTERNAL_CALENDAR'
  source?: string // 'google', 'apple', 'outlook', 'manual'
  description?: string
  isRecurring?: boolean
}

export interface CalendarAvailability {
  dayOfWeek: number // 0 = Sunday, 1 = Monday, etc.
  startTime: string // "09:00"
  endTime: string // "17:00"
  isAvailable: boolean
}

interface CalendarProps {
  events?: CalendarEvent[]
  blockedSlots?: BlockedTimeSlot[]
  availability?: CalendarAvailability[]
  onEventClick?: (event: CalendarEvent) => void
  onDateClick?: (date: Date) => void
  onDateDoubleClick?: (date: Date) => void
  onTimeSlotBlock?: (start: Date, end: Date) => void
  onBlockedSlotClick?: (slot: BlockedTimeSlot) => void
  selectedDate?: Date
  view?: 'month' | 'week'
  className?: string
  austrianStateCode?: string
  allowBlocking?: boolean
  externalCalendarSyncEnabled?: boolean
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'BOOKED':
      return 'bg-blue-500 text-white border-blue-600 shadow-sm'
    case 'COMPLETED':
      return 'bg-green-500 text-white border-green-600 shadow-sm'
    case 'CANCELLED':
      return 'bg-red-500 text-white border-red-600 shadow-sm'
    case 'NO_SHOW':
      return 'bg-gray-500 text-white border-gray-600 shadow-sm'
    default:
      return 'bg-gray-400 text-white border-gray-500 shadow-sm'
  }
}

const getBlockedSlotColor = (type: string, source?: string): string => {
  switch (type) {
    case 'BLOCKED':
      return 'bg-gray-600 text-white border-gray-700 shadow-sm'
    case 'PERSONAL':
      return 'bg-purple-500 text-white border-purple-600 shadow-sm'
    case 'EXTERNAL_CALENDAR':
      return source === 'google'
        ? 'bg-yellow-500 text-white border-yellow-600 shadow-sm'
        : 'bg-indigo-500 text-white border-indigo-600 shadow-sm'
    default:
      return 'bg-gray-600 text-white border-gray-700 shadow-sm'
  }
}

const getBlockedSlotIcon = (type: string, source?: string): string => {
  switch (type) {
    case 'BLOCKED':
      return '🚫'
    case 'PERSONAL':
      return '👤'
    case 'EXTERNAL_CALENDAR':
      return source === 'google' ? '📅' : '🗓️'
    default:
      return '⏸️'
  }
}

export function Calendar({
  events = [],
  blockedSlots = [],
  availability = [],
  onEventClick,
  onDateClick,
  onDateDoubleClick,
  onTimeSlotBlock,
  onBlockedSlotClick,
  selectedDate,
  view = 'month',
  className = '',
  austrianStateCode = 'OÖ', // Default to Upper Austria for grant focus
  allowBlocking = true,
  externalCalendarSyncEnabled = false
}: CalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(selectedDate || new Date())

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday start (European)
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd
  })

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    // Use a more explicit date comparison
    const targetDateString = date.toDateString()
    const filtered = events.filter(event => {
      const eventDateString = event.start.toDateString()
      return eventDateString === targetDateString
    })

    // Debug specific dates
    if (date.getDate() === 16 && date.getMonth() === 8) { // September 16
      console.log(`Sept 16 DEBUG:`, {
        targetDate: targetDateString,
        totalEvents: events.length,
        allEventDates: events.map(e => `${e.title}: ${e.start.toDateString()}`),
        filteredCount: filtered.length,
        filteredTitles: filtered.map(e => e.title)
      })
    }

    return filtered
  }

  const getLocationColor = (locationName: string): string => {
    const locationColors: Record<string, string> = {
      'Praxis Linz': '#3B82F6', // Blue
      'Hausbesuch Linz': '#10B981', // Green
      'Praxis Leonding': '#8B5CF6', // Purple
      'Hausbesuch Leonding': '#F59E0B', // Amber
      'Praxis Wels': '#EF4444', // Red
      'Hausbesuch Wels': '#06B6D4', // Cyan
      'default': '#6B7280' // Gray
    }
    return locationColors[locationName] || locationColors.default
  }

  const getServiceTypeStyle = (serviceName: string): string => {
    const serviceStyles: Record<string, string> = {
      'Klassische Massage': 'border-solid',
      'Entspannungsmassage': 'border-dashed',
      'Sportmassage': 'border-dotted',
      'default': 'border-solid'
    }
    return serviceStyles[serviceName] || serviceStyles.default
  }

  const getAppointmentDensityInfo = (date: Date) => {
    const dayEvents = getEventsForDate(date)
    const totalAppointments = dayEvents.length
    const travelAppointments = dayEvents.filter(e => e.requiresTravelBuffer).length

    // Debug logging
    console.log(`Date: ${date.toDateString()}, Events found: ${totalAppointments}`, dayEvents.map(e => e.title))

    const locationGroups = dayEvents.reduce((acc, event) => {
      // Use Client name as location identifier since that's more reliable
      const location = event.Client?.name || 'Unknown'
      acc[location] = (acc[location] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Determine availability based on actual count
    const maxDaily = 8 // Assume 8 appointments max per day
    const availability = totalAppointments >= maxDaily ? 'full' : totalAppointments >= 6 ? 'busy' : 'available'

    return {
      count: totalAppointments,
      travelCount: travelAppointments,
      locationGroups,
      availability,
      events: dayEvents
    }
  }

  const getBlockedSlotsForDate = (date: Date): BlockedTimeSlot[] => {
    return blockedSlots.filter(slot => isSameDay(slot.start, date))
  }

  const formatEventTime = (event: CalendarEvent): string => {
    return format(event.start, 'HH:mm', { locale: de })
  }

  const formatBlockedTime = (slot: BlockedTimeSlot): string => {
    const start = format(slot.start, 'HH:mm', { locale: de })
    const end = format(slot.end, 'HH:mm', { locale: de })
    return `${start}-${end}`
  }

  const isDayBlocked = (date: Date): boolean => {
    const dayOfWeek = date.getDay()
    const dayAvailability = availability.find(a => a.dayOfWeek === dayOfWeek)
    return dayAvailability ? !dayAvailability.isAvailable : false
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevMonth}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <h2 className="text-lg font-semibold text-gray-900">
            {format(currentDate, 'MMMM yyyy', { locale: de })}
          </h2>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          {externalCalendarSyncEnabled && (
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              title="Externen Kalender synchronisieren"
            >
              📅 Sync
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="h-8"
          >
            Heute
          </Button>
          <CalendarIcon className="h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium text-gray-500"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day) => {
            const dayEvents = getEventsForDate(day)
            const dayBlockedSlots = getBlockedSlotsForDate(day)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isSelected = selectedDate && isSameDay(day, selectedDate)
            const isTodayDate = isToday(day)
            const isHoliday = isAustrianHoliday(day, austrianStateCode)
            const isDayFullyBlocked = isDayBlocked(day)

            return (
              <div
                key={day.toISOString()}
                className={`
                  min-h-[120px] lg:min-h-[140px] xl:min-h-[160px] p-2 lg:p-3 border border-gray-200 cursor-pointer transition-all duration-200
                  ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                  ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
                  ${isTodayDate ? 'bg-blue-100 border-blue-300' : ''}
                  ${isHoliday ? 'bg-red-50 border-red-200' : ''}
                  ${isDayFullyBlocked ? 'bg-gray-100 opacity-60' : ''}
                  hover:bg-gray-100 hover:shadow-sm
                `}
                onClick={() => {
                  onDateClick?.(day)
                }}
                onDoubleClick={() => {
                  onDateDoubleClick?.(day)
                }}
              >
                {/* Day Number */}
                <div className="flex items-center justify-between">
                  <span
                    className={`
                      text-sm font-medium
                      ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
                      ${isTodayDate ? 'text-blue-600 font-bold' : ''}
                      ${isHoliday ? 'text-red-600' : ''}
                    `}
                  >
                    {format(day, 'd')}
                  </span>

                  {/* Holiday indicator */}
                  {isHoliday && (
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  )}
                </div>

                {/* Modern Density Indicators */}
                <div className="mt-2 flex flex-col items-center space-y-1">
                  {(() => {
                    const densityInfo = getAppointmentDensityInfo(day)

                    if (densityInfo.count === 0) {
                      return (
                        <div className="text-xs text-gray-400">
                          Verfügbar
                        </div>
                      )
                    }

                    return (
                      <>
                        {/* Appointment Count Badge */}
                        <div className={`
                          flex items-center justify-center w-8 h-6 rounded-full text-xs font-bold text-white
                          ${densityInfo.availability === 'full' ? 'bg-red-500' :
                            densityInfo.availability === 'busy' ? 'bg-yellow-500' : 'bg-green-500'}
                        `}>
                          {densityInfo.count}
                        </div>

                        {/* Location Indicator Dots - One dot per appointment */}
                        <div className="flex flex-wrap gap-1 justify-center max-w-full">
                          {densityInfo.events.slice(0, 6).map((event, index) => {
                            const locationName = event.Client?.name || 'Unknown'
                            const isTravel = event.requiresTravelBuffer || false
                            const serviceName = event.Service?.name || 'Unknown'

                            return (
                              <div
                                key={`${event.id}-${index}`}
                                className={`
                                  w-3 h-3 rounded-full border-2
                                  ${isTravel ? 'border-orange-400' : 'border-transparent'}
                                  ${getServiceTypeStyle(serviceName)}
                                `}
                                style={{
                                  backgroundColor: getLocationColor(locationName)
                                }}
                                title={`${event.title}${isTravel ? ' (mit Anfahrt)' : ''}`}
                              />
                            )
                          })}

                          {/* Show +N more if there are more appointments */}
                          {densityInfo.count > 6 && (
                            <div className="text-xs text-gray-500 font-bold">
                              +{densityInfo.count - 6}
                            </div>
                          )}

                          {/* Travel Indicator */}
                          {densityInfo.travelCount > 0 && (
                            <div className="w-3 h-3 text-orange-600 text-xs flex items-center justify-center">
                              🚗
                            </div>
                          )}
                        </div>

                        {/* Blocked Slots Indicator */}
                        {dayBlockedSlots.length > 0 && (
                          <div className="w-4 h-1 bg-gray-600 rounded-full" title={`${dayBlockedSlots.length} gesperrte Zeiten`} />
                        )}
                      </>
                    )
                  })()}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Compact Instructions */}
      <div className="border-t border-gray-200 px-4 py-2">
        <p className="text-xs text-gray-500">
          💡 Klick = Tag filtern | Doppelklick = Detail-Ansicht
        </p>
      </div>
    </div>
  )
}