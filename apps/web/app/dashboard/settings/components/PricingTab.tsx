'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from '@myoflow/lib'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Label, Input } from '@/components/ui'
import { AlertCircle, CheckCircle2, Euro, PencilLine, Trash2 } from 'lucide-react'
import { useSettingsEndpoint } from '../lib/api-config'

interface PricingTabProps {
  isActive?: boolean
}

type ServiceCategoryOption = 'MASSAGE' | 'YOGA' | 'CONSULTING' | 'OTHER'
type VatRateOption = 'KLEINUNTERNEHMER' | 'UST_10' | 'UST_13' | 'UST_20'

interface CreateFormValues {
  name: string
  category: ServiceCategoryOption
  durationMin: number
  priceEuro: number
  vatRate: VatRateOption
  description: string
  isDefault: boolean
  travelRateEuro: number
  travelIncluded: boolean
}

interface EditFormValues extends CreateFormValues {}

const CATEGORY_OPTIONS: { value: ServiceCategoryOption; label: string }[] = [
  { value: 'MASSAGE', label: 'Massage' },
  { value: 'YOGA', label: 'Yoga' },
  { value: 'CONSULTING', label: 'Consulting' },
  { value: 'OTHER', label: 'Other' },
]

const VAT_OPTIONS: { value: VatRateOption; label: string }[] = [
  { value: 'KLEINUNTERNEHMER', label: 'Kleinunternehmer (0%)' },
  { value: 'UST_10', label: '10% VAT' },
  { value: 'UST_13', label: '13% VAT' },
  { value: 'UST_20', label: '20% VAT' },
]

const DEFAULT_CREATE_VALUES: CreateFormValues = {
  name: '',
  category: 'MASSAGE',
  durationMin: 60,
  priceEuro: 80,
  vatRate: 'KLEINUNTERNEHMER',
  description: '',
  isDefault: false,
  travelRateEuro: 0.8,
  travelIncluded: false,
}

function eurosToCents(value: number) {
  return Math.round(value * 100)
}

function centsToEuros(value?: number | null) {
  if (value == null) return 0
  return Math.round(value) / 100
}

