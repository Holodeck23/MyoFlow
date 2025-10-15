'use client'

import { useMemo, useState } from 'react'
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
import { DollarSign, AlertCircle, Euro, CheckCircle, PlusCircle } from 'lucide-react'
import { useSettingsEndpoint } from '../lib/api-config'

type ServiceCategory = 'MASSAGE' | 'YOGA' | 'CONSULTING' | 'OTHER'
type VatRate = 'KLEINUNTERNEHMER' | 'UST_10' | 'UST_13' | 'UST_20'

interface ServiceRate {
  id: string | null
  name: string
  category: ServiceCategory
  durationMin: number
  priceCents: number
  vatRate: VatRate
  description?: string | null
  isDefault?: boolean
  travelRateCents?: number | null
  travelIncluded?: boolean
  isDefaultData?: boolean
}

interface PricingFormData {
  name: string
  category: ServiceCategory
  durationMin: string
  priceEuro: string
  vatRate: VatRate
  description: string
  travelRateEuro: string
  travelIncluded: boolean
  isDefault: boolean
}

interface PricingTabProps {
  isActive?: boolean
}

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  MASSAGE: 'Massage Therapy',
  YOGA: 'Yoga / Movement',
  CONSULTING: 'Consulting / Coaching',
  OTHER: 'Other Services'
}

const VAT_LABELS: Record<VatRate, string> = {
  KLEINUNTERNEHMER: 'Kleinunternehmer (no VAT)',
  UST_10: 'USt 10%',
  UST_13: 'USt 13%',
  UST_20: 'USt 20%'
}

