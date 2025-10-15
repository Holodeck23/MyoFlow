'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from '@myoflow/lib'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Label, Input } from '@/components/ui'
import { Settings as SettingsIcon, AlertCircle, Bell, Globe, Monitor, CheckCircle2 } from 'lucide-react'
import { useSettingsEndpoint } from '../lib/api-config'

interface SystemTabProps {
  isActive?: boolean
}

interface FormValues {
  language: string
  timezone: string
  currency: string
  dateFormat: string
  appointmentReminderDays: number
  enableEmailNotifications: boolean
  enableSmsNotifications: boolean
  enableComplianceAlerts: boolean
  enableTravelAlerts: boolean
}

const LANGUAGE_OPTIONS = [
  { value: 'DE', label: 'Deutsch' },
  { value: 'EN', label: 'English' },
]

const DATE_FORMAT_OPTIONS = [
  { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
]

const DEFAULT_FORM_VALUES: FormValues = {
  language: 'DE',
  timezone: 'Europe/Vienna',
  currency: 'EUR',
  dateFormat: 'DD.MM.YYYY',
  appointmentReminderDays: 1,
  enableEmailNotifications: true,
  enableSmsNotifications: false,
  enableComplianceAlerts: true,
  enableTravelAlerts: true,
}

export function SystemTab({ isActive = false }: SystemTabProps) {
  const { t } = useTranslation()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const {
    data: systemResponse,
    loading: isLoading,
    error: fetchError,
    refetch,
  } = useSettingsEndpoint('system', isActive)

  const form = useForm<FormValues>({
    defaultValues: DEFAULT_FORM_VALUES,
  })

  useEffect(() => {
    if (systemResponse) {
      form.reset({
        language: systemResponse.language ?? 'DE',
        timezone: systemResponse.timezone ?? 'Europe/Vienna',
        currency: systemResponse.currency ?? 'EUR',
        dateFormat: systemResponse.dateFormat ?? 'DD.MM.YYYY',
        appointmentReminderDays: systemResponse.appointmentReminderDays ?? 1,
        enableEmailNotifications: Boolean(systemResponse.enableEmailNotifications),
        enableSmsNotifications: Boolean(systemResponse.enableSmsNotifications),
        enableComplianceAlerts: Boolean(systemResponse.enableComplianceAlerts),
        enableTravelAlerts: Boolean(systemResponse.enableTravelAlerts),
      })
    }
  }, [systemResponse, form])

  const handleSubmit = form.handleSubmit(async (values: FormValues) => {
    setSaveError(null)
    setSaveSuccess(null)
    setIsSaving(true)

    try {
      const response = await fetch('/api/settings/system', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: values.language,
          timezone: values.timezone,
          currency: values.currency,
          dateFormat: values.dateFormat,
          appointmentReminderDays: Number(values.appointmentReminderDays),
          enableEmailNotifications: values.enableEmailNotifications,
          enableSmsNotifications: values.enableSmsNotifications,
          enableComplianceAlerts: values.enableComplianceAlerts,
          enableTravelAlerts: values.enableTravelAlerts,
        }),
      })

      const json = await response.json()

      if (!response.ok || json.success === false) {
        const errorMessage =
          (json && typeof json.error === 'string' && json.error) ||
          'Failed to update system preferences'
        setSaveError(errorMessage)
        return
      }

      setSaveSuccess('System preferences updated successfully')
      await refetch()
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : 'Network error saving system preferences',
      )
    } finally {
      setIsSaving(false)
    }
  })

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

  if (fetchError) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="font-medium text-red-800">Failed to load system settings</h3>
              <p className="text-red-600 text-sm mt-1">{fetchError}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
              >
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <SettingsIcon className="w-5 h-5" />
                <span>System Preferences</span>
              </CardTitle>
              <CardDescription>
                Configure language, localization, notifications, and default reminders.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {saveError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{saveError}</p>
                    </div>
                  </div>
                </div>
              )}

              {saveSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-md p-4">
                  <div className="flex">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <div className="ml-3">
                      <p className="text-sm text-emerald-700">{saveSuccess}</p>
                    </div>
                  </div>
                </div>
              )}

              <section className="space-y-4">
                <h3 className="text-lg font-medium flex items-center space-x-2">
                  <Globe className="w-5 h-5" />
                  <span>Language & Localization</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="language">Interface Language</Label>
                    <select
                      id="language"
                      {...form.register('language')}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {LANGUAGE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input id="timezone" {...form.register('timezone')} />
                  </div>
                  <div>
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <select
                      id="dateFormat"
                      {...form.register('dateFormat')}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {DATE_FORMAT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Input id="currency" {...form.register('currency')} />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-lg font-medium flex items-center space-x-2">
                  <Bell className="w-5 h-5" />
                  <span>Notifications</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-gray-600">Appointment reminders and updates</p>
                    </div>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={form.watch('enableEmailNotifications')}
                      onChange={(event) =>
                        form.setValue('enableEmailNotifications', event.target.checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">SMS Notifications</p>
                      <p className="text-sm text-gray-600">Client appointment confirmations</p>
                    </div>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={form.watch('enableSmsNotifications')}
                      onChange={(event) =>
                        form.setValue('enableSmsNotifications', event.target.checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Compliance Alerts</p>
                      <p className="text-sm text-gray-600">Kleinunternehmer and VAT threshold alerts</p>
                    </div>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={form.watch('enableComplianceAlerts')}
                      onChange={(event) =>
                        form.setValue('enableComplianceAlerts', event.target.checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Travel Notifications</p>
                      <p className="text-sm text-gray-600">Reminders for travel buffer and mileage</p>
                    </div>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={form.watch('enableTravelAlerts')}
                      onChange={(event) =>
                        form.setValue('enableTravelAlerts', event.target.checked)
                      }
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-lg font-medium flex items-center space-x-2">
                  <Monitor className="w-5 h-5" />
                  <span>Reminders & Defaults</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="appointmentReminderDays">Client Reminder (days)</Label>
                    <Input
                      id="appointmentReminderDays"
                      type="number"
                      min={0}
                      max={30}
                      {...form.register('appointmentReminderDays', { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </section>

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => refetch()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <p>
              Interface Language:{' '}
              {LANGUAGE_OPTIONS.find((option) => option.value === form.watch('language'))?.label ||
                form.watch('language')}
            </p>
            <p>Timezone: {form.watch('timezone')}</p>
            <p>Date Format: {form.watch('dateFormat')}</p>
            <p>Currency: {form.watch('currency')}</p>
            <p>Client Reminder: {form.watch('appointmentReminderDays')} days before appointment</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
