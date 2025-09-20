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
import { AlertCircle } from 'lucide-react'

interface ProfileTabProps {
  profileData: any
}

export function ProfileTab({ profileData }: ProfileTabProps) {
  const { t } = useTranslation()
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    businessName: '',
    businessAddressLine1: '',
    businessAddressLine2: '',
    businessCity: '',
    businessPostalCode: '',
    businessCountry: 'Austria',
    businessEmail: '',
    businessPhone: '',
    designation: 'HEILMASSEUR',
    licenseNumber: '',
    vatStatus: 'KLEINUNTERNEHMER'
  })

  // Fetch profile data
  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/settings/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile)
        setFormData({
          businessName: data.profile.businessName || '',
          businessAddressLine1: data.profile.businessAddressLine1 || '',
          businessAddressLine2: data.profile.businessAddressLine2 || '',
          businessCity: data.profile.businessCity || '',
          businessPostalCode: data.profile.businessPostalCode || '',
          businessCountry: data.profile.businessCountry || 'Austria',
          businessEmail: data.profile.businessEmail || '',
          businessPhone: data.profile.businessPhone || '',
          designation: data.profile.designation || 'HEILMASSEUR',
          licenseNumber: data.profile.licenseNumber || '',
          vatStatus: data.profile.vatStatus || 'KLEINUNTERNEHMER'
        })
      } else {
        setError('Failed to load profile data')
      }
    } catch (err) {
      setError('Network error loading profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)
      const response = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile)
        // Show success message (you could add a toast here)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to save profile')
      }
    } catch (err) {
      setError('Network error saving profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (field: string, value: string) => {
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
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
                  <Label htmlFor="license-number">License Number</Label>
                  <Input
                    id="license-number"
                    value={formData.licenseNumber}
                    onChange={(e) => handleChange('licenseNumber', e.target.value)}
                    placeholder="HM-2025-001234"
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Business Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="address-line-1">Address Line 1</Label>
                  <Input
                    id="address-line-1"
                    value={formData.businessAddressLine1}
                    onChange={(e) => handleChange('businessAddressLine1', e.target.value)}
                    placeholder="Landstraße 15"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address-line-2">Address Line 2 (Optional)</Label>
                  <Input
                    id="address-line-2"
                    value={formData.businessAddressLine2}
                    onChange={(e) => handleChange('businessAddressLine2', e.target.value)}
                    placeholder="Suite 201"
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.businessCity}
                    onChange={(e) => handleChange('businessCity', e.target.value)}
                    placeholder="Linz"
                  />
                </div>
                <div>
                  <Label htmlFor="postal-code">Postal Code</Label>
                  <Input
                    id="postal-code"
                    value={formData.businessPostalCode}
                    onChange={(e) => handleChange('businessPostalCode', e.target.value)}
                    placeholder="4020"
                  />
                </div>
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
                    onChange={(e) => handleChange('designation', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="HEILMASSEUR">Heilmasseur</option>
                    <option value="PHYSIOTHERAPEUT">Physiotherapeut</option>
                    <option value="FITNESSTRAINER">Fitnesstrainer</option>
                    <option value="OSTEOPATH">Osteopath</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="vat-status">VAT Status</Label>
                  <select
                    id="vat-status"
                    value={formData.vatStatus}
                    onChange={(e) => handleChange('vatStatus', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="KLEINUNTERNEHMER">Kleinunternehmer</option>
                    <option value="VAT_REGISTERED">VAT Registered</option>
                    <option value="VAT_EXEMPT">VAT Exempt</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={fetchProfile}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
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
                  {profile?.businessName || 'Not configured'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Business Address</p>
                <p className="font-medium">
                  {profile?.businessAddressLine1 && profile?.businessCity ?
                    `${profile.businessAddressLine1}, ${profile.businessPostalCode} ${profile.businessCity}` :
                    'Not configured'
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">
                  {profile?.businessEmail || 'Not configured'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Professional Title</p>
                <p className="font-medium">
                  {profile?.designation || 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">VAT Status</p>
                <p className="font-medium">
                  {profile?.vatStatus === 'KLEINUNTERNEHMER' ? 'Small Business (Kleinunternehmer)' :
                   profile?.vatStatus === 'VAT_REGISTERED' ? 'VAT Registered' :
                   profile?.vatStatus === 'VAT_EXEMPT' ? 'VAT Exempt' : 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">License Number</p>
                <p className="font-medium">
                  {profile?.licenseNumber || 'Not specified'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}