export function PricingTab({ isActive = false }: PricingTabProps) {
  const { t } = useTranslation()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [editingRateId, setEditingRateId] = useState<string | null>(null)

  const {
    data: pricingResponse,
    loading: isLoading,
    error: fetchError,
    refetch,
  } = useSettingsEndpoint('pricing', isActive)

  const createForm = useForm<CreateFormValues>({
    defaultValues: DEFAULT_CREATE_VALUES,
  })

  const editForm = useForm<EditFormValues>({
    defaultValues: DEFAULT_CREATE_VALUES,
  })

  const serviceRates = useMemo(() => {
    if (!pricingResponse) {
      return []
    }
    return Array.isArray(pricingResponse) ? pricingResponse : []
  }, [pricingResponse])

  useEffect(() => {
    if (editingRateId) {
      const rate = serviceRates.find((item) => item.id === editingRateId)
      if (rate) {
        editForm.reset({
          name: rate.name ?? '',
          category: rate.category ?? 'MASSAGE',
          durationMin: rate.durationMin ?? 60,
          priceEuro: centsToEuros(rate.priceCents),
          vatRate: rate.vatRate ?? 'KLEINUNTERNEHMER',
          description: rate.description ?? '',
          isDefault: Boolean(rate.isDefault),
          travelRateEuro: centsToEuros(rate.travelRateCents ?? 0),
          travelIncluded: Boolean(rate.travelIncluded),
        })
      }
    }
  }, [editingRateId, serviceRates, editForm])

  const handleCreate = createForm.handleSubmit(async (values: CreateFormValues) => {
    setSaveError(null)
    setSaveSuccess(null)
    setIsSaving(true)

    try {
      const response = await fetch('/api/settings/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          category: values.category,
          durationMin: Number(values.durationMin),
          priceCents: eurosToCents(values.priceEuro),
          vatRate: values.vatRate,
          description: values.description || null,
          isDefault: values.isDefault,
          travelRateCents: eurosToCents(values.travelRateEuro),
          travelIncluded: values.travelIncluded,
        }),
      })

      const json = await response.json()

      if (!response.ok || json.success === false) {
        const errorMessage =
          (json && typeof json.error === 'string' && json.error) ||
          'Failed to create service rate'
        setSaveError(errorMessage)
        return
      }

      setSaveSuccess('Service rate created successfully')
      createForm.reset(DEFAULT_CREATE_VALUES)
      await refetch()
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Network error creating service rate')
    } finally {
      setIsSaving(false)
    }
  })

  const handleUpdate = editForm.handleSubmit(async (values: EditFormValues) => {
    if (!editingRateId) return
    setSaveError(null)
    setSaveSuccess(null)
    setIsSaving(true)

    try {
      const response = await fetch(`/api/settings/pricing/${editingRateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          category: values.category,
          durationMin: Number(values.durationMin),
          priceCents: eurosToCents(values.priceEuro),
          vatRate: values.vatRate,
          description: values.description || null,
          isDefault: values.isDefault,
          travelRateCents: eurosToCents(values.travelRateEuro),
          travelIncluded: values.travelIncluded,
        }),
      })

      const json = await response.json()

      if (!response.ok || json.success === false) {
        const errorMessage =
          (json && typeof json.error === 'string' && json.error) ||
          'Failed to update service rate'
        setSaveError(errorMessage)
        return
      }

      setSaveSuccess('Service rate updated successfully')
      setEditingRateId(null)
      await refetch()
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Network error updating service rate')
    } finally {
      setIsSaving(false)
    }
  })

  const handleDelete = async (id: string) => {
    setSaveError(null)
    setSaveSuccess(null)
    setIsSaving(true)
    try {
      const response = await fetch(`/api/settings/pricing/${id}`, {
        method: 'DELETE',
      })
      const json = await response.json().catch(() => ({}))
      if (!response.ok || json.success === false) {
        const errorMessage =
          (json && typeof json.error === 'string' && json.error) || 'Failed to delete service rate'
        setSaveError(errorMessage)
        return
      }
      setSaveSuccess('Service rate archived successfully')
      await refetch()
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Network error deleting service rate')
    } finally {
      setIsSaving(false)
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
              <span>Pricing Configuration</span>
            </CardTitle>
            <CardDescription>
              Manage your service rates and pricing structure. Rates are shared with appointments and
              invoices.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {(fetchError || saveError) && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{saveError ?? fetchError}</p>
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

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Service Name</Label>
                  <Input id="name" {...createForm.register('name', { required: true })} />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    {...createForm.register('category')}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="durationMin">Duration (minutes)</Label>
                  <Input
                    id="durationMin"
                    type="number"
                    min={15}
                    max={480}
                    {...createForm.register('durationMin', { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <Label htmlFor="priceEuro">Price (€)</Label>
                  <Input
                    id="priceEuro"
                    type="number"
                    step="0.01"
                    min={0}
                    {...createForm.register('priceEuro', { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <Label htmlFor="vatRate">VAT Rate</Label>
                  <select
                    id="vatRate"
                    {...createForm.register('vatRate')}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {VAT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="travelRateEuro">Travel Rate (€ per km)</Label>
                  <Input
                    id="travelRateEuro"
                    type="number"
                    step="0.01"
                    min={0}
                    {...createForm.register('travelRateEuro', { valueAsNumber: true })}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    rows={3}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...createForm.register('description')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Default Template</Label>
                    <p className="text-sm text-gray-600">
                      Default rates appear first when booking an appointment.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={createForm.watch('isDefault')}
                    onChange={(event) => createForm.setValue('isDefault', event.target.checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Travel Included</Label>
                    <p className="text-sm text-gray-600">
                      Toggle if travel costs are baked into the service price.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={createForm.watch('travelIncluded')}
                    onChange={(event) =>
                      createForm.setValue('travelIncluded', event.target.checked)
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Add Service Rate'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {serviceRates.map((rate) => {
            const isEditing = editingRateId === rate.id
            return (
              <Card key={rate.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{rate.name}</span>
                    <div className="space-x-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={isEditing ? 'secondary' : 'outline'}
                        onClick={() => setEditingRateId(isEditing ? null : rate.id)}
                      >
                        <PencilLine className="w-4 h-4 mr-2" />
                        {isEditing ? 'Cancel' : 'Edit'}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(rate.id)}
                        disabled={isSaving}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Archive
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    {CATEGORY_OPTIONS.find((option) => option.value === rate.category)?.label ||
                      rate.category}{' '}
                    • €{centsToEuros(rate.priceCents).toFixed(2)} • {rate.durationMin} minutes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <form onSubmit={handleUpdate} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`edit-name-${rate.id}`}>Service Name</Label>
                          <Input id={`edit-name-${rate.id}`} {...editForm.register('name')} />
                        </div>
                        <div>
                          <Label htmlFor={`edit-category-${rate.id}`}>Category</Label>
                          <select
                            id={`edit-category-${rate.id}`}
                            {...editForm.register('category')}
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {CATEGORY_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label htmlFor={`edit-duration-${rate.id}`}>Duration (minutes)</Label>
                          <Input
                            id={`edit-duration-${rate.id}`}
                            type="number"
                            min={15}
                            max={480}
                            {...editForm.register('durationMin', { valueAsNumber: true })}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`edit-price-${rate.id}`}>Price (€)</Label>
                          <Input
                            id={`edit-price-${rate.id}`}
                            type="number"
                            step="0.01"
                            min={0}
                            {...editForm.register('priceEuro', { valueAsNumber: true })}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`edit-vat-${rate.id}`}>VAT Rate</Label>
                          <select
                            id={`edit-vat-${rate.id}`}
                            {...editForm.register('vatRate')}
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {VAT_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label htmlFor={`edit-travel-rate-${rate.id}`}>
                            Travel Rate (€ per km)
                          </Label>
                          <Input
                            id={`edit-travel-rate-${rate.id}`}
                            type="number"
                            step="0.01"
                            min={0}
                            {...editForm.register('travelRateEuro', { valueAsNumber: true })}
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor={`edit-description-${rate.id}`}>Description</Label>
                          <textarea
                            id={`edit-description-${rate.id}`}
                            rows={3}
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            {...editForm.register('description')}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="font-medium">Default Template</Label>
                            <p className="text-sm text-gray-600">
                              Default rates appear first when booking an appointment.
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={editForm.watch('isDefault')}
                            onChange={(event) =>
                              editForm.setValue('isDefault', event.target.checked)
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="font-medium">Travel Included</Label>
                            <p className="text-sm text-gray-600">
                              Toggle if travel costs are baked into the service price.
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={editForm.watch('travelIncluded')}
                            onChange={(event) =>
                              editForm.setValue('travelIncluded', event.target.checked)
                            }
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setEditingRateId(null)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>
                        VAT:{' '}
                        {
                          VAT_OPTIONS.find((option) => option.value === rate.vatRate)?.label ??
                          rate.vatRate
                        }
                      </p>
                      <p>
                        Travel:{' '}
                        {rate.travelIncluded
                          ? 'Included'
                          : `€${centsToEuros(rate.travelRateCents).toFixed(2)} per km`}
                      </p>
                      {rate.description && (
                        <p className="text-gray-700 leading-relaxed">{rate.description}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}

          {serviceRates.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                No service rates configured yet. Add your first rate above.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <p>
              Use default templates for your most common services so they appear first when booking.
            </p>
            <p>
              Travel rates can be set per km or embedded into the base service price. Toggle
              “Travel included” when no additional travel charge is required.
            </p>
            <p>
              VAT settings here should match the tax compliance tab to ensure invoices remain
              consistent.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
