'use client'

import { useEffect, useMemo, useState } from 'react'
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
import { MapPin, AlertCircle, Plane, CheckCircle } from 'lucide-react'
import { useSettingsEndpoint } from '../lib/api-config'

type TransportMethod = 'CAR' | 'BICYCLE' | 'PUBLIC_TRANSPORT' | 'WALKING' | 'MOTORCYCLE'

interface TravelFormData {
  baseAddressLine1: string
  baseAddressLine2: string
  baseCity: string
  basePostalCode: string
  baseCountry: string
  transportMethod: TransportMethod
  ratePerKmEuro: string
  minimumTravelFeeEuro: string
  maximumTravelDistanceKm: string
  travelBufferMinutes: string
}

const TRANSPORT_LABELS: Record<TransportMethod, string> = {
  CAR: 'Car',
  BICYCLE: 'Bicycle',
  PUBLIC_TRANSPORT: 'Public Transport',
  WALKING: 'Walking',
  MOTORCYCLE: 'Motorcycle'
}

interface TravelTabProps {
  isActive?: boolean
}

export function TravelTab({ isActive = false }: TravelTabProps) {
  const { t } = useTranslation()
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [formData, setFormData] = useState<TravelFormData>({
    baseAddressLine1: '',
    baseAddressLine2: '',
    baseCity: '',
    basePostalCode: '',
    baseCountry: 'Austria',
    transportMethod: 'CAR',
    ratePerKmEuro: '0.80',
    minimumTravelFeeEuro: '7.00',
    maximumTravelDistanceKm: '50',
    travelBufferMinutes: '15'
  })

  const {
    data: travelSettings,
    loading: isLoading,
    error,
    refetch
  } = useSettingsEndpoint('travel', isActive)

  useEffect(() => {
    if (!travelSettings) return
    setFormData({
      baseAddressLine1: travelSettings.baseAddressLine1 || '',
      baseAddressLine2: travelSettings.baseAddressLine2 || '',
      baseCity: travelSettings.baseCity || '',
      basePostalCode: travelSettings.basePostalCode || '',
      baseCountry: travelSettings.baseCountry || 'Austria',
      transportMethod: (travelSettings.transportMethod || 'CAR') as TransportMethod,
      ratePerKmEuro:
        travelSettings.ratePerKmCents !== undefined
          ? (travelSettings.ratePerKmCents / 100).toFixed(2)
          : '0.80',
      minimumTravelFeeEuro:
        travelSettings.minimumTravelChargeCents !== undefined
          ? (travelSettings.minimumTravelChargeCents / 100).toFixed(2)
          : '7.00',
      maximumTravelDistanceKm:
        travelSettings.maximumTravelDistanceKm !== undefined
          ? String(travelSettings.maximumTravelDistanceKm)
          : '',
      travelBufferMinutes:
        travelSettings.travelBufferMinutes !== undefined
          ? String(travelSettings.travelBufferMinutes)
          : '15'
    })
    setSuccess(false)
    setValidationError(null)
  }, [travelSettings])

  const handleChange = <K extends keyof TravelFormData>(field: K, value: TravelFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setSuccess(false)
  }

  const parseEuroToCents = (value: string, fallback: number) => {
    const normalised = value.replace(',', '.')
    const parsed = parseFloat(normalised)
    if (Number.isNaN(parsed)) {
      return fallback
    }
    return Math.round(parsed * 100)
  }

  const parseInteger = (value: string) => {
    const parsed = parseInt(value, 10)
    return Number.isNaN(parsed) ? null : parsed
  }

  const handleSave = async () => {
    setValidationError(null)

    const ratePerKmCents = parseEuroToCents(formData.ratePerKmEuro, 80)
    const minimumTravelChargeCents = parseEuroToCents(formData.minimumTravelFeeEuro, 700)
    const maximumTravelDistanceKm = parseInteger(formData.maximumTravelDistanceKm)
    const travelBufferMinutes = parseInteger(formData.travelBufferMinutes)

    if (ratePerKmCents < 0 || minimumTravelChargeCents < 0) {
      setValidationError('Travel rates must be positive numbers.')
      return
    }

    if (maximumTravelDistanceKm !== null && maximumTravelDistanceKm <= 0) {
      setValidationError('Maximum travel distance must be greater than 0 km.')
      return
    }

    if (travelBufferMinutes !== null && travelBufferMinutes < 0) {
      setValidationError('Travel buffer cannot be negative.')
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch('/api/settings/travel', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseAddressLine1: formData.baseAddressLine1 || undefined,
          baseAddressLine2: formData.baseAddressLine2 || undefined,
          baseCity: formData.baseCity || undefined,
          basePostalCode: formData.basePostalCode || undefined,
          baseCountry: formData.baseCountry || undefined,
          transportMethod: formData.transportMethod,
          ratePerKmCents,
          minimumTravelChargeCents,
          maximumTravelDistanceKm: maximumTravelDistanceKm ?? undefined,
          travelBufferMinutes: travelBufferMinutes ?? undefined
        })
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'Failed to update travel settings')
      }

      await refetch()
      setSuccess(true)
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Unable to save changes.')
      setSuccess(false)
    } finally {
      setIsSaving(false)
    }
  }

  const travelSummary = useMemo(() => {
    if (!travelSettings) return null
    return {
      radius: travelSettings.maximumTravelDistanceKm
        ? `${travelSettings.maximumTravelDistanceKm} km`
        : 'Not configured',
      rate:
        travelSettings.ratePerKmCents !== undefined
          ? `€${(travelSettings.ratePerKmCents / 100).toFixed(2)}/km`
          : 'Not configured',
      minimum:
        travelSettings.minimumTravelChargeCents !== undefined
          ? `€${(travelSettings.minimumTravelChargeCents / 100).toFixed(2)}`
          : 'Not configured',
      buffer:
        travelSettings.travelBufferMinutes !== undefined
          ? `${travelSettings.travelBufferMinutes} minutes`
          : '15 minutes',
      transportMethod: TRANSPORT_LABELS[(travelSettings.transportMethod || 'CAR') as TransportMethod],
      isDefault: Boolean(travelSettings.isDefault)
    }
  }, [travelSettings])

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="w-5 h-5" />
              <span>Travel &amp; Location Settings</span>
            </CardTitle>
            <CardDescription>
              Configure your base location, mileage rates, and travel buffers for mobile services.
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

            {validationError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{validationError}</p>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
                <div className="flex">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div className="ml-3">
                    <p className="text-sm text-green-800">Travel settings saved.</p>
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
                      placeholder="Landstraße 1"
                      value={formData.baseAddressLine1}
                      onChange={(e) => handleChange('baseAddressLine1', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="base-address-2">Address Line 2 (optional)</Label>
                    <Input
                      id="base-address-2"
                      placeholder="Top 2"
                      value={formData.baseAddressLine2}
                      onChange={(e) => handleChange('baseAddressLine2', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="base-city">City</Label>
                    <Input
                      id="base-city"
                      placeholder="Linz"
                      value={formData.baseCity}
                      onChange={(e) => handleChange('baseCity', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="base-postal">Postal Code</Label>
                    <Input
                      id="base-postal"
                      placeholder="4020"
                      value={formData.basePostalCode}
                      onChange={(e) => handleChange('basePostalCode', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="base-country">Country</Label>
                    <Input
                      id="base-country"
                      placeholder="Austria"
                      value={formData.baseCountry}
                      onChange={(e) => handleChange('baseCountry', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="travel-distance">Max Travel Distance (km)</Label>
                    <Input
                      id="travel-distance"
                      type="number"
                      placeholder="50"
                      value={formData.maximumTravelDistanceKm}
                      onChange={(e) => handleChange('maximumTravelDistanceKm', e.target.value)}
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
                      value={formData.ratePerKmEuro}
                      onChange={(e) => handleChange('ratePerKmEuro', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="min-travel-fee">Minimum Travelling Fee (€)</Label>
                    <Input
                      id="min-travel-fee"
                      type="number"
                      step="0.01"
                      placeholder="7.00"
                      value={formData.minimumTravelFeeEuro}
                      onChange={(e) => handleChange('minimumTravelFeeEuro', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="travel-buffer">Travel Buffer (minutes)</Label>
                    <Input
                      id="travel-buffer"
                      type="number"
                      placeholder="15"
                      value={formData.travelBufferMinutes}
                      onChange={(e) => handleChange('travelBufferMinutes', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Transport Method</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="transport-method">Primary Mode</Label>
                    <select
                      id="transport-method"
                      value={formData.transportMethod}
                      onChange={(e) => handleChange('transportMethod', e.target.value as TransportMethod)}
                      className="w-full rounded-md border border-gray-300 p-2"
                    >
                      {Object.entries(TRANSPORT_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => refetch()}>
                  Reset
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex">
                <Plane className="h-5 w-5 text-blue-400" />
                <div className="ml-3">
                  <p className="text-sm text-blue-800">
                    Fine-tune your travel preferences to ensure transparent pricing for mobile appointments.
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
            {travelSummary?.isDefault && (
              <CardDescription>
                Default values shown. Update and save to personalise travel pricing.
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Service Area</p>
                <p className="font-medium">{travelSummary?.radius || 'Not configured'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Base Rate</p>
                <p className="font-medium">{travelSummary?.rate || 'Not configured'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Minimum Fee</p>
                <p className="font-medium">{travelSummary?.minimum || 'Not configured'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Buffer Time</p>
                <p className="font-medium">{travelSummary?.buffer || '15 minutes'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Transport Method</p>
                <p className="font-medium">{travelSummary?.transportMethod || 'Car'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
