'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from '@myoflow/lib'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Label, Input } from '@/components/ui'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { useSettingsEndpoint } from '../lib/api-config'
import { InvoiceBrandingWidget } from './InvoiceBrandingWidget'

interface ProfileTabProps {
  isActive?: boolean
}

interface FormValues {
  businessName: string
  businessEmail: string
  businessPhone: string
  businessWebsite: string
  businessAddressLine1: string
  businessAddressLine2: string
  businessCity: string
  businessPostalCode: string
  businessCountry: string
  designation: string
  vatStatus: string
  licenseNumber: string
  uidNumber: string
  iban: string
  publicProfileSlug: string
  publicProfileDescription: string
}

const DESIGNATION_OPTIONS = [
  { value: 'HEILMASSEUR', label: 'Heilmasseur' },
  { value: 'MEDIZINISCHER_MASSEUR', label: 'Medizinischer Masseur' },
  { value: 'GEWERBLICHER_MASSEUR', label: 'Gewerblicher Masseur' },
] as const

const VAT_OPTIONS = [
  { value: 'KLEINUNTERNEHMER', label: 'Kleinunternehmer (§6 Abs 1 Z 27 UStG)' },
  { value: 'UST_10', label: 'USt 10%' },
  { value: 'UST_13', label: 'USt 13%' },
  { value: 'UST_20', label: 'USt 20%' },
] as const

const DEFAULT_FORM_VALUES: FormValues = {
  businessName: '',
  businessEmail: '',
  businessPhone: '',
  businessWebsite: '',
  businessAddressLine1: '',
  businessAddressLine2: '',
  businessCity: '',
  businessPostalCode: '',
  businessCountry: 'Austria',
  designation: 'HEILMASSEUR',
  vatStatus: 'KLEINUNTERNEHMER',
  licenseNumber: '',
  uidNumber: '',
  iban: '',
  publicProfileSlug: '',
  publicProfileDescription: '',
}

