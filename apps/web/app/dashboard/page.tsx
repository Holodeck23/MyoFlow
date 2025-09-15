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
  const currentYearRevenue = 38420 // €38,420 (more realistic monthly progression)
  const kleinunternehmerThreshold = 55000 // €55,000 Austrian threshold
  const remainingThreshold = kleinunternehmerThreshold - currentYearRevenue // €16,580
  const thresholdProgress = (currentYearRevenue / kleinunternehmerThreshold) * 100
  const monthsIntoYear = 9 // September
  const averageMonthlyRevenue = currentYearRevenue / monthsIntoYear
  const projectedYearEnd = averageMonthlyRevenue * 12

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
      {/* Kleinunternehmer Status - Most Important */}
      <div className="bg-gradient-to-br from-medical-blue via-blue-600 to-medical-blue-800 rounded-lg p-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">{t('dashboard.kleinunternehmerStatus', 'Kleinunternehmer Status 2025')}</h2>
            <p className="text-medical-blue-100">{t('dashboard.revenueMonitoring', 'Umsatzgrenze Überwachung')}</p>
          </div>
          <Euro className="h-8 w-8 text-medical-blue-200" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <div className="text-2xl font-bold">{formatAustrianCurrency(currentYearRevenue)}</div>
            <div className="text-sm text-medical-blue-100">{t('dashboard.currentYearRevenue', 'Jahresumsatz (Jan-Sep)')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{formatAustrianCurrency(remainingThreshold)}</div>
            <div className="text-sm text-medical-blue-100">{t('dashboard.remainingAllowance', 'Noch verfügbar')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{formatAustrianCurrency(Math.round(projectedYearEnd))}</div>
            <div className="text-sm text-medical-blue-100">{t('dashboard.projectedTotal', 'Hochgerechnetes Jahresende')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{thresholdProgress.toFixed(1)}%</div>
            <div className="text-sm text-medical-blue-100">{t('dashboard.thresholdUsed', 'Grenze ausgeschöpft')}</div>
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
              ? t('dashboard.warningProjectedExceed', '⚠️ Hochrechnung überschreitet Grenze!')
              : thresholdProgress > 80
                ? t('dashboard.warningNearLimit', '⚠️ Achtung: Nähert sich der Grenze')
                : t('dashboard.safeUnderLimit', '✅ Sicher unter der Grenze')
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
              <p className="text-sm font-medium text-gray-600">{t('dashboard.totalClients', 'Klienten Gesamt')}</p>
              <p className="text-2xl font-bold text-gray-900">247</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-green-50 rounded-lg shadow-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('dashboard.todayAppointments', 'Termine Heute')}</p>
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
              <p className="text-sm font-medium text-gray-600">{t('dashboard.monthlyAverage', 'Monatsdurchschnitt')}</p>
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