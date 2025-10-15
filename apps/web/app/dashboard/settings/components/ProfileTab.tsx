'use client'

import { useState, useEffect } from 'react'
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
import { AlertCircle, CheckCircle } from 'lucide-react'
import { useSettingsEndpoint } from '../lib/api-config'
import { InvoiceBrandingWidget } from './InvoiceBrandingWidget'

type TherapistDesignation = 'HEILMASSEUR' | 'MEDIZINISCHER_MASSEUR' | 'GEWERBLICHER_MASSEUR'
type VatStatusOption = 'KLEINUNTERNEHMER' | 'UST_10' | 'UST_13' | 'UST_20'

interface ProfileFormData {
  businessName: string
  businessAddress: string
  businessEmail: string
  businessPhone: string
  businessWebsite: string
  designation: TherapistDesignation
  chamberRegistration: string
  vatStatus: VatStatusOption
}

interface ProfileTabProps {
  isActive?: boolean
}

export function ProfileTab({ isActive = false }: ProfileTabProps) {
  const { t } = useTranslation()
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState<ProfileFormData>({
    businessName: '',
    businessAddress: '',
    businessEmail: '',
    businessPhone: '',
    businessWebsite: '',
    designation: 'HEILMASSEUR',
    chamberRegistration: '',
    vatStatus: 'KLEINUNTERNEHMER'
  })

  // Only fetch when tab is active
  const { data: profile, loading: isLoading, error, refetch } = useSettingsEndpoint('profile', isActive)

  // Update form data when profile loads
  useEffect(() => {
    if (profile?.profile) {
      const profileData = profile.profile
      setFormData({
        businessName: profileData.businessName || '',
        businessAddress: profileData.businessAddress || '',
        businessEmail: profileData.businessEmail || '',
        businessPhone: profileData.businessPhone || '',
        businessWebsite: profileData.businessWebsite || '',
        designation: profileData.designation || 'HEILMASSEUR',
        chamberRegistration: profileData.chamberRegistration || '',
        vatStatus: profileData.vatStatus || 'KLEINUNTERNEHMER'
      })
    }
  }, [profile])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setSaveError(null)
      const response = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: formData.businessName,
          businessAddress: formData.businessAddress,
          businessEmail: formData.businessEmail,
          businessPhone: formData.businessPhone,
          businessWebsite: formData.businessWebsite || null,
          designation: formData.designation,
          chamberRegistration: formData.chamberRegistration || null,
          vatStatus: formData.vatStatus
        })
      })

      if (response.ok) {
        await refetch() // Refresh the profile data
        setSuccess(true)
      } else {
        const errorData = await response.json()
        setSaveError(errorData.error || 'Failed to save profile')
        setSuccess(false)
      }
    } catch (err) {
      setSaveError('Network error saving profile')
      setSuccess(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = <K extends keyof ProfileFormData>(field: K, value: ProfileFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="font-medium text-red-800">Failed to load profile</h3>
              <p className="text-red-600 text-sm mt-1">{error}</p>
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
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.profile.title', 'Profil-Einstellungen')}</CardTitle>
            <CardDescription>
              {t('settings.profile.description', 'Verwalten Sie Ihre Geschäftsdaten und professionellen Qualifikationen.')}
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

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div className="ml-3">
                    <p className="text-sm text-green-800">Profile updated successfully.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Business Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Business Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="business-name">Practice Name</Label>
                  <Input
                    id="business-name"
                    value={formData.businessName}
                    onChange={(e) => handleChange('businessName', e.target.value)}
                    placeholder="Dr. Sarah Müller Physiotherapie"
                  />
                </div>
                <div>
                  <Label htmlFor="business-email">Business Email</Label>
                  <Input
                    id="business-email"
                    type="email"
                    value={formData.businessEmail}
                    onChange={(e) => handleChange('businessEmail', e.target.value)}
                    placeholder="praxis@example.at"
                  />
                </div>
                <div>
                  <Label htmlFor="business-phone">Business Phone</Label>
                  <Input
                    id="business-phone"
                    value={formData.businessPhone}
                    onChange={(e) => handleChange('businessPhone', e.target.value)}
                    placeholder="+43 732 123456"
                  />
                </div>
                <div>
                  <Label htmlFor="business-website">Business Website</Label>
                  <Input
                    id="business-website"
                    value={formData.businessWebsite}
                    onChange={(e) => handleChange('businessWebsite', e.target.value)}
                    placeholder="https://www.example.at"
                  />
                </div>
                <div>
                  <Label htmlFor="license-number">Chamber Registration</Label>
                  <Input
                    id="license-number"
                    value={formData.chamberRegistration}
                    onChange={(e) => handleChange('chamberRegistration', e.target.value)}
                    placeholder="HM-2025-001234"
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Business Address</h3>
              <div>
                <Label htmlFor="address-full">Address</Label>
                <textarea
                  id="address-full"
                  value={formData.businessAddress}
                  onChange={(e) => handleChange('businessAddress', e.target.value)}
                  placeholder="Landstraße 15, 4020 Linz"
                  className="w-full min-h-[100px] rounded-md border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Enter the full official business address as it should appear on invoices.
                </p>
              </div>
            </div>

            {/* Professional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Professional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="designation">Professional Title</Label>
                  <select
                    id="designation"
                    value={formData.designation}
                    onChange={(e) => handleChange('designation', e.target.value as TherapistDesignation)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="HEILMASSEUR">Heilmasseur</option>
                    <option value="MEDIZINISCHER_MASSEUR">Medizinischer Masseur</option>
                    <option value="GEWERBLICHER_MASSEUR">Gewerblicher Masseur</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="vat-status">VAT Status</Label>
                  <select
                    id="vat-status"
                    value={formData.vatStatus}
                    onChange={(e) => handleChange('vatStatus', e.target.value as VatStatusOption)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="KLEINUNTERNEHMER">Kleinunternehmer</option>
                    <option value="UST_10">USt 10%</option>
                    <option value="UST_13">USt 13%</option>
                    <option value="UST_20">USt 20%</option>
                  </select>
                </div>
              </div>
            </div>

            {saveError && (
              <div className="p-3 bg-red-100 border border-red-300 rounded-md">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <p className="text-red-800 text-sm">{saveError}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => refetch()}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Branding Settings */}
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
                <p className="font-medium">
                  {profile?.profile?.businessName || 'Not configured'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Business Address</p>
                <p className="font-medium">
                  {profile?.profile?.businessAddress || 'Not configured'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">
                  {profile?.profile?.businessEmail || 'Not configured'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Professional Title</p>
                <p className="font-medium">
                  {profile?.profile?.designation || 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">VAT Status</p>
                <p className="font-medium">
                  {profile?.profile?.vatStatus === 'KLEINUNTERNEHMER' ? 'Small Business (Kleinunternehmer)' :
                   profile?.profile?.vatStatus === 'UST_10' ? 'USt 10%' :
                   profile?.profile?.vatStatus === 'UST_13' ? 'USt 13%' :
                   profile?.profile?.vatStatus === 'UST_20' ? 'USt 20%' : 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">License Number</p>
                <p className="font-medium">
                  {profile?.profile?.chamberRegistration || 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tax Validation</p>
                <p className="font-medium">
                  {profile?.profile?.taxValidationCompleted
                    ? `Completed on ${profile.profile.taxValidatedAt ? new Date(profile.profile.taxValidatedAt).toLocaleDateString('de-AT') : 'unknown date'}`
                    : 'Pending'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
