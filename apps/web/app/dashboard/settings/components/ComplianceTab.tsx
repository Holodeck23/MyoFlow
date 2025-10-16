'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from '@myoflow/lib'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Label, Input, FormField, InfoTooltip } from '@/components/ui'
import { Shield, AlertCircle, CheckCircle2 } from 'lucide-react'
import { assertValidVatNumber } from '@myoflow/lib'
import { useSettingsEndpoint } from '../lib/api-config'
import { RevenueStatusWidget } from './RevenueStatusWidget'
import { TaxValidationWidget } from './TaxValidationWidget'

interface ComplianceTabProps {
  isActive?: boolean
}

interface FormValues {
  vatRegistered: boolean
  kleinunternehmerActive: boolean
  vatNumber: string
  taxAdvisorName: string
  taxAdvisorEmail: string
  taxAdvisorPhone: string
  rksvEnabled: boolean
  cashRegisterId: string
  signatureDeviceId: string
  rksvNotes: string
  taxValidationCompleted: boolean
}

const DEFAULT_FORM_VALUES: FormValues = {
  vatRegistered: false,
  kleinunternehmerActive: true,
  vatNumber: '',
  taxAdvisorName: '',
  taxAdvisorEmail: '',
  taxAdvisorPhone: '',
  rksvEnabled: false,
  cashRegisterId: '',
  signatureDeviceId: '',
  rksvNotes: '',
  taxValidationCompleted: false,
}

