'use client'

import { useState } from 'react'
import { useTranslation } from '@myoflow/lib'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button
} from '@/components/ui'
import { Settings as SettingsIcon, AlertCircle, Bell, Globe, Monitor } from 'lucide-react'
import { useSettingsEndpoint } from '../lib/api-config'

interface SystemTabProps {
  profileData: any
  isActive?: boolean
}

export function SystemTab({ profileData, isActive = false }: SystemTabProps) {
  const { t } = useTranslation()

  // Only fetch when tab is active
  const { data: systemSettings, loading: isLoading, error } = useSettingsEndpoint('system', isActive)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading system settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <SettingsIcon className="w-5 h-5" />
              <span>System Preferences</span>
            </CardTitle>
            <CardDescription>
              Configure language, notifications, and system preferences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* Language & Localization */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center space-x-2">
                  <Globe className="w-5 h-5" />
                  <span>Language & Localization</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="font-medium mb-2">Interface Language</p>
                    <p className="text-sm text-gray-600 mb-3">
                      Current: {systemSettings?.language || 'German (Deutsch)'}
                    </p>
                    <Button variant="outline" size="sm" disabled>
                      Change Language
                    </Button>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="font-medium mb-2">Date & Time Format</p>
                    <p className="text-sm text-gray-600 mb-3">
                      Current: Austrian (DD.MM.YYYY)
                    </p>
                    <Button variant="outline" size="sm" disabled>
                      Change Format
                    </Button>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center space-x-2">
                  <Bell className="w-5 h-5" />
                  <span>Notifications</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-gray-600">Appointment reminders and updates</p>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      Configure
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">SMS Notifications</p>
                      <p className="text-sm text-gray-600">Client appointment confirmations</p>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      Configure
                    </Button>
                  </div>
                </div>
              </div>

              {/* Display Preferences */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center space-x-2">
                  <Monitor className="w-5 h-5" />
                  <span>Display Preferences</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="font-medium mb-2">Theme</p>
                    <p className="text-sm text-gray-600 mb-3">
                      Current: Light Theme
                    </p>
                    <Button variant="outline" size="sm" disabled>
                      Switch Theme
                    </Button>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="font-medium mb-2">Calendar View</p>
                    <p className="text-sm text-gray-600 mb-3">
                      Default: Week View
                    </p>
                    <Button variant="outline" size="sm" disabled>
                      Change Default
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex">
                  <SettingsIcon className="h-5 w-5 text-blue-400" />
                  <div className="ml-3">
                    <p className="text-sm text-blue-800">
                      System preferences are currently read-only. Full configuration will be available in a future update.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Language</p>
                <p className="font-medium">
                  {systemSettings?.language || 'German (Deutsch)'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Timezone</p>
                <p className="font-medium">
                  {systemSettings?.timezone || 'Europe/Vienna'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Currency</p>
                <p className="font-medium">
                  {systemSettings?.currency || 'EUR (€)'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date Format</p>
                <p className="font-medium">
                  {systemSettings?.dateFormat || 'DD.MM.YYYY'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Version</p>
                <p className="font-medium">MyoFlow v1.7.0</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="font-medium">
                  {systemSettings?.lastUpdated ?
                    new Date(systemSettings.lastUpdated).toLocaleDateString('de-AT') :
                    'Never'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}