export function ProfileTab({ isActive = false }: ProfileTabProps) {
  const { t } = useTranslation()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const {
    data: profileResponse,
    loading: isLoading,
    error: fetchError,
    message: fetchMessage,
    refetch,
  } = useSettingsEndpoint('profile', isActive)

  const profileData = useMemo(() => {
    if (!profileResponse) {
      return null
    }
    return profileResponse
  }, [profileResponse])

  const form = useForm<FormValues>({
    defaultValues: DEFAULT_FORM_VALUES,
  })

  useEffect(() => {
    if (profileData) {
      form.reset({
        businessName: profileData.businessName ?? '',
        businessEmail: profileData.businessEmail ?? '',
        businessPhone: profileData.businessPhone ?? '',
        businessWebsite: profileData.businessWebsite ?? '',
        businessAddressLine1: profileData.businessAddress ?? '',
        businessAddressLine2: '',
        businessCity: '',
        businessPostalCode: '',
        businessCountry: 'Austria',
        designation: profileData.designation ?? 'HEILMASSEUR',
        vatStatus: profileData.vatStatus ?? 'KLEINUNTERNEHMER',
        licenseNumber: profileData.chamberRegistration ?? '',
        uidNumber: profileData.uidNumber ?? '',
        iban: profileData.iban ?? '',
        publicProfileSlug: profileData.publicProfileSlug ?? '',
        publicProfileDescription: profileData.publicProfileDescription ?? '',
      })
    }
  }, [profileData, form])

  const handleSubmit = form.handleSubmit(async (values: FormValues) => {
    setSaveError(null)
    setSaveSuccess(null)
    setIsSaving(true)

    try {
      const response = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: values.businessName || undefined,
          businessAddress: values.businessAddressLine1 || undefined,
          businessEmail: values.businessEmail || undefined,
          businessPhone: values.businessPhone || undefined,
          businessWebsite: values.businessWebsite || undefined,
          designation: values.designation,
          chamberRegistration: values.licenseNumber || null,
          vatStatus: values.vatStatus,
          uidNumber: values.uidNumber || null,
          iban: values.iban || null,
          publicProfileSlug: values.publicProfileSlug || null,
          publicProfileDescription: values.publicProfileDescription || null,
        }),
      })

      const json = await response.json()

      if (!response.ok || (json && json.success === false)) {
        const errorMessage =
          (json && typeof json.error === 'string' && json.error) ||
          'Failed to save profile settings'
        setSaveError(errorMessage)
        return
      }

      setSaveSuccess('Profile updated successfully')
      await refetch()
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Network error saving profile')
    } finally {
      setIsSaving(false)
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading profile...</p>
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
              <h3 className="font-medium text-red-800">Failed to load profile</h3>
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

  const currentProfile = profileData ?? DEFAULT_FORM_VALUES

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.profile.title', 'Profil-Einstellungen')}</CardTitle>
            <CardDescription>
              {t(
                'settings.profile.description',
                'Verwalten Sie Ihre Geschäftsdaten und professionellen Qualifikationen.',
              )}
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
                <h3 className="text-lg font-medium">Business Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="business-name">Practice Name</Label>
                    <Input id="business-name" {...form.register('businessName')} />
                  </div>
                  <div>
                    <Label htmlFor="business-email">Business Email</Label>
                    <Input id="business-email" type="email" {...form.register('businessEmail')} />
                  </div>
                  <div>
                    <Label htmlFor="business-phone">Business Phone</Label>
                    <Input id="business-phone" {...form.register('businessPhone')} />
                  </div>
                  <div>
                    <Label htmlFor="business-website">Business Website</Label>
                    <Input id="business-website" {...form.register('businessWebsite')} />
                  </div>
                  <div>
                    <Label htmlFor="license-number">Chamber Registration</Label>
                    <Input id="license-number" {...form.register('licenseNumber')} />
                  </div>
                  <div>
                    <Label htmlFor="uid-number">UID Number</Label>
                    <Input
                      id="uid-number"
                      placeholder="ATU12345678"
                      {...form.register('uidNumber')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="iban">IBAN</Label>
                    <Input id="iban" placeholder="AT61 1904 3002 3457 3201" {...form.register('iban')} />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-lg font-medium">Business Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="address-line-1">Address Line 1</Label>
                    <Input id="address-line-1" {...form.register('businessAddressLine1')} />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="address-line-2">Address Line 2 (Optional)</Label>
                    <Input id="address-line-2" {...form.register('businessAddressLine2')} />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" {...form.register('businessCity')} />
                  </div>
                  <div>
                    <Label htmlFor="postal-code">Postal Code</Label>
                    <Input id="postal-code" {...form.register('businessPostalCode')} />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" {...form.register('businessCountry')} />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-lg font-medium">Professional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="designation">Professional Title</Label>
                    <select
                      id="designation"
                      {...form.register('designation')}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {DESIGNATION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="vat-status">VAT Status</Label>
                    <select
                      id="vat-status"
                      {...form.register('vatStatus')}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {VAT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="public-profile-slug">Public Profile Slug</Label>
                    <Input
                      id="public-profile-slug"
                      placeholder="praxis-mueller"
                      {...form.register('publicProfileSlug')}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="public-profile-description">Public Profile Description</Label>
                    <textarea
                      id="public-profile-description"
                      rows={4}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      {...form.register('publicProfileDescription')}
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

        <InvoiceBrandingWidget />
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t('settings.profile.current.title', 'Current Profile')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Practice Name</p>
                <p className="font-medium">{currentProfile.businessName || 'Not configured'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Business Email</p>
                <p className="font-medium">{currentProfile.businessEmail || 'Not configured'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Business Phone</p>
                <p className="font-medium">{currentProfile.businessPhone || 'Not configured'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Professional Title</p>
                <p className="font-medium">
                  {DESIGNATION_OPTIONS.find((option) => option.value === currentProfile.designation)
                    ?.label || 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">VAT Status</p>
                <p className="font-medium">
                  {VAT_OPTIONS.find((option) => option.value === currentProfile.vatStatus)?.label ||
                    'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">UID Number</p>
                <p className="font-medium">{currentProfile.uidNumber || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">IBAN</p>
                <p className="font-medium">{currentProfile.iban || 'Not specified'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