export function PricingTab({ isActive = false }: PricingTabProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [formData, setFormData] = useState<PricingFormData>({
    name: '',
    category: 'MASSAGE',
    durationMin: '60',
    priceEuro: '80.00',
    vatRate: 'KLEINUNTERNEHMER',
    description: '',
    travelRateEuro: '0.80',
    travelIncluded: false,
    isDefault: false
  })

  const {
    data: serviceRates,
    loading: isLoading,
    error,
    refetch
  } = useSettingsEndpoint('pricing', isActive)

  const parsedRates = useMemo<ServiceRate[]>(() => {
    if (!Array.isArray(serviceRates)) return []
    return serviceRates as ServiceRate[]
  }, [serviceRates])

  const handleChange = <K extends keyof PricingFormData>(field: K, value: PricingFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setSuccessMessage(null)
  }

  const parseEuroToCents = (value: string, fallback: number) => {
    const normalised = value.replace(',', '.')
    const parsed = parseFloat(normalised)
    if (Number.isNaN(parsed)) {
      return fallback
    }
    return Math.round(parsed * 100)
  }

  const handleCreateService = async () => {
    setFormError(null)

    if (!formData.name.trim()) {
      setFormError('Service name is required.')
      return
    }

    const duration = parseInt(formData.durationMin, 10)
    if (Number.isNaN(duration) || duration < 15) {
      setFormError('Duration must be at least 15 minutes.')
      return
    }

    const priceCents = parseEuroToCents(formData.priceEuro, 0)
    if (priceCents <= 0) {
      setFormError('Price must be greater than zero.')
      return
    }

    const travelRateCents = parseEuroToCents(formData.travelRateEuro, 0)

    try {
      setIsSubmitting(true)
      const response = await fetch('/api/settings/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          category: formData.category,
          durationMin: duration,
          priceCents,
          vatRate: formData.vatRate,
          description: formData.description.trim() || undefined,
          isDefault: formData.isDefault,
          travelRateCents: travelRateCents || undefined,
          travelIncluded: formData.travelIncluded
        })
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'Failed to create service rate')
      }

      setSuccessMessage('Service rate created successfully.')
      setFormData({
        name: '',
        category: formData.category,
        durationMin: '60',
        priceEuro: formData.priceEuro,
        vatRate: formData.vatRate,
        description: '',
        travelRateEuro: formData.travelRateEuro,
        travelIncluded: false,
        isDefault: false
      })

      await refetch()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to create service rate.')
      setSuccessMessage(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading pricing settings...</p>
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
              <Euro className="w-5 h-5" />
              <span>Service Rate Templates</span>
            </CardTitle>
            <CardDescription>
              Active price templates used for invoices and booking flows.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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

            {parsedRates.length === 0 && (
              <div className="border border-dashed border-gray-300 rounded-md p-6 text-center">
                <p className="text-sm text-gray-600">
                  No service rate templates found. Create your first template to define pricing.
                </p>
              </div>
            )}

            {parsedRates.map((rate) => (
              <Card key={`${rate.id ?? rate.name}`} className="border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span>{rate.name}</span>
                    {rate.isDefault && (
                      <span className="text-xs font-semibold uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        Default
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span>{CATEGORY_LABELS[rate.category]}</span>
                    <span>{rate.durationMin} minutes</span>
                    <span>{VAT_LABELS[rate.vatRate]}</span>
                    {rate.isDefaultData && (
                      <span className="text-orange-600 font-medium">
                        Suggested template (not saved yet)
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Price</span>
                    <span className="text-lg font-semibold text-gray-900">
                      €{(rate.priceCents / 100).toFixed(2)}
                    </span>
                  </div>
                  {rate.travelIncluded ? (
                    <div className="flex items-center justify-between text-sm text-gray-700">
                      <span>Includes travel costs</span>
                      <span className="font-medium">
                        {rate.travelRateCents ? `€${(rate.travelRateCents / 100).toFixed(2)}/km` : 'Flat'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Travel Billing</span>
                      <span>Charged separately</span>
                    </div>
                  )}
                  {rate.description && (
                    <p className="text-sm text-gray-600 border-t pt-3">{rate.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PlusCircle className="w-5 h-5" />
              <span>Create Service Rate</span>
            </CardTitle>
            <CardDescription>
              Define a reusable template for invoice generation and booking quotes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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

            {successMessage && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div className="ml-3">
                    <p className="text-sm text-green-800">{successMessage}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <Label htmlFor="service-name">Service Name</Label>
                <Input
                  id="service-name"
                  placeholder="Klassische Heilmassage 60min"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="service-category">Category</Label>
                <select
                  id="service-category"
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value as ServiceCategory)}
                  className="w-full rounded-md border border-gray-300 p-2"
                >
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="service-duration">Duration (minutes)</Label>
                  <Input
                    id="service-duration"
                    type="number"
                    min="15"
                    step="15"
                    value={formData.durationMin}
                    onChange={(e) => handleChange('durationMin', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="service-price">Price (€)</Label>
                  <Input
                    id="service-price"
                    type="number"
                    min="1"
                    step="0.50"
                    value={formData.priceEuro}
                    onChange={(e) => handleChange('priceEuro', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="service-vat">VAT Rate</Label>
                <select
                  id="service-vat"
                  value={formData.vatRate}
                  onChange={(e) => handleChange('vatRate', e.target.value as VatRate)}
                  className="w-full rounded-md border border-gray-300 p-2"
                >
                  {Object.entries(VAT_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="service-description">Description (optional)</Label>
                <textarea
                  id="service-description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Describe what is included in this service."
                  className="w-full min-h-[90px] rounded-md border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="travel-rate">Travel Surcharge (€ / km)</Label>
                  <Input
                    id="travel-rate"
                    type="number"
                    min="0"
                    step="0.10"
                    value={formData.travelRateEuro}
                    onChange={(e) => handleChange('travelRateEuro', e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave at zero to disable per-kilometre surcharge.
                  </p>
                </div>
                <div className="flex items-center space-x-2 mt-6">
                  <input
                    id="travel-included"
                    type="checkbox"
                    checked={formData.travelIncluded}
                    onChange={(e) => handleChange('travelIncluded', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="travel-included" className="text-sm text-gray-700">
                    Travel costs included in base price
                  </Label>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  id="service-default"
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => handleChange('isDefault', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="service-default" className="text-sm text-gray-700">
                  Set as default template for invoices
                </Label>
              </div>

              <Button onClick={handleCreateService} disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Saving…' : 'Create Service Rate'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Pricing Guidance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <p>
              <strong>Kleinunternehmer Praxis:</strong> Most therapists track prices without VAT.
              Switch to a VAT rate once you exceed the €55,000 threshold or opt-in for VAT.
            </p>
            <p>
              <strong>Travel Costs:</strong> Use the travel surcharge to pass on transportation costs
              for mobile services. Combine with travel settings for precise invoicing.
            </p>
            <p>
              <strong>Templates:</strong> Create templates for each treatment type so invoices stay
              accurate and clients receive consistent pricing.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
