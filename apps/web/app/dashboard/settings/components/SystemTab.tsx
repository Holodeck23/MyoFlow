'use client'

import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Label,
  Input
} from '@/components/ui'
import { Settings as SettingsIcon, AlertCircle, CheckCircle, Bell, Globe, Monitor } from 'lucide-react'
import { useSettingsEndpoint } from '../lib/api-config'

type LanguageOption = 'EN' | 'DE'
type DateFormatOption = 'DD.MM.YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
type CurrencyOption = 'EUR'

interface SystemPreferencesForm {
  language: LanguageOption
  timezone: string
  currency: CurrencyOption
  dateFormat: DateFormatOption
  appointmentReminderDays: string
  enableEmailNotifications: boolean
  enableSmsNotifications: boolean
  enableComplianceAlerts: boolean
  enableTravelAlerts: boolean
}

interface SystemTabProps {
  isActive?: boolean
}

const LANGUAGE_LABELS: Record<LanguageOption, string> = {
  DE: 'Deutsch',
  EN: 'English'
}

const DATE_FORMAT_LABELS: Record<DateFormatOption, string> = {
  'DD.MM.YYYY': 'DD.MM.YYYY (Austria)',
  'MM/DD/YYYY': 'MM/DD/YYYY (US)',
  'YYYY-MM-DD': 'YYYY-MM-DD (ISO)'
}

const CURRENCY_LABELS: Record<CurrencyOption, string> = {
  EUR: 'Euro (€)'
}

