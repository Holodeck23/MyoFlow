'use client'

import { useState } from 'react'
import { useTranslation } from '@myoflow/lib'
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
import { MapPin, AlertCircle, Plane } from 'lucide-react'
import { useSettingsEndpoint } from '../lib/api-config'

interface TravelTabProps {
  profileData: any
  isActive?: boolean
}

export function TravelTab({ profileData, isActive = false }: TravelTabProps) {
  const { t } = useTranslation()
  const [isSaving, setIsSaving] = useState(false)

  // Only fetch when tab is active
  const { data: travelSettings, loading: isLoading, error } = useSettingsEndpoint('travel', isActive)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading travel settings...</p>
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
              <MapPin className="w-5 h-5" />
              <span>Travel & Location Settings</span>
            </CardTitle>
            <CardDescription>
              Configure your base location and travel preferences for mobile services.
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
              <div>
                <h3 className="text-lg font-medium mb-4">Base Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="base-address">Address</Label>
                    <Input
                      id="base-address"
                      placeholder="Landstraße 1, 4020 Linz"
                      value={travelSettings?.baseAddress || ''}
                      readOnly
                    />
                  </div>
                  <div>
                    <Label htmlFor="travel-radius">Max Travel Radius (km)</Label>
                    <Input
                      id="travel-radius"
                      type="number"
                      placeholder="25"
                      value={travelSettings?.maxTravelRadius || ''}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Travel Rates</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="rate-per-km">Rate per km (€)</Label>
                    <Input
                      id="rate-per-km"
                      type="number"
                      step="0.01"
                      placeholder="0.80"
                      value={travelSettings?.ratePerKm || ''}
                      readOnly
                    />
                  </div>
                  <div>
                    <Label htmlFor="min-travel-fee">Minimum Fee (€)</Label>
                    <Input
                      id="min-travel-fee"
                      type="number"
                      step="0.01"
                      placeholder="10.00"
                      value={travelSettings?.minimumFee || ''}
                      readOnly
                    />
                  </div>
                  <div>
                    <Label htmlFor="buffer-minutes">Travel Buffer (min)</Label>
                    <Input
                      id="buffer-minutes"
                      type="number"
                      placeholder="15"
                      value={travelSettings?.bufferMinutes || ''}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex">
                <Plane className="h-5 w-5 text-blue-400" />
                <div className="ml-3">
                  <p className="text-sm text-blue-800">
                    Travel settings are currently read-only. Full configuration will be available in a future update.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Travel Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Service Area</p>
                <p className="font-medium">
                  {travelSettings?.maxTravelRadius ? `${travelSettings.maxTravelRadius} km radius` : 'Not configured'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Base Rate</p>
                <p className="font-medium">
                  {travelSettings?.ratePerKm ? `€${travelSettings.ratePerKm}/km` : 'Not configured'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Minimum Fee</p>
                <p className="font-medium">
                  {travelSettings?.minimumFee ? `€${travelSettings.minimumFee}` : 'Not configured'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}