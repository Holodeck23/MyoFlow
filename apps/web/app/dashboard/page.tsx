'use client'

import { formatAustrianCurrency, useTranslation } from '@myoflow/lib'
import { Card, CardContent } from '@/components/ui/card'
import {
  Calendar,
  Euro,
  AlertTriangle,
  Users,
  Clock
} from 'lucide-react'

export default function Dashboard() {
  const { t } = useTranslation()

  // Mock data - in real app this would come from API
  const currentYearRevenue = 42750 // €42,750
  const kleinunternehmerThreshold = 55000 // €55,000
  const remainingThreshold = kleinunternehmerThreshold - currentYearRevenue // €12,250
  const thresholdProgress = (currentYearRevenue / kleinunternehmerThreshold) * 100

  const todayAppointments = [
    { time: '09:00', client: 'Maria Huber', service: 'Klassische Massage', duration: '60 min' },
    { time: '11:00', client: 'Franz Müller', service: 'Physiotherapie', duration: '45 min' },
    { time: '14:30', client: 'Anna Schmidt', service: 'Lymphdrainage', duration: '90 min' },
  ]

  const recentActivity = [
    { type: 'invoice', description: 'Rechnung #2025-001 erstellt für Maria Huber', time: '2 hours ago', amount: '€75.00' },
    { type: 'appointment', description: 'Neuer Termin gebucht von Franz Müller', time: '4 hours ago' },
    { type: 'payment', description: 'Zahlung erhalten von Anna Schmidt', time: '1 day ago', amount: '€120.00' },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.welcome', 'Willkommen zurück!')}</h1>
        <p className="text-gray-600">{t('dashboard.overview', 'Hier ist Ihr Praxis-Überblick für heute')}</p>
      </div>

      {/* Kleinunternehmer Status - Most Important */}
      <div className="bg-gradient-to-r from-medical-blue to-medical-blue-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">{t('dashboard.kleinunternehmerStatus', 'Kleinunternehmer Status 2025')}</h2>
            <p className="text-medical-blue-100">{t('dashboard.revenueMonitoring', 'Umsatzgrenze Überwachung')}</p>
          </div>
          <Euro className="h-8 w-8 text-medical-blue-200" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <div className="text-2xl font-bold">{formatAustrianCurrency(currentYearRevenue)}</div>
            <div className="text-sm text-medical-blue-100">{t('dashboard.currentAnnualRevenue', 'Aktueller Jahresumsatz')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{formatAustrianCurrency(remainingThreshold)}</div>
            <div className="text-sm text-medical-blue-100">{t('dashboard.remainingBudget', 'Verbleibendes Budget')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{thresholdProgress.toFixed(1)}%</div>
            <div className="text-sm text-medical-blue-100">{t('dashboard.thresholdReached', 'Der Grenze erreicht')}</div>
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
          <span>{thresholdProgress > 80 ? t('dashboard.warningNearLimit', '⚠️ Achtung: Nähert sich der Grenze') : t('dashboard.safeUnderLimit', 'Sicher unter der Grenze')}</span>
          <span>€55.000</span>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('dashboard.totalClients', 'Klienten Gesamt')}</p>
              <p className="text-2xl font-bold text-gray-900">247</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('dashboard.todayAppointments', 'Termine Heute')}</p>
              <p className="text-2xl font-bold text-gray-900">{todayAppointments.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Euro className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('dashboard.monthlyRevenue', 'Monatserlös')}</p>
              <p className="text-2xl font-bold text-gray-900">€4,320</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('dashboard.actionRequired', 'Handlungsbedarf')}</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Schedule & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.todaysSchedule', 'Heutige Termine')}</h3>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {todayAppointments.map((appointment, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">{appointment.time}</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{appointment.client}</p>
                  <p className="text-sm text-gray-600">{appointment.service} • {appointment.duration}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.recentActivity', 'Letzte Aktivitäten')}</h3>
          </div>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
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
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}