export function SystemTab({ isActive = false }: SystemTabProps) {
  const [formData, setFormData] = useState<SystemPreferencesForm>({
    language: 'DE',
    timezone: 'Europe/Vienna',
    currency: 'EUR',
    dateFormat: 'DD.MM.YYYY',
    appointmentReminderDays: '1',
    enableEmailNotifications: true,
    enableSmsNotifications: false,
    enableComplianceAlerts: true,
    enableTravelAlerts: true
  })
  const [success, setSuccess] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const {
    data: systemSettings,
    loading: isLoading,
    error,
    refetch
  } = useSettingsEndpoint('system', isActive)

  useEffect(() => {
    if (!systemSettings) return
    setFormData({
      language: (systemSettings.language || 'DE') as LanguageOption,
      timezone: systemSettings.timezone || 'Europe/Vienna',
      currency: (systemSettings.currency || 'EUR') as CurrencyOption,
      dateFormat: (systemSettings.dateFormat || 'DD.MM.YYYY') as DateFormatOption,
      appointmentReminderDays:
        systemSettings.appointmentReminderDays !== undefined
          ? String(systemSettings.appointmentReminderDays)
          : '1',
      enableEmailNotifications: systemSettings.enableEmailNotifications !== false,
      enableSmsNotifications: Boolean(systemSettings.enableSmsNotifications),
      enableComplianceAlerts: systemSettings.enableComplianceAlerts !== false,
      enableTravelAlerts: systemSettings.enableTravelAlerts !== false
    })
    setSuccess(false)
  }, [systemSettings])

  const handleChange = <K extends keyof SystemPreferencesForm>(field: K, value: SystemPreferencesForm[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setSuccess(false)
  }

  const handleSave = async () => {
    setFormError(null)
    const reminderDays = parseInt(formData.appointmentReminderDays, 10)
    if (Number.isNaN(reminderDays) || reminderDays < 0 || reminderDays > 30) {
      setFormError('Reminder days must be between 0 and 30.')
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch('/api/settings/system', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: formData.language,
          timezone: formData.timezone,
          currency: formData.currency,
          dateFormat: formData.dateFormat,
          appointmentReminderDays: reminderDays,
          enableEmailNotifications: formData.enableEmailNotifications,
          enableSmsNotifications: formData.enableSmsNotifications,
          enableComplianceAlerts: formData.enableComplianceAlerts,
          enableTravelAlerts: formData.enableTravelAlerts
        })
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'Failed to update system preferences')
      }

      await refetch()
      setSuccess(true)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save system preferences.')
      setSuccess(false)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading system settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <SettingsIcon className="w-5 h-5" />
              <span>System Preferences</span>
            </CardTitle>
            <CardDescription>
              Configure language, notifications, and scheduling defaults for your practice.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {formError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{formError}</p>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div className="ml-3">
                    <p className="text-sm text-green-800">System preferences saved.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-medium flex items-center space-x-2">
                <Globe className="w-5 h-5" />
                <span>Language &amp; Regional Settings</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pref-language">Interface Language</Label>
                  <select
                    id="pref-language"
                    value={formData.language}
                    onChange={(e) => handleChange('language', e.target.value as LanguageOption)}
                    className="w-full rounded-md border border-gray-300 p-2"
                  >
                    {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="pref-date-format">Date Format</Label>
                  <select
                    id="pref-date-format"
                    value={formData.dateFormat}
                    onChange={(e) => handleChange('dateFormat', e.target.value as DateFormatOption)}
                    className="w-full rounded-md border border-gray-300 p-2"
                  >
                    {Object.entries(DATE_FORMAT_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="pref-timezone">Timezone</Label>
                  <Input
                    id="pref-timezone"
                    value={formData.timezone}
                    onChange={(e) => handleChange('timezone', e.target.value)}
                    placeholder="Europe/Vienna"
                  />
                </div>
                <div>
                  <Label htmlFor="pref-currency">Currency</Label>
                  <select
                    id="pref-currency"
                    value={formData.currency}
                    onChange={(e) => handleChange('currency', e.target.value as CurrencyOption)}
                    className="w-full rounded-md border border-gray-300 p-2"
                  >
                    {Object.entries(CURRENCY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-medium flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Notifications</span>
              </h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">Email Notifications</p>
                    <p className="text-sm text-gray-600">Appointment reminders and daily summaries.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.enableEmailNotifications}
                    onChange={(e) => handleChange('enableEmailNotifications', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
                <label className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">SMS Notifications</p>
                    <p className="text-sm text-gray-600">Client reminders via SMS (requires SMS balance).</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.enableSmsNotifications}
                    onChange={(e) => handleChange('enableSmsNotifications', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
                <label className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">Compliance Alerts</p>
                    <p className="text-sm text-gray-600">Receive warnings for VAT and RKSV thresholds.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.enableComplianceAlerts}
                    onChange={(e) => handleChange('enableComplianceAlerts', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
                <label className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">Travel Alerts</p>
                    <p className="text-sm text-gray-600">Notify when travel buffers cause scheduling conflicts.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.enableTravelAlerts}
                    onChange={(e) => handleChange('enableTravelAlerts', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-medium flex items-center space-x-2">
                <Monitor className="w-5 h-5" />
                <span>Scheduling Defaults</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reminder-days">Appointment Reminder (days before)</Label>
                  <Input
                    id="reminder-days"
                    type="number"
                    min="0"
                    max="30"
                    value={formData.appointmentReminderDays}
                    onChange={(e) => handleChange('appointmentReminderDays', e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <p className="text-xs text-gray-500">
                    Set to 0 to disable automatic reminders. Standard Austrian clinics use 1 day.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => refetch()}>
                Reset
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Save Preferences'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <div className="flex items-center justify-between">
              <span>Language</span>
              <span className="font-medium text-gray-900">{LANGUAGE_LABELS[formData.language]}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Timezone</span>
              <span className="font-medium text-gray-900">{formData.timezone}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Currency</span>
              <span className="font-medium text-gray-900">{CURRENCY_LABELS[formData.currency]}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Date Format</span>
              <span className="font-medium text-gray-900">{formData.dateFormat}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Reminder Lead Time</span>
              <span className="font-medium text-gray-900">
                {formData.appointmentReminderDays} day(s)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Email Notifications</span>
              <span className="font-medium text-gray-900">
                {formData.enableEmailNotifications ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>SMS Notifications</span>
              <span className="font-medium text-gray-900">
                {formData.enableSmsNotifications ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Localization Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <p>
              Use <strong>English</strong> during development to match translation keys, and switch to
              <strong> Deutsch</strong> before presenting to Austrian therapists.
            </p>
            <p>
              Adjust <strong>reminder lead time</strong> for high-risk patients to 2-3 days to reduce
              no-shows.
            </p>
            <p>
              SMS reminders require an active SMS provider; enable only after configuring the gateway.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
