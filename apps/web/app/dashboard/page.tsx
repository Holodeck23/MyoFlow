'use client'

import { formatAustrianCurrency, useTranslation } from '@myoflow/lib'
import { Card, CardContent, Button } from '@/components/ui'
import {
  Calendar,
  Euro,
  AlertTriangle,
  Users,
  Clock
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { ProfileCompletionWidget } from './components/ProfileCompletionWidget'
import type { MyoFlowSession } from '@/lib/auth'

interface TodayAppointment {
  id: string
  start: string
  end: string
  status: string
  // Travel fields
  estimatedTravelTimeMin?: number
  travelDistanceKm?: number
  travelCostCents?: number
  requiresTravelBuffer: boolean
  Client: {
    name: string
  }
  Service: {
    name: string
    durationMin: number
  }
  Location: {
    name: string
    type: string
    postalCode?: string
    city?: string
  }
}

export default function Dashboard() {
  const { t } = useTranslation()
  const { data: rawSession } = useSession()
  const session = rawSession as MyoFlowSession | null
  const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([])

  useEffect(() => {
    if (session) {
      fetchTodayAppointments()
    }
  }, [session])

  const fetchTodayAppointments = async () => {
    try {
      const today = new Date()
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString()

      const response = await fetch(`/api/appointments?start=${startOfDay}&end=${endOfDay}`)
      if (response.ok) {
        const data = await response.json()
        setTodayAppointments(data.appointments || [])
      }
    } catch (error) {
      console.error('Failed to fetch today appointments:', error)
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('de-AT', {
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

  // Real data for new users - TODO: Replace with API calls
  const currentYearRevenue = 0 // New user starts with €0
  const kleinunternehmerThreshold = 55000 // €55,000 Austrian threshold
  const remainingThreshold = kleinunternehmerThreshold - currentYearRevenue // Full €55,000 available
  const thresholdProgress = (currentYearRevenue / kleinunternehmerThreshold) * 100
  const monthsIntoYear = 9 // September
  const averageMonthlyRevenue = currentYearRevenue / (monthsIntoYear || 1) // Avoid division by zero
  const projectedYearEnd = averageMonthlyRevenue * 12

  // Empty activity for new users
  const recentActivity: any[] = []

  return (
    <div className="space-y-6">
      <ProfileCompletionWidget />

      {session?.user?.accountType === 'TEST' && (
        <Card className="border border-yellow-200 bg-yellow-50">
          <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between p-6">
            <div>
              <h3 className="text-lg font-semibold text-yellow-900">Ready to go live?</h3>
              <p className="text-sm text-yellow-800">
                Upgrade to a production account to remove test data and start working with real clients.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
                onClick={() => {
                  window.location.href = '/settings/account-upgrade'
                }}
              >
                Upgrade to Production
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kleinunternehmer Status - Most Important */}
      <div className="bg-gradient-to-br from-medical-blue via-blue-600 to-medical-blue-800 rounded-lg p-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">{t('dashboard.kleinunternehmerStatus')}</h2>
            <p className="text-medical-blue-100">{t('dashboard.revenueMonitoring')}</p>
          </div>
          <Euro className="h-8 w-8 text-medical-blue-200" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <div className="text-2xl font-bold">{formatAustrianCurrency(currentYearRevenue * 100)}</div>
            <div className="text-sm text-medical-blue-100">{t('dashboard.currentYearRevenue')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{formatAustrianCurrency(remainingThreshold * 100)}</div>
            <div className="text-sm text-medical-blue-100">{t('dashboard.remainingAllowance')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{formatAustrianCurrency(Math.round(projectedYearEnd) * 100)}</div>
            <div className="text-sm text-medical-blue-100">{t('dashboard.projectedTotal')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{thresholdProgress.toFixed(1)}%</div>
            <div className="text-sm text-medical-blue-100">{t('dashboard.thresholdUsed')}</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-medical-blue-800 rounded-full h-3 mb-2">
          <div
            className="bg-white rounded-full h-3 transition-all duration-300"
            style={{ width: `${Math.min(thresholdProgress, 100)}%` }}
          ></div>
        </div>

        <div className="flex justify-between text-sm text-medical-blue-100">
          <span>€0</span>
          <span>
            {projectedYearEnd > kleinunternehmerThreshold
              ? t('dashboard.warningProjectedExceed')
              : thresholdProgress > 80
                ? t('dashboard.warningNearLimit')
                : t('dashboard.safeUnderLimit')
            }
          </span>
          <span>€55.000</span>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-white to-blue-50 rounded-lg shadow-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('dashboard.totalClients')}</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-green-50 rounded-lg shadow-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('dashboard.todayAppointments')}</p>
              <p className="text-2xl font-bold text-gray-900">{todayAppointments.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-purple-50 rounded-lg shadow-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md">
              <Euro className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('dashboard.monthlyAverage')}</p>
              <p className="text-2xl font-bold text-gray-900">{formatAustrianCurrency(Math.round(averageMonthlyRevenue))}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-orange-50 rounded-lg shadow-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('dashboard.actionRequired')}</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Schedule & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.todaysSchedule')}</h3>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {todayAppointments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">{t('dashboard.noAppointmentsToday')}</p>
            ) : (
              todayAppointments.map((appointment) => (
                <div key={appointment.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">{formatTime(appointment.start)}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{appointment.Client.name}</p>
                      <p className="text-sm text-gray-600">
                        {appointment.Service.name} • {appointment.Service.durationMin} min
                      </p>
                      {appointment.Location.postalCode && appointment.Location.city && (
                        <p className="text-xs text-gray-500">
                          {appointment.Location.name} • {appointment.Location.postalCode} {appointment.Location.city}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Travel Information on Dashboard */}
                  {appointment.requiresTravelBuffer && (
                    <div className="mt-2 flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      <span className="font-medium">🚗</span>
                      <div className="ml-1 flex space-x-2">
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
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.recentActivity')}</h3>
          </div>
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-gray-500 text-center py-4">{t('dashboard.noRecentActivity')}</p>
            ) : (
              recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`
                    w-2 h-2 rounded-full mt-2
                    ${activity.type === 'invoice' ? 'bg-blue-500' : ''}
                    ${activity.type === 'appointment' ? 'bg-green-500' : ''}
                    ${activity.type === 'payment' ? 'bg-purple-500' : ''}
                  `}></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">{activity.time}</p>
                      {activity.amount && (
                        <span className="text-sm font-medium text-green-600">{activity.amount}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