export function ComplianceTab({ isActive = false }: ComplianceTabProps) {
  const { t } = useTranslation()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const {
    data: complianceResponse,
    loading: isLoading,
    error: fetchError,
    message: fetchMessage,
    refetch,
  } = useSettingsEndpoint('tax-compliance', isActive)

  const form = useForm<FormValues>({
    defaultValues: DEFAULT_FORM_VALUES,
  })

  useEffect(() => {
    if (complianceResponse) {
      form.reset({
        vatRegistered: Boolean(complianceResponse.vatRegistered),
        kleinunternehmerActive: Boolean(complianceResponse.kleinunternehmerActive),
        vatNumber: complianceResponse.vatNumber ?? '',
        taxAdvisorName: complianceResponse.taxAdvisor?.name ?? '',
        taxAdvisorEmail: complianceResponse.taxAdvisor?.email ?? '',
        taxAdvisorPhone: complianceResponse.taxAdvisor?.phone ?? '',
        rksvEnabled: Boolean(complianceResponse.rksv?.enabled),
        cashRegisterId: complianceResponse.rksv?.cashRegisterId ?? '',
        signatureDeviceId: complianceResponse.rksv?.signatureDeviceId ?? '',
        rksvNotes: complianceResponse.rksv?.notes ?? '',
        taxValidationCompleted: Boolean(complianceResponse.taxValidationCompleted),
      })
    }
  }, [complianceResponse, form])

  const toTrimmedString = (value: unknown) =>
    typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim()

  const validateComplianceVatNumber = (value: unknown) => {
    if (!form.getValues('vatRegistered')) {
      return null
    }
    const trimmed = toTrimmedString(value)
    if (!trimmed) {
      return 'VAT / UID number is required when VAT registered'
    }
    try {
      assertValidVatNumber(trimmed)
      return null
    } catch (error) {
      return error instanceof Error ? error.message : 'Invalid VAT / UID number'
    }
  }

  const handleSubmit = form.handleSubmit(async (values: FormValues) => {
    setSaveError(null)
    setSaveSuccess(null)
    setIsSaving(true)

    try {
      const response = await fetch('/api/settings/tax-compliance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vatRegistered: values.vatRegistered,
          vatNumber: values.vatNumber || null,
          kleinunternehmerActive: values.kleinunternehmerActive,
          taxAdvisor: {
            name: values.taxAdvisorName || null,
            email: values.taxAdvisorEmail || null,
            phone: values.taxAdvisorPhone || null,
          },
          rksv: {
            enabled: values.rksvEnabled,
            cashRegisterId: values.cashRegisterId || null,
            signatureDeviceId: values.signatureDeviceId || null,
            notes: values.rksvNotes || null,
          },
          taxValidationCompleted: values.taxValidationCompleted,
        }),
      })

      const json = await response.json()

      if (!response.ok || (json && json.success === false)) {
        const errorMessage =
          (json && typeof json.error === 'string' && json.error) ||
          'Failed to update compliance settings'
        setSaveError(errorMessage)
        return
      }

      setSaveSuccess('Compliance settings saved successfully')
      await refetch()
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : 'Network error saving compliance settings',
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
          <p className="text-gray-500">Loading compliance settings...</p>
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
              <h3 className="font-medium text-red-800">Failed to load compliance settings</h3>
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
      <div className="lg:col-span-2 space-y-6">
        <RevenueStatusWidget />
        <TaxValidationWidget />
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Tax Compliance</CardTitle>
              <CardDescription>
                Manage VAT status, Kleinunternehmer threshold, and tax advisor details.
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
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-2">
                    <div>
                      <Label className="font-medium">VAT Registered</Label>
                      <p className="text-sm text-gray-600">
                        Toggle if you have registered for Austrian VAT (UID)
                      </p>
                    </div>
                    <InfoTooltip fieldKey="vatNumber" className="mt-1" />
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={form.watch('vatRegistered')}
                    onChange={(event) => {
                      form.setValue('vatRegistered', event.target.checked)
                      form.setValue('kleinunternehmerActive', !event.target.checked)
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-2">
                    <div>
                      <Label className="font-medium">Kleinunternehmer</Label>
                      <p className="text-sm text-gray-600">
                        Applies to businesses under €55,000 annual revenue
                      </p>
                    </div>
                    <InfoTooltip fieldKey="kleinunternehmer" className="mt-1" />
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={form.watch('kleinunternehmerActive')}
                    onChange={(event) => {
                      form.setValue('kleinunternehmerActive', event.target.checked)
                      if (event.target.checked) {
                        form.setValue('vatRegistered', false)
                        form.setValue('vatNumber', '')
                      }
                    }}
                  />
                </div>
                <FormField
                  key={form.watch('vatRegistered') ? 'vat-on' : 'vat-off'}
                  name="vatNumber"
                  control={form.control}
                  label="VAT / UID Number"
                  hint="Format: ATU12345678"
                  tooltip="vatNumber"
                  onBlurValidate={validateComplianceVatNumber}
                  className="md:col-span-1"
                  renderInput={({ field }) => (
                    <Input
                      id="vatNumber"
                      placeholder="ATU12345678"
                      {...field}
                      value={typeof field.value === 'string' ? field.value : ''}
                      disabled={!form.watch('vatRegistered')}
                    />
                  )}
                />
              </section>

              <section className="space-y-4">
                <h3 className="text-lg font-medium">Tax Advisor</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="taxAdvisorName">Advisor Name</Label>
                    <Input id="taxAdvisorName" {...form.register('taxAdvisorName')} />
                  </div>
                  <div>
                    <Label htmlFor="taxAdvisorEmail">Advisor Email</Label>
                    <Input
                      id="taxAdvisorEmail"
                      type="email"
                      {...form.register('taxAdvisorEmail')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="taxAdvisorPhone">Advisor Phone</Label>
                    <Input id="taxAdvisorPhone" {...form.register('taxAdvisorPhone')} />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-2">
                    <div>
                      <Label className="font-medium">RKSV Enabled</Label>
                      <p className="text-sm text-gray-600">
                        Track cash register compliance requirements and audits
                      </p>
                    </div>
                    <InfoTooltip fieldKey="rksvThreshold" className="mt-1" />
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={form.watch('rksvEnabled')}
                    onChange={(event) => form.setValue('rksvEnabled', event.target.checked)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cashRegisterId">Cash Register ID</Label>
                    <Input id="cashRegisterId" {...form.register('cashRegisterId')} />
                  </div>
                  <div>
                    <Label htmlFor="signatureDeviceId">Signature Device ID</Label>
                    <Input id="signatureDeviceId" {...form.register('signatureDeviceId')} />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="rksvNotes">RKSV Notes</Label>
                    <textarea
                      id="rksvNotes"
                      rows={3}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      {...form.register('rksvNotes')}
                    />
                  </div>
                </div>
              </section>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Professional Validation Complete</Label>
                  <p className="text-sm text-gray-600">
                    Mark once an Austrian Steuerberater has validated your tax logic.
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={form.watch('taxValidationCompleted')}
                  onChange={(event) =>
                    form.setValue('taxValidationCompleted', event.target.checked)
                  }
                />
              </div>

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
            <CardTitle className="text-lg">Compliance Summary</CardTitle>
            <CardDescription>
              Current VAT and RKSV status based on stored compliance data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">VAT Registered</p>
              <p className="font-medium">
                {form.watch('vatRegistered') ? 'Yes' : 'No (Kleinunternehmer)'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">VAT / UID Number</p>
              <p className="font-medium">{form.watch('vatNumber') || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tax Advisor</p>
              <p className="font-medium">
                {form.watch('taxAdvisorName') || 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">RKSV Enabled</p>
              <p className="font-medium">{form.watch('rksvEnabled') ? 'Enabled' : 'Disabled'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" disabled>
                <Shield className="w-4 h-4 mr-2" />
                Download Tax Report
              </Button>
              <Button variant="outline" className="w-full justify-start" disabled>
                <AlertCircle className="w-4 h-4 mr-2" />
                Compliance Help
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Additional compliance tools coming soon.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
