'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from '@myoflow/lib'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Label, Input } from '@/components/ui'
import { MapPin, AlertCircle, Plane, CheckCircle2 } from 'lucide-react'
import { useSettingsEndpoint } from '../lib/api-config'

interface TravelTabProps {
  isActive?: boolean
}

type TransportMethodOption = 'CAR' | 'PUBLIC_TRANSPORT' | 'BICYCLE' | 'WALKING' | 'MOTORCYCLE'

interface FormValues {
  baseAddressLine1: string
  baseAddressLine2: string
  baseCity: string
  basePostalCode: string
  baseCountry: string
  transportMethod: TransportMethodOption
  ratePerKmCents: number
  minimumTravelChargeCents: number
  maximumTravelDistanceKm: number
  travelBufferMinutes: number
}

const TRANSPORT_OPTIONS: { value: TransportMethodOption; label: string }[] = [
  { value: 'CAR', label: 'Car' },
  { value: 'PUBLIC_TRANSPORT', label: 'Public transport' },
  { value: 'BICYCLE', label: 'Bicycle' },
  { value: 'WALKING', label: 'Walking' },
  { value: 'MOTORCYCLE', label: 'Motorcycle' },
]

const DEFAULT_FORM_VALUES: FormValues = {
  baseAddressLine1: '',
  baseAddressLine2: '',
  baseCity: '',
  basePostalCode: '',
  baseCountry: 'Austria',
  transportMethod: 'CAR',
  ratePerKmCents: 80,
  minimumTravelChargeCents: 700,
  maximumTravelDistanceKm: 50,
  travelBufferMinutes: 15,
}

export function TravelTab({ isActive = false }: TravelTabProps) {
  const { t } = useTranslation()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const {
    data: travelResponse,
    loading: isLoading,
    error: fetchError,
    message: fetchMessage,
    refetch,
  } = useSettingsEndpoint('travel', isActive)

  const form = useForm<FormValues>({
    defaultValues: DEFAULT_FORM_VALUES,
  })

  useEffect(() => {
    if (travelResponse) {
      form.reset({
        baseAddressLine1: travelResponse.baseAddressLine1 ?? '',
        baseAddressLine2: travelResponse.baseAddressLine2 ?? '',
        baseCity: travelResponse.baseCity ?? '',
        basePostalCode: travelResponse.basePostalCode ?? '',
        baseCountry: travelResponse.baseCountry ?? 'Austria',
        transportMethod: travelResponse.transportMethod ?? 'CAR',
        ratePerKmCents: travelResponse.ratePerKmCents ?? 80,
        minimumTravelChargeCents: travelResponse.minimumTravelChargeCents ?? 700,
        maximumTravelDistanceKm: travelResponse.maximumTravelDistanceKm ?? 50,
        travelBufferMinutes: travelResponse.travelBufferMinutes ?? 15,
      })
    }
  }, [travelResponse, form])

  const handleSubmit = form.handleSubmit(async (values: FormValues) => {
    setSaveError(null)
    setSaveSuccess(null)
    setIsSaving(true)

    try {
      const response = await fetch('/api/settings/travel', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseAddressLine1: values.baseAddressLine1 || undefined,
          baseAddressLine2: values.baseAddressLine2 || null,
          baseCity: values.baseCity || undefined,
          basePostalCode: values.basePostalCode || undefined,
          baseCountry: values.baseCountry || undefined,
          transportMethod: values.transportMethod,
          ratePerKmCents: Number(values.ratePerKmCents),
          minimumTravelChargeCents: Number(values.minimumTravelChargeCents),
          maximumTravelDistanceKm: Number(values.maximumTravelDistanceKm),
          travelBufferMinutes: Number(values.travelBufferMinutes),
        }),
      })

      const json = await response.json()

      if (!response.ok || (json && json.success === false)) {
        const errorMessage =
          (json && typeof json.error === 'string' && json.error) ||
          'Failed to save travel settings'
        setSaveError(errorMessage)
        return
      }

      setSaveSuccess('Travel settings updated successfully')
      await refetch()
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Network error saving travel settings')
    } finally {
      setIsSaving(false)
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading travel settings...</p>
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
              <h3 className="font-medium text-red-800">Failed to load travel settings</h3>
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

  const currentSettings = travelResponse ?? DEFAULT_FORM_VALUES

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <form onSubmit={handleSubmit}>
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
            <CardContent className="space-y-6">
              {(saveError || fetchMessage) && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{saveError ?? fetchMessage}</p>
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
                <h3 className="text-lg font-medium">Base Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="baseAddressLine1">Address Line 1</Label>
                    <Input id="baseAddressLine1" {...form.register('baseAddressLine1')} />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="baseAddressLine2">Address Line 2 (optional)</Label>
                    <Input id="baseAddressLine2" {...form.register('baseAddressLine2')} />
                  </div>
                  <div>
                    <Label htmlFor="baseCity">City</Label>
                    <Input id="baseCity" {...form.register('baseCity')} />
                  </div>
                  <div>
                    <Label htmlFor="basePostalCode">Postal Code</Label>
                    <Input id="basePostalCode" {...form.register('basePostalCode')} />
                  </div>
                  <div>
                    <Label htmlFor="baseCountry">Country</Label>
                    <Input id="baseCountry" {...form.register('baseCountry')} />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-lg font-medium">Travel Preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="transportMethod">Transport Method</Label>
                    <select
                      id="transportMethod"
                      {...form.register('transportMethod')}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {TRANSPORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="travelBufferMinutes">Travel Buffer (minutes)</Label>
                    <Input
                      id="travelBufferMinutes"
                      type="number"
                      min={0}
                      max={180}
                      {...form.register('travelBufferMinutes', { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maximumTravelDistanceKm">Maximum Distance (km)</Label>
                    <Input
                      id="maximumTravelDistanceKm"
                      type="number"
                      min={1}
                      max={1000}
                      {...form.register('maximumTravelDistanceKm', { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-lg font-medium">Travel Rates</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="ratePerKmCents">Rate per km (cents)</Label>
                    <Input
                      id="ratePerKmCents"
                      type="number"
                      min={0}
                      max={10000}
                      {...form.register('ratePerKmCents', { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="minimumTravelChargeCents">Minimum Fee (cents)</Label>
                    <Input
                      id="minimumTravelChargeCents"
                      type="number"
                      min={0}
                      max={100000}
                      {...form.register('minimumTravelChargeCents', { valueAsNumber: true })}
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
            <CardTitle className="text-lg">Travel Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Service Area</p>
                <p className="font-medium">
                  {currentSettings.maximumTravelDistanceKm
                    ? `${currentSettings.maximumTravelDistanceKm} km radius`
                    : 'Not configured'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Transport Method</p>
                <p className="font-medium">
                  {
                    TRANSPORT_OPTIONS.find((option) => option.value === currentSettings.transportMethod)
                      ?.label
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Rate per km</p>
                <p className="font-medium">
                  €{((currentSettings.ratePerKmCents ?? 0) / 100).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Minimum Fee</p>
                <p className="font-medium">
                  €{((currentSettings.minimumTravelChargeCents ?? 0) / 100).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Travel Buffer</p>
                <p className="font-medium">
                  {currentSettings.travelBufferMinutes ?? 15} minutes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
